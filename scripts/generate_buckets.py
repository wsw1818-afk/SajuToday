#!/usr/bin/env python3
"""Council B안 v2: bucket 7개 자동 생성 (요일별 다른 본문)
사용자 신고 "1주 단위도 비슷" → bucket 3→7 확장
같은 사주 사용자가 한 주 7가지 본문 회전 보장
"""
import json, re, sys, os
sys.stdout.reconfigure(encoding='utf-8')

INPUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'generated', 'narratives_generated_v1plus.json')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'generated', 'narratives_generated_v1plus.json')


def hash_str(s: str) -> int:
    h = 0
    for c in s:
        h = ((h << 5) - h) + ord(c)
        h = h & 0xFFFFFFFF
    return h


# 7개 bucket × 6개 prefix = 42가지 시작 표현 (한 사용자가 한 주 다 다른 prefix 봄)
BUCKET_PREFIXES = {
    1: [  # 핵심 강조형
        '오늘 한 가지만 짚는다면, ',
        '핵심부터 말하면, ',
        '먼저 흐름부터 보면, ',
        '한 마디로 요약하면, ',
        '오늘의 큰 그림은, ',
        '결정적인 한 줄로는, ',
    ],
    2: [  # 거리두기형
        '오늘 한 발 떨어져 보면, ',
        '한 발짝 물러서면, ',
        '천천히 풀어 보면, ',
        '오늘 자리에서 보면, ',
        '잠시 거리를 두고 보면, ',
        '관조하듯 살피면, ',
    ],
    3: [  # 결/흐름형
        '오늘 결을 따라가 보면, ',
        '하루 흐름으로 짚으면, ',
        '오늘 결로 풀어보면, ',
        '큰 흐름으로 보면, ',
        '결의 방향으로 가면, ',
        '오늘 흐름을 짚으면, ',
    ],
    4: [  # 감각형
        '문득 살펴보니, ',
        '느낌부터 말하면, ',
        '직감으로는, ',
        '오늘 결이 부드럽게, ',
        '마음으로 짚으면, ',
        '차분히 들여다보면, ',
    ],
    5: [  # 시간/오늘형
        '오늘 하루를 열며, ',
        '아침을 시작하며, ',
        '하루의 첫걸음으로, ',
        '오늘 시작점에서, ',
        '하루의 결을 잡으며, ',
        '오늘이라는 시간 안에서, ',
    ],
    6: [  # 사색형
        '잠시 돌아보면, ',
        '깊이 들여다보면, ',
        '곰곰이 생각하면, ',
        '한 호흡 멈추고 보면, ',
        '조용히 살피면, ',
        '내면을 따라가 보면, ',
    ],
}


def paraphrase_bucket(text: str, key: str, bucket_num: int) -> str:
    """bucket 1~6에 대해 prefix + 단어 치환"""
    if bucket_num == 0:
        return text  # 원본 유지

    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    h = hash_str(f'{key}_b{bucket_num}')

    prefixes = BUCKET_PREFIXES.get(bucket_num, [''])
    prefix = prefixes[abs(h) % len(prefixes)]

    if paragraphs:
        paragraphs[0] = prefix + paragraphs[0]
    result = '\n\n'.join(paragraphs)

    # 단어 치환 강도 (bucket 클수록 변환 더 강하게)
    intensity = 'high' if bucket_num >= 4 else 'normal'
    return apply_word_swaps(result, h, intensity=intensity, bucket_num=bucket_num)


# 단어 치환 풀 (의미 보존, 표현만 변경)
SWAP_POOLS = [
    # 동사 어미
    (r'있어요\.', ['있네요.', '있답니다.', '있어요.', '있죠.']),
    (r'좋아요\.', ['좋네요.', '괜찮아요.', '좋아요.', '훌륭해요.']),
    (r'돼요\.', ['됩니다.', '돼요.', '되네요.']),
    # 부사
    (r'(?<![\w])특히(?=\s)', ['유독', '특히', '특별히', '눈에 띄게']),
    (r'(?<![\w])정말(?=\s)', ['진짜', '정말', '꽤', '제법']),
    (r'(?<![\w])혹시(?=\s)', ['만약', '혹시', '어쩌면', '혹여']),
    # 시간
    (r'아침(?=에는|\s)', ['이른 시간', '아침', '하루 시작', '새벽']),
    (r'저녁(?=에는|\s)', ['해 질 무렵', '저녁', '하루 마무리', '땅거미 질 때']),
    (r'낮(?=에는|\s|\.)', ['한낮', '낮', '한가운데', '햇살 강할 때']),
    # 사람 표현
    (r'곁의 사람', ['가까운 사람', '곁의 사람', '주변 사람', '가까운 인연']),
    (r'곁에 있는 사람', ['옆에 있는 사람', '곁에 있는 사람', '주변에 있는 사람', '가까이 있는 사람']),
    # 운세 표현
    (r'기운이 (\S+)', [r'에너지가 \1', r'기운이 \1', r'흐름이 \1', r'결이 \1']),
    (r'흐름이 (\S+)', [r'결이 \1', r'흐름이 \1', r'기운이 \1', r'리듬이 \1']),
    # 결말
    (r'분위기예요\.', ['분위기네요.', '분위기예요.', '결이에요.', '느낌이에요.']),
    (r'시간이에요\.', ['시기예요.', '시간이에요.', '때예요.', '순간이에요.']),
    (r'결이에요\.', ['흐름이에요.', '결이에요.', '시간이에요.', '느낌이에요.']),
]


def apply_word_swaps(text: str, seed: int, intensity: str = 'normal', bucket_num: int = 0) -> str:
    """단어 치환 (bucket 번호로 다른 후보 선택)"""
    counter = [0]
    for i, (pattern, candidates) in enumerate(SWAP_POOLS):
        local_seed = seed + i * 17 + bucket_num * 31

        def picker(m):
            idx = counter[0]
            counter[0] += 1
            chosen = candidates[(local_seed + idx) % len(candidates)]
            if '\\1' in chosen and m.lastindex:
                chosen = chosen.replace('\\1', m.group(1))
            return chosen

        text = re.sub(pattern, picker, text)
        if intensity == 'high':
            counter[0] = local_seed + 999 + bucket_num
            text = re.sub(pattern, picker, text)

    return text


def main():
    print(f"입력: {INPUT}")
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    overall = data.get('overall', {})
    categories = data.get('categories', {})

    # 기존 bucket 키 제거 (원본 _0 키로 시작)
    overall_clean = {k: v for k, v in overall.items() if not re.search(r'_[1-6]$', k)}
    categories_clean = {k: v for k, v in categories.items() if not re.search(r'_[1-6]$', k)}

    new_overall = dict(overall_clean)
    new_categories = dict(categories_clean)

    print(f"\n=== overall {len(overall_clean)}개에 대해 bucket 1~6 생성 중... ===")
    for k, v in overall_clean.items():
        for b in range(1, 7):
            new_overall[f'{k}_{b}'] = paraphrase_bucket(v, k, b)

    print(f"  생성: {len(overall_clean) * 6}개 (각 키당 6개 bucket)")

    print(f"\n=== categories {len(categories_clean)}개에 대해 bucket 1~6 생성 중... ===")
    for k, v in categories_clean.items():
        for b in range(1, 7):
            h = hash_str(f'{k}_b{b}')
            intensity = 'high' if b >= 4 else 'normal'
            new_categories[f'{k}_{b}'] = apply_word_swaps(v, h, intensity=intensity, bucket_num=b)

    print(f"  생성: {len(categories_clean) * 6}개")

    new_data = {'overall': new_overall, 'categories': new_categories}
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"\n저장: {OUTPUT}")
    print(f"전체 overall: {len(new_overall)} (원본 {len(overall_clean)} + bucket1~6 {len(overall_clean)*6})")
    print(f"전체 categories: {len(new_categories)} (원본 {len(categories_clean)} + bucket1~6 {len(categories_clean)*6})")

    # 7일치 시뮬레이션
    print("\n=== 같은 사주 한 주 시뮬레이션 (비견_yongsin_장생) ===")
    sample_key = '비견_yongsin_장생'
    for b in range(7):
        bk = f'{sample_key}_{b}' if b > 0 else sample_key
        text = new_overall.get(bk, '없음')
        print(f"\n[Day {b+1}] bucket {b}:")
        print(f"  {text[:100]}...")


if __name__ == "__main__":
    main()
