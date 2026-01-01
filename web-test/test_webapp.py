from playwright.sync_api import sync_playwright
import os

# 스크린샷 저장 경로
screenshot_dir = os.path.dirname(os.path.abspath(__file__))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 932})

    # 페이지 로드
    page.goto('http://127.0.0.1:8081')
    page.wait_for_load_state('networkidle')

    # 메인 화면 스크린샷
    main_screenshot = os.path.join(screenshot_dir, 'screenshot_main.png')
    page.screenshot(path=main_screenshot, full_page=True)
    print(f"메인 화면 스크린샷 저장: {main_screenshot}")

    # "전체 운세 보기" 버튼 클릭
    button = page.locator('button.action-button')
    button.click()

    # 모달이 열릴 때까지 대기
    page.wait_for_selector('.modal-overlay.active', timeout=5000)
    page.wait_for_timeout(500)  # 애니메이션 완료 대기

    # 모달 화면 스크린샷
    modal_screenshot = os.path.join(screenshot_dir, 'screenshot_modal.png')
    page.screenshot(path=modal_screenshot, full_page=True)
    print(f"모달 화면 스크린샷 저장: {modal_screenshot}")

    # 모달 내용 확인
    modal_title = page.locator('.modal-title').text_content()
    modal_summary = page.locator('.modal-summary').text_content()
    print(f"\n모달 제목: {modal_title}")
    print(f"운세 요약: {modal_summary}")

    # 운세 카드 개수 확인
    fortune_cards = page.locator('.fortune-card').count()
    print(f"운세 카드 개수: {fortune_cards}개")

    # 뒤로가기 버튼 클릭하여 모달 닫기
    page.locator('.modal-back').click()
    page.wait_for_timeout(300)

    # 모달이 닫혔는지 확인
    modal_visible = page.locator('.modal-overlay.active').count()
    if modal_visible == 0:
        print("\n✅ 모달이 정상적으로 닫혔습니다.")
    else:
        print("\n❌ 모달이 아직 열려있습니다.")

    browser.close()
    print("\n테스트 완료!")
