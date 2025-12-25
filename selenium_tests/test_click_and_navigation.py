import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# Base URL used for tests. Set via env var if your dev server runs on a different port.
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")


@pytest.fixture
def driver():
    opts = Options()
    headless = os.getenv("HEADLESS", "1") in ("1", "true", "True")
    if headless:
        opts.add_argument("--headless=new")
        opts.add_argument("--disable-gpu")
    # Use Selenium 4's built-in Selenium Manager to obtain a driver automatically
    driver = webdriver.Chrome(options=opts)
    driver.set_window_size(1280, 800)
    yield driver
    driver.quit()


def test_home_title(driver):
    driver.get(BASE_URL)
    assert "SoundPuff" in driver.title


def test_click_first_link_changes_url(driver):
    driver.get(BASE_URL)
    initial = driver.current_url

    # App can take a few seconds to render (SPA)
    wait = WebDriverWait(driver, 8)
    clickable = []

    # Try to find nav and clickable elements inside it first (SPA may render nav async)
    try:
        nav = wait.until(EC.presence_of_element_located((By.TAG_NAME, "nav")))
        clickable = nav.find_elements(By.TAG_NAME, "button")
        if not clickable:
            clickable = nav.find_elements(By.TAG_NAME, "img")
    except Exception:
        # fallback: wait for any anchor on the page
        try:
            clickable = wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, "a")))
        except Exception:
            clickable = []

    # final fallback: any button/image/anchor instantly available
    if not clickable:
        clickable = driver.find_elements(By.XPATH, "//button|//a|//img")

    assert clickable, "No clickable navigation elements found — update selector in test"

    target = clickable[0]
    try:
        driver.execute_script("arguments[0].scrollIntoView(true);", target)
    except Exception:
        pass
    target.click()

    try:
        WebDriverWait(driver, 8).until(EC.url_changes(initial))
    except Exception:
        time.sleep(0.8)

    assert driver.current_url != initial
