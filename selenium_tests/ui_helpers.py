import os
import time
from dataclasses import dataclass

import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
SELENIUM_TIMEOUT = int(os.getenv("SELENIUM_TIMEOUT", "15"))


@dataclass(frozen=True)
class Credentials:
    email: str
    password: str


def _unique_suffix() -> str:
    return str(int(time.time() * 1000))


def login_with_env(browser, timeout: int | None = None) -> Credentials:
    """Log in using TEST_EMAIL/TEST_PASSWORD only.

    This helper does NOT create users (no auto-signup).
    """
    if timeout is None:
        timeout = SELENIUM_TIMEOUT

    email = os.getenv("TEST_EMAIL")
    password = os.getenv("TEST_PASSWORD")
    if not email or not password:
        raise AssertionError(
            "Missing TEST_EMAIL/TEST_PASSWORD. "
            "Set them in your shell env or in a .env/.env.local/selenium_tests/.env file."
        )
    login(browser, email, password, timeout=timeout)
    return Credentials(email=email, password=password)


def login(browser, email: str, password: str, timeout: int | None = None) -> None:
    if timeout is None:
        timeout = SELENIUM_TIMEOUT
    browser.get(f"{BASE_URL}/auth")
    wait = WebDriverWait(browser, timeout)

    # Wait for login form fields (page can take a few seconds to render)
    wait.until(EC.visibility_of_element_located((By.ID, "login-email")))
    wait.until(EC.visibility_of_element_located((By.ID, "login-password")))

    email_el = browser.find_element(By.ID, "login-email")
    password_el = browser.find_element(By.ID, "login-password")
    email_el.clear()
    email_el.send_keys(email)
    password_el.clear()
    password_el.send_keys(password)

    # Click the submit button inside the login form (avoid matching the tab button, etc.)
    login_form = email_el.find_element(By.XPATH, "ancestor::form[1]")
    submit_btn = login_form.find_element(By.XPATH, ".//button[@type='submit']")
    wait.until(lambda d: submit_btn.is_enabled())

    try:
        browser.execute_script("arguments[0].scrollIntoView(true);", submit_btn)
    except Exception:
        pass

    try:
        wait.until(EC.element_to_be_clickable(submit_btn))
        submit_btn.click()
    except Exception:
        # Fallback: JS click (avoids occasional click interception)
        browser.execute_script("arguments[0].click();", submit_btn)

    # Wait for either successful navigation OR an error alert
    def _done(_driver):
        if "/app/" in _driver.current_url:
            return True
        alerts = _driver.find_elements(By.CSS_SELECTOR, "[data-slot='alert'][role='alert']")
        return bool(alerts)

    WebDriverWait(browser, timeout).until(_done)
    if "/app/" not in browser.current_url:
        alerts = browser.find_elements(By.CSS_SELECTOR, "[data-slot='alert'][role='alert']")
        msg = alerts[0].text.strip() if alerts else "Login did not navigate to /app/"
        raise AssertionError(f"Login failed: {msg}")


def click_with_fallback(browser, element, timeout: int | None = None) -> None:
    """Best-effort click helper.

    - scrolls into view
    - normal click
    - JS click fallback (for occasional click interception)
    """
    if timeout is None:
        timeout = SELENIUM_TIMEOUT

    try:
        browser.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
    except Exception:
        pass

    try:
        WebDriverWait(browser, timeout).until(lambda _d: element.is_enabled() and element.is_displayed())
    except Exception:
        pass

    try:
        element.click()
        return
    except Exception:
        browser.execute_script("arguments[0].click();", element)


def select_first_song_on_create_playlist(browser, timeout: int = 10) -> None:
    """Selects the first available song checkbox on the create-playlist page.

    Fails (not skips) if no songs are available, since playlist creation requires at least one song.
    """
    wait = WebDriverWait(browser, timeout)
    # Checkboxes render only when there are songs.
    try:
        checkbox = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-slot='checkbox']")))
        click_with_fallback(browser, checkbox, timeout=timeout)

        # Wait until UI reflects at least 1 selected song
        def _selected_count_ok(_driver):
            spans = _driver.find_elements(By.XPATH, "//span[contains(normalize-space(.), 'selected')]")
            for s in spans:
                txt = (s.text or "").strip()
                if txt.endswith("selected"):
                    try:
                        n = int(txt.split()[0])
                        if n >= 1:
                            return True
                    except Exception:
                        continue
            return False

        WebDriverWait(browser, timeout).until(_selected_count_ok)
        return
    except Exception:
        pass

    # Optional fallback: try typing a query to load songs
    query = os.getenv("TEST_SONG_QUERY", "a")
    inputs = browser.find_elements(By.XPATH, "//input[@placeholder='Search songs...']")
    if inputs:
        inputs[0].clear()
        inputs[0].send_keys(query)
        # wait a bit for debounce (500ms) + request
        time.sleep(1.2)
        checkbox = wait.until(EC.presence_of_element_located((By.XPATH, "//*[@data-slot='checkbox']")))
        click_with_fallback(browser, checkbox, timeout=timeout)

        def _selected_count_ok(_driver):
            spans = _driver.find_elements(By.XPATH, "//span[contains(normalize-space(.), 'selected')]")
            for s in spans:
                txt = (s.text or "").strip()
                if txt.endswith("selected"):
                    try:
                        n = int(txt.split()[0])
                        if n >= 1:
                            return True
                    except Exception:
                        continue
            return False

        WebDriverWait(browser, timeout).until(_selected_count_ok)
        return

    raise AssertionError(
        "No songs/checkboxes found on create-playlist page. "
        "Seed the backend with songs/playlists or set TEST_SONG_QUERY to a query that returns songs."
    )


def submit_create_playlist_form(browser, timeout: int | None = None) -> None:
    """Click the create/edit playlist submit button reliably and wait for navigation."""
    if timeout is None:
        timeout = SELENIUM_TIMEOUT

    wait = WebDriverWait(browser, timeout)
    # The button is type=submit; its text is either 'Create Playlist' or 'Save Changes'
    btn = wait.until(
        EC.presence_of_element_located(
            (
                By.XPATH,
                "//form//button[@type='submit' and (contains(normalize-space(.),'Create Playlist') or contains(normalize-space(.),'Save Changes'))]",
            )
        )
    )
    # Wait until enabled (it is disabled until title + song selected)
    wait.until(lambda _d: btn.is_enabled())
    click_with_fallback(browser, btn, timeout=timeout)
    wait.until(EC.url_contains("/app/library"))


def open_library(browser, timeout: int | None = None) -> None:
    if timeout is None:
        timeout = SELENIUM_TIMEOUT
    browser.get(f"{BASE_URL}/app/library")
    # Wait for library header and either grid container or empty state
    wait = WebDriverWait(browser, timeout)
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(normalize-space(.),'My Playlists')]")))


def find_playlist_title_element(browser, title: str, timeout: int | None = None):
    """Find the <h3> title element for a playlist card in Library.

    Uses the 'title' attribute for robust matching (PlaylistCard sets title={playlist.title}).
    """
    if timeout is None:
        timeout = SELENIUM_TIMEOUT
    wait = WebDriverWait(browser, timeout)

    # Retry a few times: library loads data async.
    end = time.time() + timeout
    last_err = None
    while time.time() < end:
        try:
            # Prefer title attribute exact match
            els = browser.find_elements(By.XPATH, f"//h3[@title={_xpath_literal(title)}]")
            if not els:
                # Fallback: normalized visible text match
                els = browser.find_elements(By.XPATH, f"//h3[normalize-space()={_xpath_literal(title)}]")
            if els:
                return els[0]
        except Exception as e:
            last_err = e
        time.sleep(0.4)
    if last_err:
        raise last_err
    return None


def _xpath_literal(s: str) -> str:
    """Safely embed a Python string as an XPath string literal."""
    if "'" not in s:
        return f"'{s}'"
    if '"' not in s:
        return f'"{s}"'
    parts = s.split("'")
    return "concat(" + ", " .join([f"'{p}'" if i == len(parts) - 1 else f"'{p}', \"'\"" for i, p in enumerate(parts)]) + ")"


def open_playlist_from_library(browser, title: str, timeout: int | None = None) -> None:
    """Open a playlist by title from Library and wait for playlist page navigation."""
    if timeout is None:
        timeout = SELENIUM_TIMEOUT

    open_library(browser, timeout=timeout)
    title_el = find_playlist_title_element(browser, title, timeout=timeout)
    if not title_el:
        # One refresh attempt (sometimes list updates after navigation)
        browser.refresh()
        open_library(browser, timeout=timeout)
        title_el = find_playlist_title_element(browser, title, timeout=timeout)

    if not title_el:
        raise AssertionError(f"Playlist titled '{title}' not found in library")

    # Click the whole card container (PlaylistCard root is a clickable <div>)
    card = title_el.find_element(By.XPATH, "ancestor::div[contains(@class,'cursor-pointer')][1]")
    click_with_fallback(browser, card, timeout=timeout)
    WebDriverWait(browser, timeout).until(EC.url_contains("/app/playlist/"))
