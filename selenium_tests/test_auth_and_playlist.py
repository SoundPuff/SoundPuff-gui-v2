import os
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.ui_helpers import (
    BASE_URL,
    login_with_env,
    select_first_song_on_create_playlist,
    submit_create_playlist_form,
)


def test_login(browser):
    login_with_env(browser)
    assert "/app/" in browser.current_url


def test_create_playlist(browser):
    login_with_env(browser)

    # go to create playlist page
    browser.get(f"{BASE_URL}/app/create-playlist")
    wait = WebDriverWait(browser, 10)
    wait.until(EC.presence_of_element_located((By.ID, "title")))

    # fill title and description
    title = f"selenium-playlist-{int(time.time())}"
    browser.find_element(By.ID, "title").send_keys(title)
    try:
        browser.find_element(By.ID, "description").send_keys("Created by automated Selenium test")
    except Exception:
        pass

    select_first_song_on_create_playlist(browser)

    submit_create_playlist_form(browser)
    assert "/app/library" in browser.current_url
