"""
SajuToday Web Test Script
Tests recently implemented features with localStorage injection for onboarding bypass
"""

from playwright.sync_api import sync_playwright
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

SCREENSHOT_DIR = "H:/Claude_work/SajuToday/test_screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def test_saju_today():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        print("=" * 60)
        print("SajuToday Web Test - Testing Recent Features")
        print("=" * 60)

        # First visit to set up localStorage
        print("\n[0] SETUP - Injecting test data")
        print("-" * 40)
        page.goto('http://localhost:19006')
        page.wait_for_timeout(2000)

        # Inject test data to bypass onboarding
        test_profile = {
            "id": "test_user",
            "name": "테스트",
            "birthDate": "1990-05-15",
            "birthTime": "10:30",
            "calendar": "solar",
            "isLeapMonth": False,
            "gender": "male",
            "timezone": "Asia/Seoul",
            "createdAt": "2024-01-01T00:00:00.000Z",
            "updatedAt": "2024-01-01T00:00:00.000Z"
        }

        test_saju = {
            "pillars": {
                "year": {"stem": "경", "branch": "오"},
                "month": {"stem": "신", "branch": "사"},
                "day": {"stem": "갑", "branch": "자"},
                "hour": {"stem": "기", "branch": "사"}
            },
            "elements": {"wood": 2, "fire": 3, "earth": 1, "metal": 1, "water": 1},
            "yinYang": {"yin": 4, "yang": 4},
            "dayMaster": "갑",
            "dayMasterInfo": {
                "element": "wood",
                "yinYang": "yang",
                "meaning": "큰 나무"
            },
            "tenGods": {"year": "편관", "month": "정관", "hour": "정재"},
            "relations": {"clashes": [], "combines": []},
            "computedAt": "2024-01-01T00:00:00.000Z"
        }

        # Inject localStorage
        page.evaluate(f'''() => {{
            localStorage.setItem('@saju_profile', JSON.stringify({json.dumps(test_profile)}));
            localStorage.setItem('@saju_result', JSON.stringify({json.dumps(test_saju)}));
            localStorage.setItem('@onboarding_complete', 'true');
            localStorage.setItem('@saju_settings', JSON.stringify({{
                "tone": "friendly",
                "length": "medium",
                "notificationEnabled": false,
                "notificationTime": "08:00"
            }}));
        }}''')
        print("   Test data injected into localStorage")

        # Reload page with injected data
        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(8000)  # Wait for full render

        # 1. Home screen test
        print("\n[1] HOME SCREEN TEST")
        print("-" * 40)
        page.screenshot(path=f'{SCREENSHOT_DIR}/01_home_screen.png', full_page=True)
        print("   Screenshot: 01_home_screen.png")

        # Get all visible text
        all_text = page.evaluate('''() => {
            const texts = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                if (text && text.length > 1 && text.length < 100) {
                    texts.push(text);
                }
            }
            return [...new Set(texts)];
        }''')

        print("\n   Visible text on home screen:")
        for text in all_text[:25]:
            print(f"     - {text}")

        # Count interactive elements
        buttons = page.locator('div[role="button"]').all()
        print(f"\n   Interactive elements (role=button): {len(buttons)}")

        # 2. Side menu test
        print("\n[2] SIDE MENU TEST")
        print("-" * 40)

        if len(buttons) > 0:
            try:
                print(f"   Clicking first button (menu)...")
                buttons[0].click()
                page.wait_for_timeout(1500)
                page.screenshot(path=f'{SCREENSHOT_DIR}/02_side_menu.png', full_page=True)
                print("   Screenshot: 02_side_menu.png")

                menu_text = page.evaluate('''() => {
                    const texts = [];
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent.trim();
                        if (text && text.length > 1) {
                            texts.push(text);
                        }
                    }
                    return [...new Set(texts)];
                }''')

                print("\n   Menu items found:")
                for text in menu_text[:30]:
                    print(f"     - {text}")

                # Close menu by clicking backdrop or pressing escape
                page.keyboard.press('Escape')
                page.wait_for_timeout(500)

            except Exception as e:
                print(f"   Error: {e}")

        # 3. Fortune detail test
        print("\n[3] FORTUNE DETAIL TEST")
        print("-" * 40)

        page.reload()
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(5000)

        buttons = page.locator('div[role="button"]').all()
        print(f"   Found {len(buttons)} clickable elements")

        # Look for fortune detail button (usually has text like "전체 운세 보기")
        for i, btn in enumerate(buttons):
            try:
                text = btn.inner_text()
                if '운세' in text or '보기' in text:
                    print(f"   Found fortune button at index {i}: {text[:50]}")
                    btn.click()
                    page.wait_for_timeout(2000)
                    page.screenshot(path=f'{SCREENSHOT_DIR}/03_fortune_detail.png', full_page=True)
                    print("   Screenshot: 03_fortune_detail.png")

                    # Get fortune detail text
                    detail_text = page.evaluate('''() => {
                        const texts = [];
                        const walker = document.createTreeWalker(
                            document.body,
                            NodeFilter.SHOW_TEXT,
                            null,
                            false
                        );
                        let node;
                        while (node = walker.nextNode()) {
                            const text = node.textContent.trim();
                            if (text && text.length > 1) {
                                texts.push(text);
                            }
                        }
                        return [...new Set(texts)];
                    }''')

                    print("\n   Fortune detail content:")
                    for text in detail_text[:30]:
                        print(f"     - {text}")
                    break
            except:
                pass

        # 4. Compatibility screen test
        print("\n[4] COMPATIBILITY SCREEN TEST")
        print("-" * 40)

        page.goto('http://localhost:19006')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(5000)

        buttons = page.locator('div[role="button"]').all()

        # Usually the heart button is the second button in header
        if len(buttons) > 1:
            try:
                print(f"   Clicking second button (heart/compatibility)...")
                buttons[1].click()
                page.wait_for_timeout(2000)
                page.screenshot(path=f'{SCREENSHOT_DIR}/04_compatibility.png', full_page=True)
                print("   Screenshot: 04_compatibility.png")

                compat_text = page.evaluate('''() => {
                    const texts = [];
                    const walker = document.createTreeWalker(
                        document.body,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    let node;
                    while (node = walker.nextNode()) {
                        const text = node.textContent.trim();
                        if (text && text.length > 1) {
                            texts.push(text);
                        }
                    }
                    return [...new Set(texts)];
                }''')

                print("\n   Compatibility screen content:")
                for text in compat_text[:25]:
                    print(f"     - {text}")

            except Exception as e:
                print(f"   Error: {e}")

        # 5. Final summary
        print("\n[5] FINAL STATE")
        print("-" * 40)
        page.screenshot(path=f'{SCREENSHOT_DIR}/05_final.png', full_page=True)
        print("   Screenshot: 05_final.png")

        print("\n" + "=" * 60)
        print("TEST COMPLETED!")
        print(f"Screenshots saved at: {SCREENSHOT_DIR}")
        print("=" * 60)

        browser.close()

if __name__ == "__main__":
    test_saju_today()
