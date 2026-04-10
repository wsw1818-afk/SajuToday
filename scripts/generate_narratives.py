#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
4090 로컬 AI(Ollama + Gemma3 12B)로 운세 통문장 360개 생성
십신(10) × 용신타입(3) × 12운성(12) = 360개
+ 카테고리별(재물/연애/직장/건강) 각 30개 = 120개
총 480개 생성
"""

import json
import subprocess
import os
import sys
import time

# Windows 콘솔 인코딩 강제 UTF-8
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

OLLAMA = os.path.expandvars(r"%LOCALAPPDATA%\Programs\Ollama\ollama.exe")
MODEL = "gemma3:12b"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인']
YONGSIN_TYPES = ['yongsin', 'gishin', 'neutral']
TWELVE_STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양']
CATEGORIES = ['wealth', 'love', 'work', 'health']

ELEMENT_NAMES = {
    'wood': '나무', 'fire': '불', 'earth': '흙', 'metal': '쇠', 'water': '물'
}

TEN_GOD_DESC = {
    '비견': '나와 같은 기운이 옆에 있는 상황. 동료/경쟁자. 협력하면 좋지만 같은 것을 놓고 다툴 수도 있음.',
    '겁재': '재물이 빠져나가기 쉬운 상황. 경쟁자가 나타나거나 예상 못한 지출이 생김. 보증/투자 위험.',
    '식신': '창의력과 표현력이 폭발하는 상황. 아이디어가 샘솟고 먹을 복이 있음. 에너지를 쏟아내는 날.',
    '상관': '권위에 반항하고 싶은 충동. 말이 날카로워지고 윗사람과 충돌 위험. 혁신적이지만 위험한 날.',
    '편재': '예상 밖의 횡재/기회. 투자 수익, 보너스 가능. 다만 욕심 과하면 역효과.',
    '정재': '정당한 노력의 보상. 안정적 수입, 저축, 계약에 유리. 꾸준함이 빛나는 날.',
    '편관': '외부의 강한 압박과 시련. 상사의 질책, 예상 못한 사고, 건강 이상 가능. 가장 힘든 기운.',
    '정관': '명예와 인정. 승진, 좋은 평가. 책임감이 높이 평가받음. 리더십 발휘.',
    '편인': '직감이 예민해지지만 불안감도 커짐. 현실 감각이 흐려지고 판단력 저하 가능.',
    '정인': '주변의 따뜻한 도움. 선배/멘토의 조언, 학습/자격증에 유리. 보호받는 기운.',
}

YONGSIN_DESC = {
    'yongsin': '나에게 꼭 필요한 기운이 들어오는 날. 평소보다 운이 좋고 하는 일이 잘 풀림.',
    'gishin': '나의 사주와 맞지 않는 기운. 겉으로는 괜찮아 보여도 예상 못한 곳에서 문제 발생 가능.',
    'neutral': '특별히 좋지도 나쁘지도 않은 중립적 기운. 본인의 노력에 따라 결과가 달라짐.',
}

STAGE_DESC = {
    '장생': '새로 태어나는 에너지. 시작과 가능성의 기운.',
    '목욕': '사춘기 같은 불안정. 성장통이지만 지나면 성숙해짐.',
    '관대': '사회에 나서는 기운. 자신감 상승, 발표/면접에 유리.',
    '건록': '가장 안정적으로 자리잡은 상태. 월급날처럼 든든.',
    '제왕': '에너지 최고조. 뭘 해도 될 것 같은 느낌. 겸손 필요.',
    '쇠': '에너지가 서서히 빠지는 시점. 무리하지 말고 쉬어가기.',
    '병': '몸과 마음이 쉬고 싶어하는 날. 무리한 스케줄 피하기.',
    '사': '한 사이클이 끝나가는 시점. 정리하고 마무리짓기.',
    '묘': '경험이 차곡차곡 쌓이는 날. 당장 성과는 없지만 나중에 큰 자산.',
    '절': '완전한 리셋. 에너지 바닥이지만 새 시작의 전주곡.',
    '태': '씨앗이 심어진 날. 눈에 안 보이지만 무언가 시작됨.',
    '양': '조용히 자라는 기운. 서서히 좋아지는 중.',
}

CATEGORY_DESC = {
    'wealth': '재물운/금전운',
    'love': '연애운/대인관계',
    'work': '직장운/업무',
    'health': '건강운/체력',
}


def generate_prompt_overall(ten_god, yongsin_type, stage):
    return f"""당신은 한국의 유명 역술인입니다. 손님에게 오늘의 운세를 풀어주세요.

## 손님 정보
- 오늘의 기운: {TEN_GOD_DESC[ten_god]}
- 용신 여부: {YONGSIN_DESC[yongsin_type]}
- 에너지 상태: {STAGE_DESC[stage]} (12운성: {stage})

## 작성 규칙 (반드시 지켜야 함)
1. ~해요 대화체. 역술인이 손님에게 직접 말하듯.
2. 전문 용어(십신, 용신, 12운성, 오행 등) 절대 사용 금지. 쉬운 일상어만.
3. 5~7문장으로 작성.
4. 구체적 시간 언급 ("오전에", "점심때", "오후 3시 이후")
5. 구체적 행동 지시 ("메모하세요", "참으세요", "연락해보세요")
6. 나쁜 날이면 공포 주지 말고, "오전만 넘기면 괜찮아요", "하루만 참으면 돼요" 식으로 시간 한정 + 대처법 제시.
7. 자연스럽게 하나의 이야기처럼 흘러가게. 짜깁기 느낌 금지.
8. 첫 문장에서 오늘의 전체 분위기를 잡아주세요.

## 출력 형식
풀이 텍스트만 출력. 제목/번호/설명 없이 순수 풀이만."""


def generate_prompt_category(ten_god, yongsin_type, category):
    cat_name = CATEGORY_DESC[category]
    return f"""당신은 한국의 유명 역술인입니다. 손님에게 오늘의 {cat_name}을 풀어주세요.

## 손님 정보
- 오늘의 기운: {TEN_GOD_DESC[ten_god]}
- 용신 여부: {YONGSIN_DESC[yongsin_type]}

## 작성 규칙
1. ~해요 대화체. 역술인 말투.
2. 전문 용어 절대 금지.
3. 3~4문장으로 작성.
4. 구체적 시간/상황/행동 언급.
5. 카테고리에 맞는 내용만. ({cat_name} 관련)
6. 나쁜 날이면 대처법 제시.
7. 이모지 {'💰' if category == 'wealth' else '💕' if category == 'love' else '💼' if category == 'work' else '🏃'}로 시작.

## 출력 형식
풀이 텍스트만 출력."""


def call_ollama(prompt, retries=2):
    import urllib.request
    import re
    for attempt in range(retries + 1):
        try:
            data = json.dumps({
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.8, "num_predict": 512}
            }).encode('utf-8')
            req = urllib.request.Request(
                "http://localhost:11434/api/generate",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                output = result.get("response", "").strip()
                # 불필요한 마크다운/포맷 제거
                output = re.sub(r'\*\*.*?\*\*', '', output)
                output = re.sub(r'##.*?\n', '', output)
                output = re.sub(r'\n{3,}', '\n\n', output)
                output = output.strip()
                if len(output) > 30:
                    return output
        except Exception as e:
            print(f"  Error (attempt {attempt+1}): {e}")
            time.sleep(3)
    return None


def main():
    results = {
        'overall': {},      # key: "십신_용신_12운성" → text
        'categories': {},   # key: "카테고리_십신_용신" → text
    }

    total = len(TEN_GODS) * len(YONGSIN_TYPES) * len(TWELVE_STAGES)
    count = 0

    print(f"=== 종합 풀이 생성 시작 ({total}개) ===")
    for ten_god in TEN_GODS:
        for yongsin in YONGSIN_TYPES:
            for stage in TWELVE_STAGES:
                count += 1
                key = f"{ten_god}_{yongsin}_{stage}"
                print(f"[{count}/{total}] {key}...", end=" ", flush=True)

                prompt = generate_prompt_overall(ten_god, yongsin, stage)
                text = call_ollama(prompt)

                if text:
                    results['overall'][key] = text
                    print(f"OK ({len(text)}자)")
                else:
                    print("FAILED")
                    results['overall'][key] = f"[생성 실패] {key}"

    cat_total = len(TEN_GODS) * len(YONGSIN_TYPES) * len(CATEGORIES)
    cat_count = 0

    print(f"\n=== 카테고리별 풀이 생성 시작 ({cat_total}개) ===")
    for category in CATEGORIES:
        for ten_god in TEN_GODS:
            for yongsin in YONGSIN_TYPES:
                cat_count += 1
                key = f"{category}_{ten_god}_{yongsin}"
                print(f"[{cat_count}/{cat_total}] {key}...", end=" ", flush=True)

                prompt = generate_prompt_category(ten_god, yongsin, category)
                text = call_ollama(prompt)

                if text:
                    results['categories'][key] = text
                    print(f"OK ({len(text)}자)")
                else:
                    print("FAILED")
                    results['categories'][key] = f"[생성 실패] {key}"

    # 저장
    output_path = os.path.join(OUTPUT_DIR, "narratives_generated.json")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n=== 완료! ===")
    print(f"종합 풀이: {len(results['overall'])}개")
    print(f"카테고리 풀이: {len(results['categories'])}개")
    print(f"저장 위치: {output_path}")


if __name__ == "__main__":
    main()
