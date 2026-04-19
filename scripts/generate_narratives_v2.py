#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
v2 — Council 합의 반영 재생성

개선:
1. 풀이 구조 4가지 (시간흐름/영역별/즉시결정/감정인정) — 무작위 분배
2. 금지 표현 명시 ("메모하세요", "긍정적인 마음으로", "잘 될 거예요" 등)
3. "오늘의 결정" 섹션 추가 (해도좋은것/신중할것/미룰것)
4. "주변 사람" 강요 제거 (1인 가구 배려)
5. 명리학 근거 한 줄 추가
"""

import json
import os
import sys
import time
import random
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
    os.environ['PYTHONIOENCODING'] = 'utf-8'

import urllib.request
import subprocess

# Codex CLI 경로 (Windows)
CODEX_CMD = r"C:\Users\wsw18\AppData\Roaming\npm\codex.cmd"
USE_CODEX = True  # False로 바꾸면 Ollama 사용

MODEL = "gemma4:31b"  # Ollama 폴백용
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "generated")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TEN_GODS = ['비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인']
YONGSIN_TYPES = ['yongsin', 'gishin', 'neutral']
TWELVE_STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양']
CATEGORIES = ['wealth', 'love', 'work', 'health']

TEN_GOD_DESC = {
    '비견': '나와 같은 기운이 옆에 있는 상황. 동료/경쟁자.',
    '겁재': '재물이 빠져나가기 쉬운 상황. 보증/투자 위험.',
    '식신': '창의력과 표현력 폭발. 아이디어 샘솟음.',
    '상관': '권위에 반항. 말이 날카로움. 윗사람 충돌.',
    '편재': '예상 밖의 횡재/기회. 다만 욕심은 역효과.',
    '정재': '정당한 노력의 보상. 안정적, 저축, 계약.',
    '편관': '외부 강한 압박. 시련. 가장 힘든 기운.',
    '정관': '명예와 인정. 승진. 책임감.',
    '편인': '직관 예민. 불안감도 커짐. 판단력 저하.',
    '정인': '주변의 따뜻한 도움. 학습/자격증.',
}

YONGSIN_DESC = {
    'yongsin': '꼭 필요한 기운. 운이 좋은 날.',
    'gishin': '맞지 않는 기운. 예상 못한 곳에서 문제.',
    'neutral': '중립. 본인 노력이 결과 결정.',
}

STAGE_DESC = {
    '장생': '새로 태어나는 에너지. 시작.',
    '목욕': '사춘기 같은 불안정. 성장통.',
    '관대': '사회 진출. 자신감.',
    '건록': '안정 자리잡음. 든든.',
    '제왕': '에너지 최고조. 정점.',
    '쇠': '에너지 빠지기 시작.',
    '병': '쉬어가야 함. 컨디션 저하.',
    '사': '한 사이클 끝. 마무리.',
    '묘': '경험 축적. 당장은 결실 없음.',
    '절': '완전 리셋. 바닥.',
    '태': '씨앗 심어짐. 보이지 않게 시작.',
    '양': '서서히 자람.',
}

CATEGORY_DESC = {
    'wealth': '재물운/금전운',
    'love': '연애운/대인관계',
    'work': '직장운/업무',
    'health': '건강운/체력',
}

# 4가지 풀이 구조
STRUCTURES = {
    'time_flow': """[시간 흐름형 구조]
- 첫 문장: 오늘 전체 분위기 1줄
- 시간대별 흐름 (단, "오전→오후" 패턴 피할 것. 새벽/아침/낮/저녁/밤 중 2~3개만 자연스럽게)
- 마무리: 한 줄 격려 (단, "잘 될 거예요/긍정적인 마음으로" 금지)""",

    'domain_focus': """[영역별 강조 구조]
- 첫 문장: 오늘의 핵심 키워드 1줄
- 두 번째 문단: 가장 중요한 영역 1개 (재물/일/사람/건강 중) 집중 풀이
- 세 번째 문단: 부차적 영역 한 줄
- 마무리: 구체적 행동 1가지""",

    'decision_guide': """[즉시 결정형 구조]
- 첫 문장: 오늘이 어떤 결정에 좋은/나쁜 날인지 한 줄
- 해도 좋은 것 1가지 (구체적 행동)
- 신중해야 할 것 1가지
- 미뤄야 할 것 1가지
- 마무리 없이 행동 가이드로 끝""",

    'emotion_first': """[감정 인정형 구조]
- 첫 문장: 오늘 느낄 감정 인정 (예: "오늘은 좀 답답할 수 있어요")
- 왜 그런 감정이 드는지 (기운 흐름 한 줄)
- 그 감정과 함께 보내는 방법
- 마무리: 작은 위로 (단, 강제 활력 X)""",
}

# 금지 표현 (AI에게 명시)
FORBIDDEN_PHRASES = [
    "메모하세요", "메모지에", "일기를 쓰", "일기에",
    "긍정적인 마음으로", "긍정적인 자세",
    "잘 될 거예요", "잘 풀릴 거예요", "분명 좋은 결과",
    "주변 사람과", "주변 사람들에게", "동료와 친구",
    "응원할게요", "힘내세요",
    "오전만 잘 넘기면 오후",  # 패턴 회피
    "오후 3시 이후",
]

# 명리학적 근거 (한 줄 추가용)
def get_basis_hint(ten_god, yongsin, stage):
    return f"({ten_god}의 날, 12운성 {stage} 단계, 당신에게 {YONGSIN_DESC[yongsin].split('.')[0]})"


def generate_prompt_overall(ten_god, yongsin_type, stage, structure_key):
    structure = STRUCTURES[structure_key]
    forbidden_list = ", ".join(FORBIDDEN_PHRASES)
    yongsin_simple = {'yongsin': '운이 좋은 날', 'gishin': '맞지 않는 기운의 날', 'neutral': '본인 노력에 달린 날'}[yongsin_type]

    return f"""한국 운세 앱의 오늘 운세 풀이를 작성합니다.

오늘의 기운 정보 (이 정보는 출력에 직접 쓰지 말고, 풀이의 분위기와 조언에만 반영):
- 십신: {ten_god} - {TEN_GOD_DESC[ten_god]}
- 용신: {yongsin_simple}
- 12운성: {stage} - {STAGE_DESC[stage]}

작성할 풀이 구조:
{structure}

작성 규칙:
- 한국어 ~해요 대화체 (역술인이 손님에게 직접 말하듯)
- 전문용어 금지 (십신/용신/12운성/오행 같은 단어 X)
- 5~7문장
- 구체적 행동 1가지 이상 (예: "회의에서 손 들기", "퇴근길 카페 5분")
- 1인 가구 배려 — "주변 사람과/동료와" 같은 강요 X
- 시간대는 자연스럽게 (새벽/아침/낮/저녁/밤 중 2~3개만)
- 금지 어구: {forbidden_list}
- 클로징 매번 다르게. 행동으로 끝나도 됨.

출력 형식:
풀이 본문만 한 덩어리로 출력. 헤더/리스트/번호/마크다운 X. 빈 변수나 빈 라벨 X. 첫 문장부터 바로 풀이 시작.

지금 풀이를 작성하세요:"""


def generate_prompt_category(ten_god, yongsin_type, category):
    cat_name = CATEGORY_DESC[category]
    forbidden_list = ", ".join(FORBIDDEN_PHRASES[:8])
    emoji = {'wealth': '💰', 'love': '💕', 'work': '💼', 'health': '🏃'}[category]
    yongsin_simple = {'yongsin': '운이 좋은 날', 'gishin': '맞지 않는 날', 'neutral': '본인 노력 날'}[yongsin_type]

    return f"""한국 운세 앱의 {cat_name} 풀이를 작성합니다.

기운 정보 (출력에 직접 쓰지 말고 분위기에만 반영):
- 십신: {ten_god} - {TEN_GOD_DESC[ten_god]}
- 용신: {yongsin_simple}

작성 규칙:
- 한국어 ~해요 대화체
- 전문용어 금지
- 3~4문장
- 구체적 행동 1개 이상
- {emoji} 이모지로 시작
- 1인 가구 배려 (주변 사람 강요 X)
- 금지 어구: {forbidden_list}
- 오전→오후 회복 패턴 X

출력 형식:
{emoji}로 시작하는 풀이 본문만. 헤더/리스트/마크다운 X.

지금 작성하세요:"""


# 결정 박스 — 해도좋은것/신중할것/미룰것 (3개 항목)
def generate_prompt_decision(ten_god, yongsin_type, stage):
    return f"""한국 운세 앱의 "오늘의 결정" 박스를 만듭니다.

기운 상황:
- 오늘의 십신: {ten_god} ({TEN_GOD_DESC[ten_god]})
- 용신 여부: {YONGSIN_DESC[yongsin_type]}
- 에너지: {stage} ({STAGE_DESC[stage]})

엄격 출력 형식 (정확히 이 3줄만, 다른 어떤 설명도 금지):
🟢 [해도 좋은 구체적 행동 1가지, 15자 이내]
🟡 [신중하게 할 구체적 행동 1가지, 15자 이내]
🔴 [오늘 미룰 구체적 행동 1가지, 15자 이내]

예시 출력:
🟢 보고서 초안 끝내기
🟡 친구와 돈 약속
🔴 새 투자 결정

지금 출력하세요. 첫 글자는 반드시 🟢."""


def _clean_output(output: str) -> str:
    """공통 후처리: 마크다운/헤더/과도한 줄바꿈 제거"""
    output = re.sub(r'\*\*.*?\*\*', '', output)
    output = re.sub(r'##.*?\n', '', output)
    output = re.sub(r'^```.*?\n', '', output, flags=re.MULTILINE)
    output = re.sub(r'\n```\s*$', '', output)
    output = re.sub(r'\n{3,}', '\n\n', output)
    return output.strip()


def call_codex(prompt, retries=2):
    """Codex CLI 비대화형 호출 (codex exec).
    Codex는 답변만 stdout, 메타정보는 stderr로 분리해서 출력함.
    """
    for attempt in range(retries + 1):
        try:
            result = subprocess.run(
                [CODEX_CMD, "exec", "--skip-git-repo-check", prompt],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace',
                timeout=180,
                stdin=subprocess.DEVNULL,
            )
            if result.returncode != 0:
                print(f"  Codex error (attempt {attempt+1}): rc={result.returncode}")
                print(f"  stderr: {result.stderr[:200]}")
                time.sleep(2)
                continue

            text = _clean_output(result.stdout)
            if len(text) > 20:
                return text
            print(f"  Codex short output (attempt {attempt+1}): {len(text)}자 / stdout={result.stdout[:100]!r}")
        except subprocess.TimeoutExpired:
            print(f"  Codex timeout (attempt {attempt+1})")
            time.sleep(2)
        except Exception as e:
            print(f"  Codex exception (attempt {attempt+1}): {e}")
            time.sleep(2)
    return None


def call_ollama(prompt, retries=2, num_predict=512):
    for attempt in range(retries + 1):
        try:
            data = json.dumps({
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.85, "num_predict": num_predict, "top_p": 0.92}
            }).encode('utf-8')
            req = urllib.request.Request(
                "http://localhost:11434/api/generate",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                output = _clean_output(result.get("response", "").strip())
                if len(output) > 20:
                    return output
        except Exception as e:
            print(f"  Error (attempt {attempt+1}): {e}")
            time.sleep(3)
    return None


def call_ai(prompt, **kwargs):
    """라우터: USE_CODEX 플래그에 따라 Codex 또는 Ollama 호출"""
    if USE_CODEX:
        return call_codex(prompt)
    return call_ollama(prompt, **kwargs)


def main():
    output_path = os.path.join(OUTPUT_DIR, "narratives_generated_v2.json")

    # 기존 결과가 있으면 이어서 (중간 재시작 지원)
    results = {'overall': {}, 'categories': {}, 'decisions': {}}
    if os.path.exists(output_path):
        try:
            with open(output_path, 'r', encoding='utf-8') as f:
                existing = json.load(f)
            for k in ['overall', 'categories', 'decisions']:
                if k in existing:
                    results[k] = existing[k]
            print(f"=== 기존 결과 로드: overall {len(results['overall'])}개, categories {len(results['categories'])}개, decisions {len(results['decisions'])}개 ===")
        except Exception as e:
            print(f"기존 파일 로드 실패: {e}")

    def save_progress():
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

    # 종합 풀이 (구조 4개 순환)
    structure_keys = list(STRUCTURES.keys())
    total = len(TEN_GODS) * len(YONGSIN_TYPES) * len(TWELVE_STAGES)
    count = 0

    print(f"=== v2 종합 풀이 생성 ({total}개) ===")
    for ten_god in TEN_GODS:
        for yongsin in YONGSIN_TYPES:
            for stage_idx, stage in enumerate(TWELVE_STAGES):
                count += 1
                key = f"{ten_god}_{yongsin}_{stage}"
                structure_key = structure_keys[(count - 1) % len(structure_keys)]

                # 이미 만든 항목은 건너뛰기 (재시작 지원)
                if key in results['overall'] and not results['overall'][key].startswith('[생성 실패'):
                    print(f"[{count}/{total}] {key} (skip)")
                    continue

                print(f"[{count}/{total}] {key} ({structure_key})...", end=" ", flush=True)
                prompt = generate_prompt_overall(ten_god, yongsin, stage, structure_key)
                text = call_ai(prompt)

                if text:
                    results['overall'][key] = text
                    print(f"OK ({len(text)}자)")
                else:
                    print("FAILED")
                    results['overall'][key] = f"[생성 실패] {key}"

                # 10개마다 중간 저장
                if count % 10 == 0:
                    save_progress()

    save_progress()

    # 카테고리별
    cat_total = len(TEN_GODS) * len(YONGSIN_TYPES) * len(CATEGORIES)
    cat_count = 0
    print(f"\n=== v2 카테고리별 풀이 ({cat_total}개) ===")
    for category in CATEGORIES:
        for ten_god in TEN_GODS:
            for yongsin in YONGSIN_TYPES:
                cat_count += 1
                key = f"{category}_{ten_god}_{yongsin}"

                if key in results['categories'] and not results['categories'][key].startswith('[생성 실패'):
                    print(f"[{cat_count}/{cat_total}] {key} (skip)")
                    continue

                print(f"[{cat_count}/{cat_total}] {key}...", end=" ", flush=True)
                prompt = generate_prompt_category(ten_god, yongsin, category)
                text = call_ai(prompt)
                if text:
                    results['categories'][key] = text
                    print(f"OK ({len(text)}자)")
                else:
                    results['categories'][key] = f"[생성 실패]"
                    print("FAILED")

                if cat_count % 10 == 0:
                    save_progress()

    # 결정 박스
    dec_total = len(TEN_GODS) * len(YONGSIN_TYPES) * len(TWELVE_STAGES)
    dec_count = 0
    def parse_decision(text: str) -> dict:
        """🟢/🟡/🔴 줄을 파싱해 {green, yellow, red} 객체로 변환"""
        green = yellow = red = ""
        for line in text.split('\n'):
            s = line.strip()
            if not s:
                continue
            # 이모지 제거하고 본문만
            if '🟢' in s:
                green = re.sub(r'^.*?🟢\s*', '', s).strip()
            elif '🟡' in s:
                yellow = re.sub(r'^.*?🟡\s*', '', s).strip()
            elif '🔴' in s:
                red = re.sub(r'^.*?🔴\s*', '', s).strip()
        return {
            "green": green or "평소대로 일하기",
            "yellow": yellow or "큰 지출 결정",
            "red": red or "무리한 약속",
        }

    save_progress()

    print(f"\n=== v2 결정 박스 ({dec_total}개) ===")
    for ten_god in TEN_GODS:
        for yongsin in YONGSIN_TYPES:
            for stage in TWELVE_STAGES:
                dec_count += 1
                key = f"{ten_god}_{yongsin}_{stage}"

                if key in results['decisions'] and isinstance(results['decisions'][key], dict):
                    print(f"[{dec_count}/{dec_total}] {key} (skip)")
                    continue

                print(f"[{dec_count}/{dec_total}] {key}...", end=" ", flush=True)
                prompt = generate_prompt_decision(ten_god, yongsin, stage)
                text = call_ai(prompt, num_predict=200)
                if text:
                    results['decisions'][key] = parse_decision(text)
                    print(f"OK")
                else:
                    results['decisions'][key] = {
                        "green": "평소대로 일하기",
                        "yellow": "큰 지출 결정",
                        "red": "무리한 약속",
                    }
                    print("FAILED")

                if dec_count % 10 == 0:
                    save_progress()

    save_progress()

    print(f"\n=== v2 완료! ===")
    print(f"종합: {len(results['overall'])}개")
    print(f"카테고리: {len(results['categories'])}개")
    print(f"결정 박스: {len(results['decisions'])}개")
    print(f"저장: {output_path}")


if __name__ == "__main__":
    main()
