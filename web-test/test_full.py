# -*- coding: utf-8 -*-
from playwright.sync_api import sync_playwright
import os

screenshot_dir = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 932})

    print("=" * 50)
    print("사주투데이 웹 테스트 시작")
    print("=" * 50)

    # 1. 페이지 로드
    print("\n[1] 페이지 로드 중...")
    page.goto('http://127.0.0.1:8081')
    page.wait_for_load_state('networkidle')
    print("    페이지 로드 완료")

    # 2. 메인 화면 요소 확인
    print("\n[2] 메인 화면 요소 확인...")

    # 헤더
    header_title = page.locator('.header-title').text_content()
    print(f"    헤더 타이틀: {header_title}")

    # 메인 타이틀
    main_title = page.locator('.main-title').text_content()
    sub_title = page.locator('.sub-title').text_content()
    print(f"    메인 타이틀: {main_title}")
    print(f"    서브 타이틀: {sub_title}")

    # 사주팔자 휠
    pillars = page.locator('.pillar-value').all_text_contents()
    print(f"    사주팔자: {', '.join(pillars)}")

    # 날짜 정보
    lunar_date = page.locator('#lunar-date').text_content()
    solar_term = page.locator('#solar-term').text_content()
    today_date = page.locator('#today-date').text_content()
    print(f"    음력: {lunar_date} / 절기: {solar_term}")
    print(f"    오늘 날짜: {today_date}")

    # 운세 점수
    overall = page.locator('#overall-score').text_content()
    love = page.locator('#love-score').text_content()
    money = page.locator('#money-score').text_content()
    print(f"    종합운: {overall} / 애정운: {love} / 금전운: {money}")

    # 오늘의 조언
    advice_main = page.locator('#advice-main').text_content()
    print(f"    오늘의 조언: {advice_main}")

    # 행운 정보
    lucky_color = page.locator('#lucky-color').text_content()
    lucky_number = page.locator('#lucky-number').text_content()
    lucky_direction = page.locator('#lucky-direction').text_content()
    lucky_time = page.locator('#lucky-time').text_content()
    print(f"    행운의 색: {lucky_color}")
    print(f"    행운의 숫자: {lucky_number}")
    print(f"    행운의 방향: {lucky_direction}")
    print(f"    행운의 시간: {lucky_time}")

    # 띠 정보
    lucky_zodiac = page.locator('#lucky-zodiac').text_content()
    caution_zodiac = page.locator('#caution-zodiac').text_content()
    print(f"    오늘의 귀인: {lucky_zodiac}")
    print(f"    주의할 띠: {caution_zodiac}")

    # 메인 화면 스크린샷
    main_screenshot = os.path.join(screenshot_dir, 'test_main.png')
    page.screenshot(path=main_screenshot, full_page=True)
    print(f"\n    [스크린샷] {main_screenshot}")

    # 3. 전체 운세 보기 버튼 클릭
    print("\n[3] '전체 운세 보기' 버튼 테스트...")
    button = page.locator('.action-button')
    button_text = button.text_content()
    print(f"    버튼 텍스트: {button_text}")

    button.click()
    print("    버튼 클릭 완료")

    # 모달이 열릴 때까지 대기
    page.wait_for_selector('.modal-overlay.active', timeout=5000)
    page.wait_for_timeout(500)
    print("    모달 열림 확인")

    # 4. 모달 내용 확인
    print("\n[4] 전체 운세 모달 내용 확인...")

    modal_title = page.locator('.modal-title').text_content()
    modal_date = page.locator('.modal-date').text_content()
    modal_summary = page.locator('.modal-summary').text_content()
    print(f"    모달 제목: {modal_title}")
    print(f"    날짜: {modal_date}")
    print(f"    운세 요약: {modal_summary}")

    # 키워드
    keywords = page.locator('.keyword').all_text_contents()
    print(f"    키워드: {', '.join(keywords)}")

    # 운세 카드 개수
    fortune_cards = page.locator('.fortune-card').count()
    print(f"    운세 카드 개수: {fortune_cards}개")

    # 각 카테고리 확인
    categories = page.locator('.fortune-category').all_text_contents()
    scores = page.locator('.fortune-score').all_text_contents()
    for cat, score in zip(categories, scores):
        print(f"    - {cat}: {score}")

    # Do & Don't
    do_text = page.locator('.do-card .dos-donts-text').text_content()
    dont_text = page.locator('.dont-card .dos-donts-text').text_content()
    print(f"    오늘 하면 좋은 것: {do_text}")
    print(f"    오늘 피할 것: {dont_text}")

    # 모달 스크린샷
    modal_screenshot = os.path.join(screenshot_dir, 'test_modal.png')
    page.screenshot(path=modal_screenshot, full_page=True)
    print(f"\n    [스크린샷] {modal_screenshot}")

    # 5. 모달 닫기 테스트
    print("\n[5] 모달 닫기 테스트...")

    # 뒤로가기 버튼 클릭
    page.locator('.modal-back').click()
    page.wait_for_timeout(300)

    modal_visible = page.locator('.modal-overlay.active').count()
    if modal_visible == 0:
        print("    뒤로가기 버튼으로 모달 닫힘 확인")
    else:
        print("    [경고] 모달이 닫히지 않음")

    # 다시 모달 열기
    button.click()
    page.wait_for_selector('.modal-overlay.active', timeout=5000)
    page.wait_for_timeout(300)

    # 배경 클릭으로 닫기
    page.locator('.modal-overlay').click(position={'x': 10, 'y': 10})
    page.wait_for_timeout(300)

    modal_visible = page.locator('.modal-overlay.active').count()
    if modal_visible == 0:
        print("    배경 클릭으로 모달 닫힘 확인")
    else:
        print("    [경고] 배경 클릭으로 모달이 닫히지 않음")

    # 6. 모바일 뷰포트 테스트
    print("\n[6] 다양한 뷰포트 테스트...")

    viewports = [
        {'name': 'iPhone SE', 'width': 375, 'height': 667},
        {'name': 'iPhone 14 Pro', 'width': 393, 'height': 852},
        {'name': 'Galaxy S21', 'width': 360, 'height': 800},
    ]

    for vp in viewports:
        page.set_viewport_size({'width': vp['width'], 'height': vp['height']})
        page.goto('http://127.0.0.1:8081')
        page.wait_for_load_state('networkidle')

        # 요소가 제대로 보이는지 확인
        wheel_visible = page.locator('.saju-wheel').is_visible()
        button_visible = page.locator('.action-button').is_visible()

        status = "OK" if wheel_visible and button_visible else "FAIL"
        print(f"    {vp['name']} ({vp['width']}x{vp['height']}): {status}")

    print("\n" + "=" * 50)
    print("테스트 완료!")
    print("=" * 50)

    browser.close()
