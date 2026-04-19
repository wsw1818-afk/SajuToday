#!/usr/bin/env python3
"""로컬 LLM 운세 생성 샘플 — 1 키 × 30 변형
목적: 품질/속도/명리학 정확성 검증

대상 키: 비견_yongsin_장생 (가장 흔한 조합 중 하나)
- 비견: 동등한 동료/형제 → 협력과 경쟁
- yongsin: 용신 (이로운 기운)
- 장생: 12운성 첫 단계 → 새 시작, 성장 에너지

톤 4종 × 변형 ~7개 + 일부 = 30개
"""
import sys
import json
import time
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

OLLAMA_URL = 'http://localhost:11434/api/generate'
MODEL = 'qwen3.5:27b'

# 프롬프트 템플릿: 명리학 컨텍스트 + 톤 지정
SYSTEM_PROMPT = """당신은 한국 사주명리학 전문가입니다. 일반인이 이해하기 쉬운 운세 풀이를 작성합니다.

엄격한 규칙:
1. 명리학 용어(비견, 정관, 용신, 일간, 십신, 12운성 등) 본문에 절대 사용 금지
2. 본문 길이: 200~350자
3. "잠시 돌아보면", "결을 따라가 보면" 같은 사색형 도입부 사용 금지 (이미 prefix가 붙음)
4. 단정적 미래 예언 금지 ("~합니다" 대신 "~할 수 있어요")
5. 1인 가구 배려: "동료", "선배" 같은 관계 의존 단어 최소화
6. 클리셰 금지: "오후 3시", "점심때", "주변 사람들"
7. 본문은 prefix가 자연스럽게 이어지도록, 도입부 없이 바로 핵심으로 시작
"""

USER_PROMPT_TEMPLATE = """다음 사주 상황의 운세 풀이를 작성하세요.

[사주 분석 결과 — 일반인에게는 숨김]
- 일간 오행: 갑목 (큰 나무, 성장과 리더십 성향)
- 오늘의 십신: 비견 (동등한 동료/형제, 협력과 경쟁이 동시에 발생)
- 용신/기신: 용신 (오늘 들어오는 기운이 본인에게 이로움)
- 12운성: 장생 (새 시작의 기운, 성장 에너지)

[변형 #{variant_num} — 톤: {tone}]
{tone_instruction}

위 명리학 정보를 일반인 언어로 번역해 자연스러운 운세 풀이를 한 단락(200~350자)으로 작성하세요.
첫 문장부터 바로 핵심 내용으로 시작하세요 (도입부 없이)."""

TONES = [
    ('관조형', '차분하게 관찰하고 사색하는 톤. "느껴져요", "보여요", "흐름이~" 같은 표현.'),
    ('격려형', '행동을 권하고 응원하는 톤. "해보세요", "시도해도 좋아요", "한 발 내딛어보세요".'),
    ('단호형', '명확하고 결정적인 톤. "~입니다", "확실해요", "분명히".'),
    ('경쾌형', '친근하고 가벼운 톤. "~인데요", "재밌게도", "그래서 말인데" 같은 구어체.'),
]


def call_ollama(prompt: str, max_tokens: int = 500) -> tuple[str, float]:
    """Ollama API 호출 → (생성 텍스트, 소요 시간)"""
    payload = {
        'model': MODEL,
        'prompt': prompt,
        'system': SYSTEM_PROMPT,
        'stream': False,
        'options': {
            'temperature': 0.85,  # 다양성 확보
            'top_p': 0.95,
            'num_predict': max_tokens,
            'repeat_penalty': 1.15,
        }
    }
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(OLLAMA_URL, data=data, headers={'Content-Type': 'application/json'})
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            elapsed = time.time() - start
            return result.get('response', '').strip(), elapsed
    except urllib.error.URLError as e:
        return f'[ERROR] {e}', time.time() - start


def main():
    print("=" * 70)
    print(f"운세 생성 샘플 — 모델: {MODEL}")
    print("대상: 비견_yongsin_장생 × 30 변형 (톤 4종 × 7~8회)")
    print("=" * 70)

    # 30개 변형: 톤 4종을 라운드로빈
    samples = []
    total_time = 0.0
    forbidden_terms = ['비견', '정관', '용신', '일간', '십신', '12운성', '장생', '갑목']

    for i in range(1, 31):
        tone_name, tone_instr = TONES[(i - 1) % len(TONES)]
        prompt = USER_PROMPT_TEMPLATE.format(
            variant_num=i,
            tone=tone_name,
            tone_instruction=tone_instr,
        )

        text, elapsed = call_ollama(prompt)
        total_time += elapsed

        # 검증
        char_count = len(text)
        forbidden_hits = [t for t in forbidden_terms if t in text]
        length_ok = 150 <= char_count <= 400
        forbidden_ok = len(forbidden_hits) == 0

        status = '[OK]' if (length_ok and forbidden_ok) else '[FAIL]'
        marks = []
        if not length_ok:
            marks.append(f'길이 {char_count}자')
        if not forbidden_ok:
            marks.append(f'금지어 {forbidden_hits}')

        samples.append({
            'idx': i,
            'tone': tone_name,
            'text': text,
            'chars': char_count,
            'elapsed_s': round(elapsed, 1),
            'forbidden_hits': forbidden_hits,
            'pass': length_ok and forbidden_ok,
        })

        print(f"\n[{i:02d}/30] 톤={tone_name}, {char_count}자, {elapsed:.1f}초 {status} {marks}")
        print(f"  {text[:150]}{'...' if len(text) > 150 else ''}")

    # 결과 저장
    out_path = 'h:/Claude_work/SajuToday/scripts/sample_output.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({
            'model': MODEL,
            'key': '비견_yongsin_장생',
            'total_samples': len(samples),
            'total_time_s': round(total_time, 1),
            'avg_time_s': round(total_time / len(samples), 1),
            'pass_count': sum(1 for s in samples if s['pass']),
            'samples': samples,
        }, f, ensure_ascii=False, indent=2)

    # 요약
    pass_count = sum(1 for s in samples if s['pass'])
    print("\n" + "=" * 70)
    print("샘플 결과")
    print("=" * 70)
    print(f"  생성 완료: 30/30")
    print(f"  통과 (길이+금지어): {pass_count}/30 ({pass_count*100/30:.0f}%)")
    print(f"  총 소요: {total_time:.1f}초 ({total_time/60:.1f}분)")
    print(f"  평균 1개당: {total_time/30:.1f}초")
    print(f"  전체 14,400개 추정 시간: {total_time/30 * 14400 / 3600:.1f}시간")
    print(f"\n  결과 저장: {out_path}")

    # 톤별 다양성 확인
    by_tone = {}
    for s in samples:
        by_tone.setdefault(s['tone'], []).append(s['text'][:30])
    print("\n  톤별 첫 30자 다양성:")
    for tone, texts in by_tone.items():
        unique = len(set(texts))
        print(f"    {tone}: {unique}/{len(texts)} 고유")


if __name__ == '__main__':
    main()
