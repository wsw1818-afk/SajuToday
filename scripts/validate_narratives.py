#!/usr/bin/env python3
"""
운세 텍스트 자동 검증 (QA 합의안 반영)

검증 항목:
1. 길이 (20~600자)
2. 금지어 (4종 세트)
3. 키 완전성 (overall 360, categories 120)
4. 다양성 (어절 빈도 Gini 계수)
5. 1인 가구 배려 (관계 의존 어절 비율)
"""
import json
import re
import sys
import os
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')

INPUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
    os.path.dirname(__file__), '..', 'src', 'data', 'generated', 'narratives_generated_v1plus.json'
)

# === 검증 설정 ===
FORBIDDEN = [
    (r'오전만\s*잘\s*넘기면\s*오후', '오전→오후 패턴'),
    (r'오후\s*3시', '오후 3시 클리셰'),
    (r'점심때|점심\s*시간', '점심때 클리셰'),
    (r'주변\s*사람들?', '주변 사람 강요'),
    (r'긍정적인\s*마음|긍정적인\s*자세', '긍정 마음 클리셰'),
    (r'메모하세요|메모해\s*두', '메모 강요'),
    (r'잘\s*될\s*거예요|잘\s*풀릴\s*거예요', '단정적 긍정'),
    (r'힘내세요|응원할게요|파이팅', '뻔한 격려'),
]

# Phase A.5 + Phase 1: 깨진 문법 검출 (ERROR 레벨)
BROKEN_GRAMMAR = [
    (r'에는쯤|때는쯤|게는쯤', '에는쯤 합성어'),
    (r'에는로|때는로|게는로', '에는로 합성어'),
    (r'흐름가(?!요)', '흐름가 조사 오류'),
    (r'있다면을|있다면이', '조건절 + 격조사 충돌'),
    (r'결말가(?=\s|$|[을를는은이가의에서로와과])', '결말가 조사 오류 (Phase1)'),
    (r'(때|시간|무렵|순간)은(?=\s|$)', '받침 없는 명사 + 은 (Phase1)'),
    (r'결과를\s+(꾸준함의|시간이|결국 길이)', '결과를 + 단절 (Phase1)'),
]

# Phase 1 + B안: 신 클리셰 폭증 검출
# bucket 도입(원본+_1+_2 = 3배)으로 인해 임계값도 3배 조정
# bucket 7배 적용 → 임계값도 7배
POST_TRANSFORM_FREQ = [
    ('뜻밖의', 420),
    ('생각지 못한', 420),
    ('예기치 못한', 420),
    ('인연이 닿는 사람', 350),
    ('오늘 만나는 사람', 350),
    ('곁에 있는 사람', 350),
]

# 1인 가구 배려: 이 어절이 너무 많으면 경고
RELATION_WORDS = ['동료', '상사', '선배', '가족', '연인', '저녁 약속']
RELATION_THRESHOLD = 0.3  # 30% 초과 시 경고

# 길이 범위
LENGTH_MIN_OVERALL = 50
LENGTH_MAX_OVERALL = 800
LENGTH_MIN_CAT = 20
LENGTH_MAX_CAT = 400

# 예상 키 수
EXPECTED_OVERALL = 360
EXPECTED_CATEGORIES = 120


def gini(counts):
    """어절 빈도의 Gini 계수 (불평등 지표). 0=완전평등, 1=완전불평등"""
    if not counts:
        return 0.0
    sorted_counts = sorted(counts)
    n = len(sorted_counts)
    cumsum = 0
    for i, c in enumerate(sorted_counts, 1):
        cumsum += i * c
    total = sum(sorted_counts)
    if total == 0:
        return 0.0
    return (2 * cumsum) / (n * total) - (n + 1) / n


def main():
    print(f"검증 대상: {INPUT}\n")
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    errors = []
    warnings = []
    info = []

    overall = data.get('overall', {})
    categories = data.get('categories', {})

    # 1. 키 개수
    info.append(f"overall: {len(overall)}/{EXPECTED_OVERALL}")
    info.append(f"categories: {len(categories)}/{EXPECTED_CATEGORIES}")
    if len(overall) < EXPECTED_OVERALL:
        warnings.append(f"overall 키 부족: {len(overall)}/{EXPECTED_OVERALL}")

    # 2. 금지어
    print("=== 금지어 검증 ===")
    all_texts = []
    for k, v in overall.items():
        all_texts.append((f"overall/{k}", v))
    for k, v in categories.items():
        all_texts.append((f"categories/{k}", v))

    forbidden_hits = {}
    for pattern, label in FORBIDDEN:
        hits = [k for k, t in all_texts if re.search(pattern, t)]
        forbidden_hits[label] = len(hits)
        symbol = '✅' if len(hits) == 0 else ('⚠️' if len(hits) < 10 else '❌')
        print(f"  {symbol} {label:20} {len(hits):3}건")
        # bucket 7배 적용 → 임계값도 7배 (30 → 210)
        if len(hits) >= 210:
            errors.append(f"금지어 다수: {label} ({len(hits)}건)")
        elif len(hits) > 0:
            warnings.append(f"금지어 잔존: {label} ({len(hits)}건)")

    # 2.5 깨진 문법 (ERROR 레벨)
    print("\n=== 깨진 문법 검증 ===")
    for pattern, label in BROKEN_GRAMMAR:
        hits = [k for k, t in all_texts if re.search(pattern, t)]
        symbol = '✅' if len(hits) == 0 else '❌'
        print(f"  {symbol} {label:30} {len(hits):3}건")
        if len(hits) > 0:
            errors.append(f"깨진 문법: {label} ({len(hits)}건)")

    # 2.7 신 클리셰 폭증 검증 (Phase 1 신규)
    print("\n=== 신 클리셰 빈도 (50~60회 임계값) ===")
    for word, threshold in POST_TRANSFORM_FREQ:
        cnt = sum(1 for _, t in all_texts if word in t)
        symbol = '✅' if cnt < threshold else ('⚠️' if cnt < threshold * 1.5 else '❌')
        print(f"  {symbol} '{word}': {cnt}회 (임계 {threshold})")
        if cnt >= threshold * 1.5:
            errors.append(f"신 클리셰 폭증: '{word}' {cnt}회")
        elif cnt >= threshold:
            warnings.append(f"신 클리셰 경계: '{word}' {cnt}회")

    # 2.6 첫 문장 다양성
    print("\n=== 첫 문장 다양성 ===")
    starts = Counter()
    for _, t in all_texts:
        first = t.lstrip()[:2]
        starts[first] += 1
    top1, top1_cnt = starts.most_common(1)[0]
    top1_pct = top1_cnt / len(all_texts) * 100
    symbol = '✅' if top1_pct < 30 else ('⚠️' if top1_pct < 45 else '❌')
    print(f"  {symbol} 가장 흔한 시작: '{top1}' ({top1_cnt}건, {top1_pct:.1f}%)")
    if top1_pct >= 45:
        errors.append(f"첫 문장 편중: '{top1}' {top1_pct:.0f}%")
    elif top1_pct >= 30:
        warnings.append(f"첫 문장 편중: '{top1}' {top1_pct:.0f}%")
    print(f"  Top 5 첫 글자:")
    for s, c in starts.most_common(5):
        print(f"    '{s:3}' {c:>4}건 ({c/len(all_texts)*100:.1f}%)")

    # 3. 길이
    print("\n=== 길이 검증 ===")
    short_overall = [k for k, t in overall.items() if len(t) < LENGTH_MIN_OVERALL]
    long_overall = [k for k, t in overall.items() if len(t) > LENGTH_MAX_OVERALL]
    short_cat = [k for k, t in categories.items() if len(t) < LENGTH_MIN_CAT]
    long_cat = [k for k, t in categories.items() if len(t) > LENGTH_MAX_CAT]

    print(f"  overall 너무 짧음 ({LENGTH_MIN_OVERALL}자 미만): {len(short_overall)}건")
    print(f"  overall 너무 긺 ({LENGTH_MAX_OVERALL}자 초과): {len(long_overall)}건")
    print(f"  category 너무 짧음 ({LENGTH_MIN_CAT}자 미만): {len(short_cat)}건")
    print(f"  category 너무 긺 ({LENGTH_MAX_CAT}자 초과): {len(long_cat)}건")
    if short_overall: warnings.append(f"overall 짧은 항목: {len(short_overall)}건")
    if long_cat: warnings.append(f"category 긴 항목: {len(long_cat)}건")

    # 4. 어절 다양성
    print("\n=== 어절 다양성 (Gini 계수) ===")
    word_counter = Counter()
    for _, t in all_texts:
        for word in re.split(r'\s+', t):
            w = re.sub(r'[^\w가-힣]', '', word)
            if len(w) >= 2:
                word_counter[w] += 1

    counts = list(word_counter.values())
    g = gini(counts)
    print(f"  Gini 계수: {g:.3f} (0=평등 ↔ 1=불평등)")
    print(f"  총 고유 어절: {len(word_counter)}")
    print(f"  Top 10 빈출 어절:")
    for word, cnt in word_counter.most_common(10):
        print(f"    {word:15} {cnt}회")

    if g > 0.85:
        warnings.append(f"어절 다양성 낮음 (Gini={g:.3f})")

    # 5. 관계 의존 어절 비율
    print("\n=== 1인 가구 배려 (관계 의존 어절) ===")
    total_count = len(all_texts)
    for word in RELATION_WORDS:
        cnt = sum(1 for _, t in all_texts if word in t)
        pct = cnt / total_count
        symbol = '✅' if pct < RELATION_THRESHOLD else '⚠️'
        print(f"  {symbol} '{word}': {cnt}/{total_count} ({pct*100:.1f}%)")
        if pct >= RELATION_THRESHOLD:
            warnings.append(f"'{word}' 등장 {pct*100:.0f}% (1인 가구 배려)")

    # 6. 파일 크기
    print("\n=== 파일 크기 ===")
    size = os.path.getsize(INPUT)
    print(f"  {size/1024:.1f} KB ({'OK' if size < 600*1024 else 'WARN: 번들 부담'})")

    # === 최종 보고 ===
    print("\n" + "=" * 50)
    print(f"📊 검증 결과")
    print("=" * 50)
    print(f"INFO:   {len(info)}")
    for s in info: print(f"  ℹ️  {s}")
    print(f"WARN:   {len(warnings)}")
    for s in warnings: print(f"  ⚠️  {s}")
    print(f"ERROR:  {len(errors)}")
    for s in errors: print(f"  ❌ {s}")

    if errors:
        print("\n❌ 검증 실패")
        sys.exit(1)
    elif warnings:
        print("\n⚠️  경고 있음 (통과 가능)")
        sys.exit(0)
    else:
        print("\n✅ 모든 검증 통과")
        sys.exit(0)


if __name__ == "__main__":
    main()
