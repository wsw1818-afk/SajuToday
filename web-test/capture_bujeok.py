# -*- coding: utf-8 -*-
"""웹 테스트베드 부적 디자인 스크린샷 (file:// 직접)"""
from playwright.sync_api import sync_playwright
import os, sys

sys.stdout.reconfigure(encoding='utf-8')
script_dir = os.path.dirname(os.path.abspath(__file__))
html_url = 'file:///' + os.path.join(script_dir, 'index.html').replace('\\', '/')
out_dir = script_dir
print(f'URL: {html_url}')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 430, 'height': 1400}, device_scale_factor=2)
    page.goto(html_url)
    page.wait_for_load_state('networkidle')
    # Google Fonts 로드 대기
    page.wait_for_timeout(2500)
    # phone-frame만 캡처 (탭바 외 영역 제외)
    out_main = os.path.join(out_dir, 'bujeok_web_main.png')
    el = page.locator('.phone-frame').first
    el.screenshot(path=out_main)
    print(f'OK: {out_main}')
    browser.close()
