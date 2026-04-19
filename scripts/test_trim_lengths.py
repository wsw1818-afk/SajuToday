#!/usr/bin/env python3
"""trimByTarget 길이 편차 시뮬레이션
TypeScript 알고리즘과 동일하게 구현해서 5일치 길이 편차 측정.
사용자 우려: "날짜 교차 핑퐁 안 되도록"
"""
import json, re, sys, statistics
sys.stdout.reconfigure(encoding='utf-8')

with open('src/data/generated/narratives_generated_v1plus.json', 'r', encoding='utf-8') as f:
    data = json.load(f)


def trim_by_target(text: str, target: int, max_chars: int) -> str:
    if not text:
        return ''
    if len(text) <= max_chars:
        return text
    # 종결 분리 (Python 호환: 단일 문자 lookbehind)
    sentences = re.split(r'(?<=[\.\!\?])\s+', text)
    sentences = [s.strip() for s in sentences if s.strip()]

    result = ''
    for s in sentences:
        nxt = (result + ' ' + s) if result else s
        if len(nxt) <= max_chars:
            result = nxt
            if len(result) >= target * 0.85:
                break
        else:
            if result:
                break
            # 첫 문장 자체가 max 초과 → 어절 절단
            words = s.split(' ')
            acc = ''
            for w in words:
                if len((acc + ' ' + w) if acc else w) > max_chars:
                    break
                acc = (acc + ' ' + w) if acc else w
            result = acc + '…'
            break
    return result or (text[:max_chars] + '…')


# 5일치 시뮬레이션 — 같은 사주 기준, 십신만 바뀜
ten_gods = ['비견', '겁재', '식신', '상관', '편재']
yongsin_types = ['yongsin']  # 같은 사람 = 같은 용신타입
twelve_stages = ['장생', '목욕', '관대', '건록', '제왕']  # 12운성도 일별로 바뀜

print('=== trimByTarget 5일치 길이 편차 (detail 220/280) ===')
detail_lens = []
for tg, st in zip(ten_gods, twelve_stages):
    key = f'{tg}_yongsin_{st}'
    if key not in data['overall']:
        continue
    raw = data['overall'][key]
    trimmed = trim_by_target(raw, 220, 280)
    detail_lens.append(len(trimmed))
    print(f'  {key:25} 원본 {len(raw):>4}자 → 절단 {len(trimmed):>4}자')

if detail_lens:
    print(f'\n  통계: 평균 {statistics.mean(detail_lens):.0f}자, '
          f'최소 {min(detail_lens)}, 최대 {max(detail_lens)}, '
          f'편차 ±{(max(detail_lens)-min(detail_lens))//2}자')

print('\n=== 카테고리 길이 편차 (90/120) — wealth 5개 ===')
cat_keys = [k for k in data['categories'].keys() if k.startswith('wealth_')][:5]
cat_lens = []
for k in cat_keys:
    raw = data['categories'][k]
    trimmed = trim_by_target(raw, 90, 120)
    cat_lens.append(len(trimmed))
    print(f'  {k:30} 원본 {len(raw):>4}자 → 절단 {len(trimmed):>4}자')

if cat_lens:
    print(f'\n  통계: 평균 {statistics.mean(cat_lens):.0f}자, '
          f'편차 ±{(max(cat_lens)-min(cat_lens))//2}자')

# 한 화면 합계 (5일치)
print('\n=== 한 화면 합계 5일치 (detail + 카테고리 4개 추정 평균) ===')
for i in range(5):
    tg = ten_gods[i]
    st = twelve_stages[i]
    detail_key = f'{tg}_yongsin_{st}'
    if detail_key not in data['overall']:
        continue
    detail = trim_by_target(data['overall'][detail_key], 220, 280)
    cats = []
    for cat in ['wealth', 'love', 'work', 'health']:
        ck = f'{cat}_{tg}_yongsin'
        if ck in data['categories']:
            cats.append(trim_by_target(data['categories'][ck], 90, 120))
    total = len(detail) + sum(len(c) for c in cats) + 50  # 라벨/줄바꿈
    print(f'  Day{i+1}({tg}_{st}): detail {len(detail)} + 카테고리합 {sum(len(c) for c in cats)} = 총 ~{total}자')
