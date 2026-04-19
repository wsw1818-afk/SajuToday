#!/usr/bin/env python3
"""단락 셔플 데이터 생성 — 가짜 bucket 1~6 폐기 + 슬롯 풀 빌드

원본: narratives_generated_v1plus.json (3.2MB, bucket 7배 확장 = 가짜)
→ narratives_slots_v1.json (실제 다양성)

구조:
{
  "overall_slots": {
    "비견_yongsin": {
      "slot0": [{"stage":"장생","text":"..."}, ...],  # 도입
      "slot1": [...],  # 핵심
      "slot2": [...],  # 조언
      "slot3": [...]   # 마무리
    }, ...
  },
  "categories_slots": { ... }  # 동일 구조
}

런타임에 dateHash로 4슬롯 각각 독립 선택 → 12^4 = 20,736가지 조합/그룹
"""
import sys, json, re
sys.stdout.reconfigure(encoding='utf-8')

INPUT = 'src/data/generated/narratives_generated_v1plus.json'
OUTPUT = 'src/data/generated/narratives_slots_v1.json'


def split_sentences(text):
    """한국어 문장 분리"""
    text = re.sub(r'\s+', ' ', text)
    sents = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sents if s.strip() and len(s.strip()) > 5]


def split_4slots(text):
    """본문을 4슬롯 (도입/핵심/조언/마무리)로 분리"""
    sents = split_sentences(text)
    n = len(sents)
    if n < 4:
        return None
    if n <= 5:
        return [sents[0:1], sents[1:2], sents[2:4], sents[4:n]]
    elif n <= 8:
        return [sents[0:1], sents[1:3], sents[3:6], sents[6:n]]
    elif n <= 11:
        return [sents[0:2], sents[2:4], sents[4:8], sents[8:n]]
    else:
        return [sents[0:2], sents[2:5], sents[5:9], sents[9:n]]


def build_slot_pools(data_dict, key_extractor):
    """원본 데이터에서 슬롯 풀 구축
    key_extractor: 키에서 그룹 키 추출하는 함수 (예: '비견_yongsin_장생' → '비견_yongsin')
    """
    groups = {}  # group_key -> {slot0:[], slot1:[], slot2:[], slot3:[]}
    skipped_short = 0
    skipped_bucket = 0

    for k, text in data_dict.items():
        # bucket 1~6 스킵 (가짜 다양성)
        if re.search(r'_[1-6]$', k):
            skipped_bucket += 1
            continue

        slots = split_4slots(text)
        if slots is None:
            skipped_short += 1
            continue

        group_key = key_extractor(k)
        if group_key is None:
            continue

        if group_key not in groups:
            groups[group_key] = {f'slot{i}': [] for i in range(4)}

        # 슬롯별 파편 추가 (중복 제거를 위해 set 변환은 마지막에)
        for i, slot_sents in enumerate(slots):
            joined = ' '.join(slot_sents).strip()
            if joined:
                groups[group_key][f'slot{i}'].append(joined)

    # 중복 제거 + slot0(도입)은 같은 첫 4자 중복 제거 (사용자 신고: 같은 시작 자주 나옴)
    for gk, slots_dict in groups.items():
        for slot_name in slots_dict:
            if slot_name == 'slot0':
                # slot0: 첫 4자 기준 dedup (같은 도입 단어 회피)
                seen_starts = set()
                kept = []
                for t in slots_dict[slot_name]:
                    start = t[:4]
                    if start not in seen_starts and t not in kept:
                        seen_starts.add(start)
                        kept.append(t)
                slots_dict[slot_name] = kept
            else:
                # slot1~3: 본문 전체 dedup만
                seen = []
                for t in slots_dict[slot_name]:
                    if t not in seen:
                        seen.append(t)
                slots_dict[slot_name] = seen

    return groups, skipped_short, skipped_bucket


def overall_key_extractor(key):
    """비견_yongsin_장생 → 비견_yongsin"""
    parts = key.split('_')
    if len(parts) >= 3:
        return f'{parts[0]}_{parts[1]}'
    return None


def category_key_extractor(key):
    """wealth_비견_yongsin → wealth_비견_yongsin (그대로, 카테고리는 12운성 차원 없음)"""
    return key


def main():
    print(f'입력: {INPUT}')
    with open(INPUT, 'r', encoding='utf-8') as f:
        d = json.load(f)

    overall = d.get('overall', {})
    categories = d.get('categories', {})

    print(f'\n원본 overall: {len(overall)}개 (bucket 1~6 포함)')
    print(f'원본 categories: {len(categories)}개')

    # overall: 같은 (십신, 용신) 그룹으로 슬롯 풀
    print('\n=== overall 슬롯 풀 빌드 ===')
    overall_pools, short, bucket = build_slot_pools(overall, overall_key_extractor)
    print(f'  그룹 수: {len(overall_pools)} (10 십신 × 3 용신 = 30 예상)')
    print(f'  가짜 bucket 1~6 제거: {bucket}개')
    print(f'  너무 짧아서 스킵: {short}개')

    # 그룹별 슬롯 변형 수 확인
    sample_group = list(overall_pools.keys())[0]
    print(f'\n  샘플 그룹: {sample_group}')
    for slot_name, variants in overall_pools[sample_group].items():
        print(f'    {slot_name}: {len(variants)}개 변형')

    # categories: 같은 키 내에서 슬롯 풀 (각 카테고리는 짧으니 12운성 그룹화 없이)
    # categories는 본문이 짧음 → 슬롯 분리 안 하고 그대로 두는 게 안전
    print('\n=== categories는 셔플 미적용 (짧은 본문) ===')

    # 출력
    out = {
        'overall_slots': overall_pools,
        'categories': {k: v for k, v in categories.items() if not re.search(r'_[1-6]$', k)},
        'meta': {
            'version': 'slots_v1',
            'source': 'narratives_generated_v1plus.json',
            'bucket_removed': bucket,
            'overall_groups': len(overall_pools),
            'note': 'overall은 4슬롯 셔플, categories는 원본 유지 (bucket 1~6 제거)'
        }
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    # 파일 크기 비교
    import os
    in_size = os.path.getsize(INPUT) / 1024
    out_size = os.path.getsize(OUTPUT) / 1024
    print(f'\n=== 파일 크기 ===')
    print(f'  원본: {in_size:.0f} KB ({in_size/1024:.2f} MB)')
    print(f'  슬롯: {out_size:.0f} KB ({out_size/1024:.2f} MB)')
    print(f'  감소: {(in_size-out_size)/in_size*100:.1f}%')

    # 다양성 추정
    avg_per_slot = sum(
        sum(len(s) for s in g.values()) / 4
        for g in overall_pools.values()
    ) / len(overall_pools)
    print(f'\n=== 다양성 추정 ===')
    print(f'  슬롯당 평균 변형: {avg_per_slot:.1f}개')
    print(f'  그룹당 조합 수: {avg_per_slot:.0f}^4 = {int(avg_per_slot**4):,}가지')
    print(f'  → "1달 같은 톤 1번" 수학적 충족')


if __name__ == '__main__':
    main()
