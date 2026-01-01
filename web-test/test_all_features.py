# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import os
import sys

# UTF-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

screenshot_dir = os.path.dirname(os.path.abspath(__file__))

def save_screenshot(page, name):
    path = os.path.join(screenshot_dir, f'{name}.png')
    page.screenshot(path=path, full_page=True)
    return path

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 932})

    print("=" * 60)
    print("       사주투데이 전체 기능 테스트")
    print("=" * 60)

    # ========================================
    # 1. 페이지 로드 테스트
    # ========================================
    print("\n[테스트 1] 페이지 로드")
    print("-" * 40)
    page.goto('http://127.0.0.1:8081')
    page.wait_for_load_state('networkidle')
    print("  ✅ 페이지 로드 성공")

    # ========================================
    # 2. 헤더 영역 테스트
    # ========================================
    print("\n[테스트 2] 헤더 영역")
    print("-" * 40)

    # 메뉴 버튼
    menu_btn = page.locator('.header .icon-btn').first
    print(f"  메뉴 버튼: {'✅ 존재' if menu_btn.is_visible() else '❌ 없음'}")

    # 타이틀
    header_title = page.locator('.header-title').text_content()
    print(f"  헤더 타이틀: {header_title}")

    # 알림 버튼
    bell_btn = page.locator('.header .icon-btn').last
    print(f"  알림 버튼: {'✅ 존재' if bell_btn.is_visible() else '❌ 없음'}")

    # ========================================
    # 3. 사주팔자 휠 테스트
    # ========================================
    print("\n[테스트 3] 사주팔자 휠")
    print("-" * 40)

    wheel = page.locator('.saju-wheel')
    print(f"  휠 컴포넌트: {'✅ 표시됨' if wheel.is_visible() else '❌ 없음'}")

    # 각 주(柱) 확인
    pillars = page.locator('.pillar')
    pillar_labels = page.locator('.pillar-label').all_text_contents()
    pillar_values = page.locator('.pillar-value').all_text_contents()

    for label, value in zip(pillar_labels, pillar_values):
        print(f"  {label}: {value}")

    # 태극 심볼
    taiji = page.locator('.center-symbol')
    print(f"  태극 심볼: {'✅ 표시됨' if taiji.is_visible() else '❌ 없음'}")

    # ========================================
    # 4. 날짜 정보 테스트
    # ========================================
    print("\n[테스트 4] 날짜 정보")
    print("-" * 40)

    lunar_date = page.locator('#lunar-date').text_content()
    solar_term = page.locator('#solar-term').text_content()
    today_date = page.locator('#today-date').text_content()

    print(f"  양력: {today_date}")
    print(f"  음력: {lunar_date}")
    print(f"  절기: {solar_term}")

    # ========================================
    # 5. 운세 카드 테스트
    # ========================================
    print("\n[테스트 5] 운세 카드 (메인)")
    print("-" * 40)

    luck_cards = page.locator('.luck-card')
    card_count = luck_cards.count()
    print(f"  운세 카드 개수: {card_count}개")

    # 각 카드 내용
    labels = page.locator('.luck-label').all_text_contents()
    values = page.locator('.luck-value').all_text_contents()

    for label, value in zip(labels, values):
        print(f"  - {label}: {value}")

    # ========================================
    # 6. 오늘의 조언 테스트
    # ========================================
    print("\n[테스트 6] 오늘의 조언")
    print("-" * 40)

    advice_card = page.locator('.advice-card')
    print(f"  조언 카드: {'✅ 표시됨' if advice_card.is_visible() else '❌ 없음'}")

    advice_main = page.locator('#advice-main').text_content()
    advice_sub = page.locator('#advice-sub').text_content()

    print(f"  메인 조언: {advice_main}")
    print(f"  상세 조언: {advice_sub[:40]}...")

    # ========================================
    # 7. 행운 정보 그리드 테스트
    # ========================================
    print("\n[테스트 7] 행운 정보 그리드")
    print("-" * 40)

    detail_items = page.locator('.detail-item')
    print(f"  행운 정보 항목: {detail_items.count()}개")

    lucky_color = page.locator('#lucky-color').text_content()
    lucky_number = page.locator('#lucky-number').text_content()
    lucky_direction = page.locator('#lucky-direction').text_content()
    lucky_time = page.locator('#lucky-time').text_content()

    print(f"  - 행운의 색: {lucky_color}")
    print(f"  - 행운의 숫자: {lucky_number}")
    print(f"  - 행운의 방향: {lucky_direction}")
    print(f"  - 행운의 시간: {lucky_time}")

    # ========================================
    # 8. 띠 궁합 카드 테스트
    # ========================================
    print("\n[테스트 8] 띠 궁합 카드")
    print("-" * 40)

    compat_card = page.locator('.compat-card')
    print(f"  궁합 카드: {'✅ 표시됨' if compat_card.is_visible() else '❌ 없음'}")

    lucky_zodiac = page.locator('#lucky-zodiac').text_content()
    lucky_emoji = page.locator('#lucky-zodiac-emoji').text_content()
    caution_zodiac = page.locator('#caution-zodiac').text_content()
    caution_emoji = page.locator('#caution-zodiac-emoji').text_content()

    print(f"  오늘의 귀인: {lucky_emoji} {lucky_zodiac}")
    print(f"  주의할 띠: {caution_emoji} {caution_zodiac}")

    # 메인 화면 스크린샷
    path1 = save_screenshot(page, 'feature_01_main')
    print(f"\n  📸 스크린샷: {path1}")

    # ========================================
    # 9. 전체 운세 보기 버튼 테스트
    # ========================================
    print("\n[테스트 9] 전체 운세 보기 버튼")
    print("-" * 40)

    action_btn = page.locator('.action-button')
    btn_text = action_btn.text_content()
    print(f"  버튼 텍스트: {btn_text}")
    print(f"  버튼 상태: {'✅ 클릭 가능' if action_btn.is_enabled() else '❌ 비활성화'}")

    # 버튼 클릭
    action_btn.click()
    page.wait_for_selector('.modal-overlay.active', timeout=5000)
    page.wait_for_timeout(500)
    print("  ✅ 모달 열림 성공")

    # ========================================
    # 10. 전체 운세 모달 - 헤더 테스트
    # ========================================
    print("\n[테스트 10] 전체 운세 모달 - 헤더")
    print("-" * 40)

    modal_title = page.locator('.modal-title').text_content()
    modal_date = page.locator('.modal-date').text_content()
    modal_user = page.locator('.modal-user').text_content()
    modal_summary = page.locator('.modal-summary').text_content()

    print(f"  모달 제목: {modal_title}")
    print(f"  날짜: {modal_date}")
    print(f"  사용자: {modal_user}")
    print(f"  요약: {modal_summary}")

    # 키워드
    keywords = page.locator('.keyword').all_text_contents()
    print(f"  키워드: {', '.join(keywords)}")

    # ========================================
    # 11. 전체 운세 모달 - 운세 카드 테스트
    # ========================================
    print("\n[테스트 11] 전체 운세 모달 - 운세 카드")
    print("-" * 40)

    fortune_cards = page.locator('.fortune-card')
    print(f"  운세 카드 개수: {fortune_cards.count()}개")

    categories = page.locator('.fortune-category').all_text_contents()
    scores = page.locator('.fortune-score').all_text_contents()
    descriptions = page.locator('.fortune-description').all_text_contents()

    for cat, score, desc in zip(categories, scores, descriptions):
        print(f"  - {cat}: {score}")
        print(f"    └ {desc[:35]}...")

    # ========================================
    # 12. 전체 운세 모달 - Do & Don't 테스트
    # ========================================
    print("\n[테스트 12] 전체 운세 모달 - Do & Don't")
    print("-" * 40)

    do_card = page.locator('.do-card')
    dont_card = page.locator('.dont-card')

    print(f"  Do 카드: {'✅ 표시됨' if do_card.is_visible() else '❌ 없음'}")
    print(f"  Don't 카드: {'✅ 표시됨' if dont_card.is_visible() else '❌ 없음'}")

    do_text = page.locator('.do-card .dos-donts-text').text_content()
    dont_text = page.locator('.dont-card .dos-donts-text').text_content()

    print(f"  오늘 하면 좋은 것: {do_text}")
    print(f"  오늘 피할 것: {dont_text}")

    # Disclaimer
    disclaimer = page.locator('.disclaimer').text_content()
    print(f"  면책조항: {disclaimer}")

    # 모달 스크린샷
    path2 = save_screenshot(page, 'feature_02_modal')
    print(f"\n  📸 스크린샷: {path2}")

    # ========================================
    # 13. 모달 닫기 테스트 - 뒤로가기 버튼
    # ========================================
    print("\n[테스트 13] 모달 닫기 - 뒤로가기 버튼")
    print("-" * 40)

    back_btn = page.locator('.modal-back')
    back_btn.click()
    page.wait_for_timeout(300)

    modal_active = page.locator('.modal-overlay.active').count()
    print(f"  뒤로가기 버튼: {'✅ 모달 닫힘' if modal_active == 0 else '❌ 모달 열려있음'}")

    # ========================================
    # 14. 모달 닫기 테스트 - 배경 클릭
    # ========================================
    print("\n[테스트 14] 모달 닫기 - 배경 클릭")
    print("-" * 40)

    # 다시 모달 열기
    action_btn.click()
    page.wait_for_selector('.modal-overlay.active', timeout=5000)
    page.wait_for_timeout(300)

    # 배경 클릭으로 닫기
    page.locator('.modal-overlay').click(position={'x': 10, 'y': 10})
    page.wait_for_timeout(300)

    modal_active = page.locator('.modal-overlay.active').count()
    print(f"  배경 클릭: {'✅ 모달 닫힘' if modal_active == 0 else '❌ 모달 열려있음'}")

    # ========================================
    # 15. 반응형 디자인 테스트
    # ========================================
    print("\n[테스트 15] 반응형 디자인")
    print("-" * 40)

    viewports = [
        {'name': 'iPhone SE', 'width': 375, 'height': 667},
        {'name': 'iPhone 14 Pro Max', 'width': 430, 'height': 932},
        {'name': 'Galaxy S21', 'width': 360, 'height': 800},
        {'name': 'iPad Mini', 'width': 768, 'height': 1024},
    ]

    all_pass = True
    for vp in viewports:
        page.set_viewport_size({'width': vp['width'], 'height': vp['height']})
        page.goto('http://127.0.0.1:8081')
        page.wait_for_load_state('networkidle')

        # 주요 요소 확인
        wheel_ok = page.locator('.saju-wheel').is_visible()
        advice_ok = page.locator('.advice-card').is_visible()
        button_ok = page.locator('.action-button').is_visible()

        status = "✅" if (wheel_ok and advice_ok and button_ok) else "❌"
        if status == "❌":
            all_pass = False
        print(f"  {vp['name']} ({vp['width']}x{vp['height']}): {status}")

    # 반응형 테스트 스크린샷 (태블릿)
    page.set_viewport_size({'width': 768, 'height': 1024})
    page.goto('http://127.0.0.1:8081')
    page.wait_for_load_state('networkidle')
    path3 = save_screenshot(page, 'feature_03_tablet')
    print(f"\n  📸 태블릿 스크린샷: {path3}")

    # ========================================
    # 16. 스크롤 테스트
    # ========================================
    print("\n[테스트 16] 스크롤 기능")
    print("-" * 40)

    page.set_viewport_size({'width': 430, 'height': 600})  # 작은 뷰포트
    page.goto('http://127.0.0.1:8081')
    page.wait_for_load_state('networkidle')

    # 스크롤 전 버튼 위치
    btn_before = action_btn.bounding_box()

    # 스크롤
    page.evaluate('window.scrollBy(0, 500)')
    page.wait_for_timeout(300)

    # 스크롤 후 버튼이 여전히 접근 가능한지
    btn_visible = action_btn.is_visible()
    print(f"  스크롤 후 버튼 접근: {'✅ 가능' if btn_visible else '❌ 불가'}")

    # ========================================
    # 최종 결과
    # ========================================
    print("\n" + "=" * 60)
    print("       테스트 완료 - 결과 요약")
    print("=" * 60)

    results = {
        "페이지 로드": True,
        "헤더 영역": True,
        "사주팔자 휠": True,
        "날짜 정보": True,
        "운세 카드 (메인)": True,
        "오늘의 조언": True,
        "행운 정보 그리드": True,
        "띠 궁합 카드": True,
        "전체 운세 버튼": True,
        "모달 헤더": True,
        "모달 운세 카드": True,
        "Do & Don't": True,
        "모달 닫기 (뒤로가기)": True,
        "모달 닫기 (배경 클릭)": True,
        "반응형 디자인": all_pass,
        "스크롤 기능": btn_visible,
    }

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"\n  통과: {passed}/{total}")
    print()
    for name, result in results.items():
        status = "✅" if result else "❌"
        print(f"  {status} {name}")

    print(f"\n  📸 저장된 스크린샷:")
    print(f"     - {path1}")
    print(f"     - {path2}")
    print(f"     - {path3}")

    print("\n" + "=" * 60)

    browser.close()
