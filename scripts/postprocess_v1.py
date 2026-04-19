#!/usr/bin/env python3
"""
Phase A.5: v1 운세 텍스트 후처리 (재시공판)

수정 사항:
- 시간 패턴 (에는)? 옵셔널 + 대체 후보 "에는" 중복 → 깨진 문법 280건 발생 → 수정
- 첫 문장 다양화 ("오늘은/어머" 66% → 30% 이하)
- 신 클리셰 빈도 분산 (4종 후보 → 8~12종 후보)
- 조사 안전 처리 (받침 자동 판별)
- categories 섹션 시각 표현 정리

원본 narratives_generated.json 그대로 두고
narratives_generated_v1plus.json 으로 저장.
"""
import json
import re
import sys
import os
from typing import Tuple, List
from collections import Counter

sys.stdout.reconfigure(encoding='utf-8')
os.environ['PYTHONIOENCODING'] = 'utf-8'

INPUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'generated', 'narratives_generated.json')
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'generated', 'narratives_generated_v1plus.json')


def has_jongseong(ch: str) -> bool:
    """한글 음절의 받침 유무"""
    if not ch or not ('가' <= ch <= '힣'):
        return False
    return (ord(ch) - 0xAC00) % 28 != 0


def hash_str(s: str) -> int:
    h = 0
    for c in s:
        h = ((h << 5) - h) + ord(c)
        h = h & 0xFFFFFFFF
    return h


# === 치환 규칙 ===
# 핵심 원칙:
#   1. 시간 표현 대체 후보는 "에는" 같은 조사를 포함하지 않음 → 원문 조사 보존
#   2. 후보 풀을 8~12개로 늘려 신 클리셰 발생 억제
#   3. 첫 문장 시작 패턴은 별도 후처리 단계에서 처리

REPLACEMENTS: List[Tuple[str, List[str]]] = [
    # ===== 시간 표현 (조사 안전) =====
    # "오후 3시 이후/부터/이전" 모두 잡기 (원문에 조사가 붙어있음)
    (r'오후\s*3시(\s*이후|\s*이전|\s*부터|\s*까지)?', [
        '저녁 무렵', '해 질 무렵', '오후 늦게', '하루가 저물 때',
        '저녁 시간대', '오후 끝자락', '늦은 오후', '해가 기울 때',
    ]),
    (r'오전\s*10시(\s*이후|\s*부터|\s*까지)?\s*(오후\s*1시(\s*사이)?)?', [
        '한낮 무렵', '점심 전후', '낮 한가운데', '햇살이 길어질 때',
    ]),
    (r'오후\s*2시(쯤|경)?', ['이른 오후', '낮 끝자락', '햇살이 강할 때']),
    (r'오후\s*\d+시(부터\s*\d+시)?(\s*사이)?', [
        '오후 어느 무렵', '저녁이 가까울 때', '하루가 천천히 저물 때',
    ]),

    # "오전만 잘 넘기면 오후" → 패턴 깨기
    (r'오전만\s*잘\s*넘기면\s*오후(에는)?', [
        '하루 흐름을 따라가다 보면',
        '천천히 리듬을 잡다 보면',
        '발걸음을 가볍게 하면',
    ]),

    # "점심때 / 점심 시간 / 점심때쯤 / 점심 시간쯤" 모두 잡기
    (r'점심\s*시간쯤(에는)?', ['낮 한가운데', '낮 시간', '햇살 가장 따스할 때']),
    (r'점심때쯤(에는)?', ['낮 한가운데', '낮 무렵', '햇살이 따뜻할 때']),
    (r'점심\s*시간(에는)?', ['낮 시간', '한낮', '햇살이 따뜻한 시간']),
    (r'점심때(에는)?', ['낮 무렵', '한낮', '햇살이 따뜻할 때']),

    # ===== 마음 / 자세 (다양화) =====
    (r'긍정적인\s*마음으로', [
        '편안한 마음으로', '여유로운 마음으로', '담담한 마음으로',
        '가벼운 마음으로', '차분한 마음으로', '느긋한 마음으로',
        '열린 마음으로', '소박한 마음으로',
    ]),
    (r'긍정적인\s*자세로', [
        '담담한 자세로', '여유로운 자세로', '차분한 자세로',
        '느긋한 자세로', '편안한 자세로',
    ]),
    (r'긍정적인\s*마음', [
        '편안한 마음', '담담한 태도', '차분한 마음',
        '여유로운 태도', '소박한 마음', '느긋한 마음',
    ]),
    (r'긍정적인\s*자세', ['차분한 자세', '담담한 자세', '여유로운 자세']),

    # ===== 사람 (1인 가구 배려, 다양화) =====
    (r'주변\s*사람들?과(의)?\s*', [
        '오늘 만나는 사람과 ', '인연이 닿는 사람과 ',
        '대화가 통하는 사람과 ', '곁에 있는 사람과 ',
        '소중한 사람과 ', '함께하는 사람과 ',
        '마음이 닿는 사람과 ',
    ]),
    (r'주변\s*사람들?에게', [
        '대화가 닿는 사람에게', '오늘 마주치는 사람에게',
        '인연이 있는 사람에게', '곁의 사람에게',
        '마음이 가는 사람에게',
    ]),
    (r'주변\s*사람들?의', [
        '곁에 있는 사람의', '인연이 있는 사람의',
        '오늘 만나는 사람의', '대화가 닿는 사람의',
    ]),
    (r'주변\s*사람들?', [
        '곁의 사람', '인연이 닿는 사람', '오늘 만나는 사람',
        '대화가 통하는 사람', '마음이 가는 사람',
    ]),

    # ===== 메모 / 기록 (다양화) =====
    (r'메모해\s*두세요|메모해\s*두면', [
        '한 줄 적어두세요', '한쪽에 적어두면', '간단히 기록해두면',
        '잊기 전에 적어두세요', '그 자리에서 적어두면',
    ]),
    (r'메모하세요', [
        '한 줄 적어두세요', '간단히 기록해두세요',
        '잊기 전에 적으세요', '잠깐 적어두세요',
    ]),
    (r'메모하는\s*습관(이\s*있다면)?', [
        '간단히 기록하는 습관이 있다면',
        '떠오르는 생각을 적어두는 편이라면',
        '짧게라도 기록하는 편이라면',
    ]),
    (r'메모지에', ['한쪽에', '노트 한 켠에', '메모장에']),
    (r'메모해\s*뒀다가', ['적어뒀다가', '기록해뒀다가', '한 줄 남겨뒀다가']),
    (r'메모할\s*수\s*있게', ['기록할 수 있게', '적어둘 수 있게']),
    (r'메모해서', ['적어서', '기록해서', '간단히 적어서']),
    (r'메모를\s*해', ['기록을 해', '한 줄 적어', '간단히 적어']),
    (r'간단한\s*메모', ['간단한 기록', '짧은 노트', '한 줄 메모지']),
    (r'메모(?!리)', ['기록', '노트', '한 줄 메모']),

    # ===== 단정적 긍정 → 부드럽게 =====
    (r'잘\s*될\s*거예요', [
        '흐름이 자연스럽게 풀려요',
        '한 걸음씩 풀려가요',
        '시간이 답을 줘요',
        '천천히 풀려가요',
    ]),
    (r'잘\s*풀릴\s*거예요', [
        '천천히 풀려요',
        '시간이 답을 줘요',
        '결국 길이 보여요',
    ]),
    (r'분명\s*좋은\s*결과', [
        '의외의 결과', '뜻밖의 흐름', '괜찮은 결과', '예상보다 나은 결과',
    ]),

    # ===== 격려 표현 제거 (빈 문자열) =====
    (r'\s*힘내세요\.?', [' ']),
    (r'\s*응원할게요\.?', [' ']),
    (r'\s*파이팅(!|\.)?', [' ']),

    # ===== 직장 표현 (1인 자영업/프리랜서 배려) =====
    (r'상사나\s*선배', ['윗분이나 선배', '경험 있는 분', '나보다 앞서 간 분']),
    (r'상사에게', ['윗분에게', '책임자에게', '결정권자에게']),
    (r'상사가', ['윗분이', '책임자가', '결정권자가']),
    (r'상사', ['윗분', '책임자', '결정권자']),

    # ===== 클로징 다양화 =====
    (r'좋은\s*하루\s*되세요', [
        '오늘 하루 잘 보내세요', '천천히 하루 보내세요',
        '여유롭게 하루 보내세요', '담담히 하루 보내세요',
    ]),
    (r'행복한\s*하루', [
        '여유로운 하루', '담담한 하루', '편안한 하루',
    ]),

    # ===== 동료/가족 (1인 배려) =====
    (r'동료들?과', [
        '함께 일하는 사람과', '같은 방향을 보는 사람과',
        '뜻이 맞는 사람과',
    ]),
    (r'가족들?과', [
        '소중한 사람과', '곁에 있는 사람과', '아끼는 사람과',
    ]),
]


# === 첫 문장 다양화 (Phase A.5 신규) ===
# "오늘은~" 시작 232건(48%) → 다양한 시작으로 분산

FIRST_SENTENCE_REPLACEMENTS: List[Tuple[str, List[str]]] = [
    # "오늘 하루는 뭔가 ~" 패턴
    (r'^오늘\s*하루는\s*뭔가\s*', [
        '뭔가 ', '왠지 모르게 ', '눈에 띄게 ', '미묘하게 ',
        '잠시 멈추고 보면 ', '결이 다르게 ', '슬며시 ',
    ]),
    # "오늘은 뭔가 ~" 패턴
    (r'^오늘은\s*뭔가\s*', [
        '왠지 ', '슬며시 ', '미묘하게 ', '눈에 띄게 ',
        '결이 다르게 ', '잠깐 보면 ',
    ]),
    # "오늘은 ~" 단순 패턴 (일부만 변경 — 너무 많이 바꾸면 어색)
    (r'^오늘은\s+', [
        '오늘은 ',  # 50%는 유지
        '오늘 같은 날은 ',
        '하루 시작이 ',
        '아침을 열면 ',
        '눈을 뜨면 ',
    ]),
    # "어머, " 추임새 — 너무 많이 등장 (86건/18%)
    (r'^어머,?\s*', [
        '',  # 70%는 추임새 제거
        '',
        '',
        '잠시 보면, ',
        '가만히 보면, ',
        '오늘 결이 ',
        '느낌이 ',
    ]),
    # "음, " 추임새
    (r'^음,?\s*', [
        '', '잠깐 보면, ', '가만히 살피면, ', '결을 보면, ',
    ]),
    # "어휴, " 추임새 (14건)
    (r'^어휴,?\s*', [
        '한숨 한 번 내쉬면, ', '잠시 멈추면, ', '천천히 보면, ',
    ]),
    # "어, " 추임새 (3건)
    (r'^어,?\s*', ['', '잠깐 보면, ']),
]


def apply_replacements(text: str, key: str) -> Tuple[str, int]:
    """텍스트에 일반 치환 규칙 적용"""
    base_hash = hash_str(key)
    count = 0

    for i, (pattern, candidates) in enumerate(REPLACEMENTS):
        seed = base_hash + i * 31

        # nonlocal 변수를 클로저로 캡처
        match_idx = [0]

        def picker(_match):
            count_here = match_idx[0]
            match_idx[0] += 1
            chosen = candidates[(seed + count_here) % len(candidates)]
            return chosen

        new_text, n = re.subn(pattern, picker, text)
        count += n
        text = new_text

    return text, count


def apply_first_sentence_diversify(text: str, key: str) -> Tuple[str, int]:
    """첫 문장 시작 패턴 다양화 (개행 후 첫 단락에만 적용)"""
    base_hash = hash_str(key + '_first')
    count = 0

    for i, (pattern, candidates) in enumerate(FIRST_SENTENCE_REPLACEMENTS):
        seed = base_hash + i * 17

        def picker(m):
            nonlocal count
            count += 1
            return candidates[seed % len(candidates)]

        new_text, n = re.subn(pattern, picker, text, count=1)
        if n > 0:
            count += n - 1  # picker 안에서 +1 했으니 보정
            text = new_text

    return text, count


def fix_jongseong_errors(text: str) -> Tuple[str, int]:
    """조사 받침 오류 수정 (Council Phase1 검증 강화)"""
    fixes = 0
    # "흐름가" → "흐름이"
    text, n = re.subn(r'흐름가(?=\s|[가-힣]|$)', '흐름이', text)
    fixes += n
    # 받침 있는 명사 + 가/는 잘못된 조사 (Council 발견)
    # "결말가" → "결말이" (말 + ㄹ 받침)
    text, n = re.subn(r'결말가', '결말이', text)
    fixes += n
    # "때은/시간은/무렵은/순간은" → "는"
    text, n = re.subn(r'(때|시간|무렵|순간)은(?=[\s가-힣]|$)', r'\1는', text)
    fixes += n
    # "있다면을/있다면이" → "있다면"
    text, n = re.subn(r'있다면[을이]\b', '있다면', text)
    fixes += n
    # "결과를 + [동사절]" 단절 패턴 — Council Phase1 발견
    # 원래 "결과가 있을 거예요"가 "결과가 있을 + 후보 클로징"으로 치환되면서 발생
    # "결과를 꾸준함의 답이 와요" → "결과가 따라와요"
    # "결과를 시간이 답을 줘요" → "결과가 차분히 와요"
    # "결과를 결국 길이 보여요" → "결과가 결국 길을 열어줘요"
    text, n = re.subn(r'결과를\s+꾸준함의\s*답이\s*와요', '결과가 따라와요', text)
    fixes += n
    text, n = re.subn(r'결과를\s+시간이\s*답을\s*줘요', '결과가 차분히 와요', text)
    fixes += n
    text, n = re.subn(r'결과를\s+결국\s*길이\s*보여요', '결과가 결국 길을 열어줘요', text)
    fixes += n
    # 일반 "X를 [조사 없이 동사절 시작]" 단절도 잡음 (Y가 [동사절] 형태로)
    text, n = re.subn(r'결과를\s+(흐름이\s*자연스럽게\s*풀려요|한\s*걸음씩\s*풀려가요|천천히\s*풀려가요)', r'결과가 \1', text)
    fixes += n
    return text, fixes


def diversify_closings(text: str, key: str) -> str:
    """클로징/반복 표현 다양화 (Phase 1 — Council 합의)
    측정된 반복 패턴:
    - "걱정하지 마세요" 89회
    - "좋은 결과가 있을 거예요" 57회
    - "게 좋을 것 같아요" 32회
    - "큰 도움이 될 거예요" 25회
    - "예상치 못한" 257회 (너무 많이)
    - "오늘 하루는 마/뭔" 32회

    각 패턴을 6~10개 변형으로 분산해 같은 키 그룹에서 다른 변형이 선택되게 함.
    """
    base_hash = hash_str(key + '_close')

    closings = [
        # "좋은 결과가 있을 거예요" → 8가지
        (r'좋은\s*결과가\s*있을\s*거예요\.?', [
            '바라던 모양으로 매듭이 지어져요.',
            '하루 끝에 가벼운 미소가 남아요.',
            '스스로 납득할 만한 결과가 생겨요.',
            '돌아보면 잘했다 싶은 하루가 돼요.',
            '오늘의 노력은 헛되지 않아요.',
            '예상보다 괜찮은 흐름이 닿아요.',
            '작지만 분명한 성과가 따라와요.',
            '하루를 마칠 때 안도가 찾아와요.',
        ]),
        # "걱정하지 마세요" → 8가지 (89회 → 분산)
        (r'(?:너무\s*)?걱정하지\s*마세요\.?', [
            '조급해할 일은 아니에요.',
            '서두르지 않아도 괜찮아요.',
            '한 발씩만 가도 충분해요.',
            '마음에 짐을 두지 않아도 돼요.',
            '버겁게 여기지 않아도 돼요.',
            '불안에 무게를 두지 않아도 좋아요.',
            '평소처럼 호흡하면 돼요.',
            '오늘은 그냥 흘려보내도 괜찮아요.',
        ]),
        # "게 좋을 것 같아요" → 6가지
        (r'(\S+)는?\s*게\s*좋을\s*것\s*같아요\.?', [
            r'\1는 편이 자연스러워요.',
            r'\1는 흐름이 어울려요.',
            r'\1는 게 오늘의 결이에요.',
            r'\1면 마음이 편해요.',
            r'\1는 쪽이 잘 맞아요.',
            r'\1는 게 무난해요.',
        ]),
        # "큰 도움이 될 거예요" → 6가지
        (r'큰\s*도움이\s*될\s*거예요\.?', [
            '든든한 받침이 돼요.',
            '예상 밖의 힘이 돼요.',
            '의외의 도움이 돼요.',
            '필요할 때 손을 내밀어줘요.',
            '뜻밖의 응원이 돼요.',
            '결정에 무게를 실어줘요.',
        ]),
        # "얻을 수 있을 거예요" → 5가지
        (r'얻을\s*수\s*있을\s*거예요\.?', [
            '손에 잡혀요.',
            '결실로 돌아와요.',
            '내 것이 돼요.',
            '기다린 만큼 닿아요.',
            '꾸준함의 답이 와요.',
        ]),
        # "예상치 못한" → 8가지 분산 (257회 → 분산)
        # 주의: "뜻밖의"는 원본에 이미 59회 있어서 제외 (Council Phase1 검증 발견)
        (r'예상치\s*못한', [
            '생각지 못한', '갑작스런', '우연한', '미처 몰랐던', '예기치 못한',
            '엉뚱한', '눈에 안 보였던', '슬며시 다가온',
        ]),
        # "뜻밖의" 원본 59회 + 신규 분산 → 80회 폭증 → 부분 치환으로 60 이하로
        # 짝수 인덱스만 변경 (절반 보존, 절반 다양화)
        (r'뜻밖의', [
            '뜻밖의', '의외의', '뜻밖의', '느닷없는', '뜻밖의', '돌연한',
        ]),
        # "의견 충돌이 있을 수" → 5가지
        (r'의견\s*충돌이?\s*있을\s*수', [
            '서로 다른 생각이 부딪힐 수',
            '결이 다른 의견이 만날 수',
            '입장 차이가 드러날 수',
            '논의가 길어질 수',
            '대화가 엇갈릴 수',
        ]),
        # "일이 꼬일 수" → 5가지
        (r'일이\s*꼬일\s*수', [
            '흐름이 막힐 수',
            '진행이 더뎌질 수',
            '계획이 어긋날 수',
            '리듬이 깨질 수',
            '엇박자가 날 수',
        ]),
        # "의외의 결과" → 5가지 (받침 있는 단어로 통일 — 흐름가 조사 오류 방지)
        (r'의외의\s*결과', [
            '뜻밖의 결과',
            '예상 밖의 결과',
            '생각지 못한 결과',
            '낯선 결말',
            '다른 모양의 결과',
        ]),
    ]

    # 시작 표현 다양화 (Council 추가 발견 — 첫 멘트 중복)
    # "돈 쓸 일이 많" 22회, "오늘 결이 살아" 10회, "마음이 몽글몽글" 8회 등
    extra_starts = [
        # "돈 쓸 일이 많~" 22회 → 5가지
        (r'^돈\s*쓸\s*일이\s*많(아\s*보이지만|아질\s*수도\s*있는?\s*때예요|아\s*보이는\s*날이에요|아\s*보일\s*수\s*있어요)?', [
            '지출이 늘어나는 흐름이지만',
            '돈이 빠져나갈 일이 많아 보이지만',
            '소비가 잦아지는 결이지만',
            '쓸 일이 자꾸 생기지만',
            '주머니가 가벼워질 수 있지만',
        ]),
        # "오늘 결이 살아 있는 기운이~" 10회 → 5가지 (긴 패턴 먼저 매칭)
        (r'오늘\s*결이\s*살아\s*있는\s*기운이', [
            '오늘 흐르는 기운이',
            '오늘 가까이 온 기운이',
            '오늘 분명한 기운이',
            '오늘 또렷한 기운이',
            '오늘 손에 잡히는 기운이',
        ]),
        # "오늘 결이 살아 있" (남은 케이스)
        (r'오늘\s*결이\s*살아\s*있(네요|어요)', [
            '오늘 흐름이 살아 있\1',
            '오늘 기운이 가까이 와 있\1',
            '오늘 결이 분명해 보이\1',
        ]),
        # "오늘 마주치는" 8회 → 다양화
        (r'오늘\s*마주치는', [
            '오늘 만나는',
            '오늘 다가오는',
            '오늘 닿는',
            '오늘 마주하는',
            '오늘 함께하는',
        ]),
        # "결이 닿는 사람" 7회 → 다양화
        (r'결이\s*닿는\s*사람', [
            '인연이 가까운 사람',
            '오늘 만나는 사람',
            '곁에 있는 사람',
            '함께하는 사람',
            '대화 통하는 사람',
        ]),
        # "결을 보면" 패턴 (반복 회피)
        (r'^결을\s*보면', [
            '한 발 떨어져 보면',
            '천천히 살피면',
            '잠깐 들여다보면',
            '조용히 짚어보면',
        ]),
        # "오늘 결로 보면" → 다양화
        (r'^오늘\s*결로\s*보면', [
            '오늘 흐름으로 보면',
            '오늘 기운으로 보면',
            '오늘 결을 짚어보면',
            '오늘 흐름을 따라가면',
        ]),
        # "마음이 몽글몽글" 8회 → 5가지
        (r'^마음이\s*몽글몽글', [
            '마음이 부드럽게 출렁',
            '마음이 따뜻하게 일렁',
            '속마음이 잔잔하게 흔들리',
            '마음 한쪽이 말랑하게 풀리',
            '감정이 부드럽게 다가오',
        ]),
        # "주변에서 따뜻한" 8회 → 4가지
        (r'^주변에서\s*따뜻한', [
            '곁에서 따뜻한',
            '인연이 닿는 곳에서 따뜻한',
            '오늘 마주치는 곳에서 다정한',
            '결이 닿는 사람에게서 따뜻한',
        ]),
        # "가만히 보면, " 7회 → 4가지
        (r'^가만히\s*보면,?\s*', [
            '잠깐 살피면, ',
            '결을 들여다보면, ',
            '한 발 떨어져 보면, ',
            '천천히 따라가 보면, ',
        ]),
        # "오늘 기운이 아/정/좀 묘" 13회 → 5가지
        (r'^오늘\s*기운이\s*(아주\s*|정말\s*|좀\s*묘하|묘하)', [
            '오늘 흘러드는 기운이 ',
            '오늘 결로 보면 기운이 ',
            '오늘 다가오는 결이 ',
            '오늘 마주치는 흐름이 ',
            '오늘 가까이 오는 기운이 ',
        ]),
        # "옆에서 당신과/옆에서 누군가" 12회 → 5가지
        (r'^옆에서\s*(당신과|누군가|나랑|저와)', [
            '곁에 다가오는 사람의 결이 ',
            '오늘 마주치는 인연의 흐름이 ',
            '결이 닿는 사람과 ',
            '인연으로 보면 ',
            '관계의 흐름으로 보면 ',
        ]),
        # "덩치가 커 보이" 6회 → 4가지
        (r'^덩치가\s*커\s*보이', [
            '겉보기에 큰 일처럼 보이',
            '체감상 무겁게 느껴지',
            '눈으로는 커 보이',
            '실제보다 부담되어 보이',
        ]),
        # "멋진 일이 일어" 6회 → 4가지
        (r'^멋진\s*일이\s*일어', [
            '뜻깊은 일이 시작되',
            '괜찮은 일이 다가오',
            '결실 있는 일이 따라오',
            '눈에 띄는 흐름이 다가오',
        ]),
    ]
    all_extra_patterns = extra_starts

    extra_seed = base_hash + 31337
    for i, (pattern, candidates) in enumerate(all_extra_patterns):
        seed = extra_seed + i * 17
        match_idx2 = [0]

        def picker_extra(_match):
            idx = match_idx2[0]
            match_idx2[0] += 1
            chosen = candidates[(seed + idx) % len(candidates)]
            return chosen

        text = re.sub(pattern, picker_extra, text, flags=re.MULTILINE)

    # 시작 표현 다양화 (3회 이상 등장한 첫 8자 패턴)
    starts = [
        # "오늘 정말 기운이" 23회 → 6가지
        (r'^오늘\s*정말\s*기운이', [
            '오늘 흐르는 기운이',
            '결을 보면 오늘 기운이',
            '오늘 만나는 기운이',
            '오늘 다가오는 기운이',
            '느낌으로 보면 오늘 기운이',
            '오늘 가까이 온 기운이',
            '오늘 함께하는 기운이',
            '오늘 닿는 결이',
            '오늘 흐르는 결이',
            '오늘 분명한 결이',
        ]),
        # "오늘 하루는 마" 21회
        (r'^오늘\s*하루는\s*마치', [
            '오늘은 마치',
            '결을 보면 마치',
            '느낌으로는 마치',
            '오늘 결이 마치',
            '잠깐 보면 마치',
        ]),
        # "오늘 하루는 뭔" 11회
        (r'^오늘\s*하루는\s*뭔가', [
            '오늘은 뭔가',
            '결을 보면 뭔가',
            '미묘하게',
            '결이 다르게 뭔가',
        ]),
        # "오늘 정말 특별" 11회
        (r'^오늘\s*정말\s*특별한', [
            '오늘은 특별한',
            '결을 보면 특별한',
            '느낌이 다른 특별한',
            '오늘 마주치는 특별한',
            '오늘 다가오는 특별한',
        ]),
    ]

    # "~날이에요" 클리셰 압축 (사용자 신고: "오늘은 ~날이에요 빼주세요")
    # 258회 → 다양한 종결로 분산
    nalipnida = [
        # "기운이 흐르는 날이에요" / "기운이 도는 날이에요" 같은 패턴
        (r'기운이\s*(흐르는|도는|감도는|맴도는|넘치는)\s*날이에요\.?', [
            '기운이 흘러요.',
            '결이 살아 있어요.',
            '에너지가 가까이 있어요.',
            '흐름이 다가와요.',
            '기운이 함께해요.',
        ]),
        # "감정이 ~ 날이에요"
        (r'감정이\s*(\S+\s*){0,3}날이에요\.?', [
            '감정이 출렁여요.',
            '마음이 잔잔히 흔들려요.',
            '속마음이 가까워져요.',
            '감정이 솟아나요.',
        ]),
        # "마음이 ~ 날이에요"
        (r'마음이\s*(\S+\s*){0,3}날이에요\.?', [
            '마음이 흔들려요.',
            '마음이 부드러워져요.',
            '마음의 결이 달라요.',
            '마음이 일렁여요.',
        ]),
        # "~을 수 있는 날이에요" / "~할 수 있는 날이에요"
        (r'(\S+)\s*수\s*있는\s*날이에요\.?', [
            r'\1 수 있어요.',
            r'\1 가능성이 있어요.',
            r'\1 흐름이에요.',
        ]),
        # "~사람이 나타나는 날이에요"
        (r'사람이\s*나타나는\s*날이에요\.?', [
            '사람이 다가와요.',
            '인연이 가까워져요.',
            '사람의 결이 닿아요.',
            '연결될 사람이 보여요.',
        ]),
        # 일반 fallback 1: "~한 날이에요" → "~한 흐름이에요" / "~한 결이에요"
        (r'(\S+한)\s*날이에요\.?', [
            r'\1 흐름이에요.',
            r'\1 결이에요.',
            r'\1 분위기예요.',
            r'\1 시간이에요.',
        ]),
        # 일반 fallback 2: "~는 날이에요" → "~는 흐름이에요"
        (r'(\S+는)\s*날이에요\.?', [
            r'\1 흐름이에요.',
            r'\1 결이에요.',
            r'\1 시간이에요.',
            r'\1 때예요.',
        ]),
        # 일반 fallback 3: "~ 날이에요" 마지막 보루 (모든 잔존 패턴)
        (r'날이에요\.?', [
            '흐름이에요.',
            '결이에요.',
            '분위기예요.',
            '시간이에요.',
        ]),
    ]
    for pattern, candidates in nalipnida:
        seed = base_hash + 7777
        match_idx = [0]

        def picker_n(_match):
            idx = match_idx[0]
            match_idx[0] += 1
            chosen = candidates[(seed + idx) % len(candidates)]
            if '\\1' in chosen:
                grp = _match.group(1) if _match.lastindex else ''
                return chosen.replace('\\1', grp)
            return chosen

        text = re.sub(pattern, picker_n, text)

    all_patterns = closings + starts
    counter = [0]

    for i, (pattern, candidates) in enumerate(all_patterns):
        seed = base_hash + i * 31

        def picker(_match):
            idx = counter[0]
            counter[0] += 1
            chosen = candidates[(seed + idx) % len(candidates)]
            # 정규식 백레퍼런스 처리
            if '\\1' in chosen:
                grp = _match.group(1) if _match.lastindex else ''
                return chosen.replace('\\1', grp)
            return chosen

        text = re.sub(pattern, picker, text)

    return text


def remove_filler(text: str) -> str:
    """쓸데없는 말 제거 (User Council 발견 패턴)
    - 도입 추임새 (가만히 살피면, 슬며시, 결이 다르게...)
    - 반복 위로구 (너무 걱정 마세요, 오전만 잘 넘기면)
    - 메모/기록 강요 문장 전체
    - 결말 격려 (행운을 빌어요, 멋지게 헤쳐나가세요)
    - 군더더기 부사 (혹시, 특히, 다만)
    """
    # 1. 도입 추임새 제거 (문장 시작 위치만)
    fillers_lead = [
        r'^가만히 살피면,?\s*',
        r'^슬며시\s*',
        r'^결이 다르게\s*',
        r'^잠깐 보면,?\s*',
        r'^잠시 보면,?\s*',
        r'^눈에 띄게\s*',
        r'^미묘하게\s*',
        r'^천천히 보면,?\s*',
        r'^한숨 한 번 내쉬면,?\s*',
        r'^왠지 모르게\s*',
        r'^왠지\s+',
        r'^느낌이\s+',
        r'^오늘 결이\s+',
        r'^오늘 같은 날은\s+',
        r'^하루 시작이\s+',
        r'^아침을 열면,?\s*',
        r'^눈을 뜨면,?\s*',
    ]
    for pat in fillers_lead:
        text = re.sub(pat, '', text, flags=re.MULTILINE)

    # 2. 반복 위로구 제거
    fillers_comfort = [
        r'너무 걱정 (마세요|하지 마세요)\.?\s*',
        r'걱정 (마세요|하지 마세요)\.?\s*',
        r'오전만 잘 넘기면[^.]*\.\s*',
        r'오늘 하루만 잘 넘기면[^.]*\.\s*',
        r'하루만 참으면[^.]*\.\s*',
        r'조금만 더 힘내면[^.]*\.\s*',
    ]
    for pat in fillers_comfort:
        text = re.sub(pat, '', text)

    # 3. 메모/기록 강요 문장 전체 삭제
    fillers_memo = [
        r'[^.!?]*(한 줄 적어두|간단히 기록해|한쪽에 적어두|기록해두면|적어뒀다가|짧게라도 기록|떠오르는[^.]*적어|노트장에[^.]*적어|메모장에)[^.!?]*[.!?]\s*',
    ]
    for pat in fillers_memo:
        text = re.sub(pat, '', text)

    # 4. 결말 격려 제거
    fillers_closing = [
        r'\s*(오늘 하루,?)?\s*행운을 (빌어요|빕니다)[\.!]*\s*',
        r'\s*멋지게 헤쳐나가세요[\.!]*\s*',
        r'\s*당신은 충분히 잘 해낼 수 있어요[\.!]*\s*',
        r'\s*응원합니다[\.!]*\s*',
        r'\s*화이팅[\.!]*\s*',
    ]
    for pat in fillers_closing:
        text = re.sub(pat, '', text)

    # 5. 군더더기 부사 제거 (문장 시작에서만)
    text = re.sub(r'(?<=[\.\?\!]\s)혹시\s+', '', text)
    text = re.sub(r'(?<=[\.\?\!]\s)특히\s+', '', text)
    text = re.sub(r'^혹시\s+', '', text, flags=re.MULTILINE)

    return text


def cleanup(text: str) -> str:
    """후처리: 이중 공백, 빈 문장, 콤마 정리, 첫문장 충돌 정리"""
    # 첫 문장 다양화 후 직후 "오늘"이 따라오는 어색한 충돌 정리
    # "오늘 결이 오늘 정말~" → "오늘 결이 정말~"
    text = re.sub(r'^오늘\s*결이\s*오늘\b', '오늘 결이', text)
    # "느낌이 오늘 정말~" → "느낌이 오늘은 정말~" (자연스럽게)
    text = re.sub(r'^느낌이\s*오늘\b', '느낌이 다른 오늘', text)
    # "잠시 보면, 오늘 ~" → "잠시 보면, " (오늘 제거)
    text = re.sub(r'^(가만히 살피면|잠깐 보면|잠시 보면|결을 보면|가만히 보면),?\s*오늘\s+', r'\1, ', text)
    # 새벽 추임새 + "오늘 하루는" 충돌
    text = re.sub(r'^한숨 한 번 내쉬면,?\s*오늘\s*하루는\s*', '한숨 한 번 내쉬면, ', text)
    text = re.sub(r'^천천히 보면,?\s*오늘\s*하루는\s*', '천천히 보면, ', text)
    text = re.sub(r'^잠시 멈추면,?\s*오늘\s*하루는\s*', '잠시 멈추면, ', text)

    # 일반 정리
    text = re.sub(r'  +', ' ', text)
    text = re.sub(r'\.\s*\.\s*', '. ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s*,\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s+,', ',', text)
    return text.strip()


def measure_patterns(data: dict, label: str) -> dict:
    """패턴 빈도 측정"""
    patterns = {
        '오전만 잘 넘기면': r'오전만\s*잘\s*넘기면',
        '오후 3시류': r'오후\s*3시',
        '메모하세요': r'메모하세요|메모해\s*두',
        '긍정적인 마음/자세': r'긍정적인\s*마음|긍정적인\s*자세',
        '주변 사람': r'주변\s*사람',
        '점심때/점심 시간': r'점심때|점심\s*시간',
        '상사/선배': r'상사|선배',
        '잘 될 거예요': r'잘\s*될\s*거예요|잘\s*풀릴\s*거예요',
        '힘내세요': r'힘내세요|응원할게요',
        '== 깨진 문법 ==': '',
        '에는쯤 합성어': r'에는쯤|때는쯤',
        '에는로 합성어': r'에는로|때는로|게는로',
        '흐름가 등 오류': r'흐름가(?!요)',
    }
    all_texts = list(data.get('overall', {}).values()) + list(data.get('categories', {}).values())
    total = len(all_texts)
    result = {'label': label, 'total': total, 'patterns': {}}
    for name, pat in patterns.items():
        if pat:
            cnt = sum(1 for t in all_texts if re.search(pat, t))
            result['patterns'][name] = (cnt, cnt / total * 100)
        else:
            result['patterns'][name] = None
    return result


def measure_first_sentence(data: dict) -> dict:
    """첫 글자 분포"""
    all_texts = list(data.get('overall', {}).values()) + list(data.get('categories', {}).values())
    starts = Counter()
    for t in all_texts:
        first = t.lstrip()[:2]
        starts[first] += 1
    return dict(starts.most_common(10))


def print_comparison(before: dict, after: dict):
    print(f"\n{'패턴':<22} {'BEFORE':>15} {'AFTER':>15}")
    print('=' * 60)
    for name, before_v in before['patterns'].items():
        after_v = after['patterns'].get(name)
        if before_v is None:
            print(f"{name}")
            continue
        b_cnt, b_pct = before_v
        a_cnt, a_pct = after_v
        print(f"{name:<22} {b_cnt:>5}건 ({b_pct:>5.1f}%) {a_cnt:>5}건 ({a_pct:>5.1f}%)")


def main():
    print(f"입력: {INPUT}")
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    before_stats = measure_patterns(data, 'BEFORE')
    before_starts = measure_first_sentence(data)

    new_data = {'overall': {}, 'categories': {}}
    total_subs = 0
    total_first = 0
    total_jong = 0

    for k, v in data.get('overall', {}).items():
        v, n1 = apply_replacements(v, k)
        v, n2 = apply_first_sentence_diversify(v, k)
        v = remove_filler(v)              # 쓸데없는 말 제거
        v = diversify_closings(v, k)      # Phase 1: 클로징 다양화 (먼저)
        v, n3 = fix_jongseong_errors(v)   # 다양화 후 새로 생긴 조사 오류 정리
        v = cleanup(v)
        new_data['overall'][k] = v
        total_subs += n1
        total_first += n2
        total_jong += n3

    for k, v in data.get('categories', {}).items():
        v, n1 = apply_replacements(v, k)
        v, n2 = apply_first_sentence_diversify(v, k)
        v = remove_filler(v)              # 쓸데없는 말 제거
        v = diversify_closings(v, k)      # Phase 1: 클로징 다양화 (먼저)
        v, n3 = fix_jongseong_errors(v)   # 다양화 후 새로 생긴 조사 오류 정리
        v = cleanup(v)
        new_data['categories'][k] = v
        total_subs += n1
        total_first += n2
        total_jong += n3

    after_stats = measure_patterns(new_data, 'AFTER')
    after_starts = measure_first_sentence(new_data)

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"\n저장: {OUTPUT}")
    print(f"본문 치환: {total_subs}회 / 첫문장: {total_first}회 / 조사: {total_jong}회")
    print_comparison(before_stats, after_stats)

    print("\n=== 첫 글자 분포 BEFORE → AFTER ===")
    keys_to_show = set(list(before_starts.keys())[:8] + list(after_starts.keys())[:8])
    for k in sorted(keys_to_show, key=lambda x: -(before_starts.get(x, 0))):
        b = before_starts.get(k, 0)
        a = after_starts.get(k, 0)
        print(f"  '{k:3}'  {b:>4} → {a:>4}")

    # 샘플
    print("\n=== 샘플 BEFORE/AFTER (3개) ===")
    sample_keys = list(data.get('overall', {}).keys())[:3]
    for k in sample_keys:
        print(f"\n[{k}]")
        print(f"BEFORE: {data['overall'][k][:250]}...")
        print(f"AFTER:  {new_data['overall'][k][:250]}...")


if __name__ == "__main__":
    main()
