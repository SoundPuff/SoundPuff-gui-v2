import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.ui_helpers import (
    BASE_URL,
    login_with_env,
    open_playlist_from_library,
    submit_create_playlist_form,
    select_first_song_on_create_playlist,
)


def create_playlist(browser, title: str, timeout: int = 10):
    browser.get(f"{BASE_URL}/app/create-playlist")
    wait = WebDriverWait(browser, timeout)
    wait.until(EC.presence_of_element_located((By.ID, "title")))
    browser.find_element(By.ID, "title").send_keys(title)
    select_first_song_on_create_playlist(browser, timeout=timeout)
    submit_create_playlist_form(browser, timeout=timeout)


def find_playlist_card_by_title(browser, title: str, timeout: int = 10):
    # Kept for backward compatibility in this file; use open_playlist_from_library instead.
    els = browser.find_elements(By.XPATH, f"//h3[@title='{title}']")
    return els[0] if els else None


@pytest.mark.usefixtures("browser")
def test_add_song_to_playlist(browser):
    # Create two playlists (source and target)
    login_with_env(browser)
    title_src = f"selenium-src-{int(time.time())}"
    create_playlist(browser, title_src)

    title_tgt = f"selenium-tgt-{int(time.time())}"
    create_playlist(browser, title_tgt)

    # Open source playlist from library
    open_playlist_from_library(browser, title_src, timeout=20)

    # open first song menu
    menu_buttons = browser.find_elements(By.XPATH, "//button[@aria-label='Open song menu']")
    if not menu_buttons:
        raise AssertionError(
            "No song menu buttons found. Ensure the playlist has at least one song and the Playlist page renders the song menu."
        )
    menu_buttons[0].click()

    # click 'Add to another playlist'
    add_to_btn = WebDriverWait(browser, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Add to another playlist']"))
    )
    add_to_btn.click()

    # In modal, pick the target playlist
    # wait for modal button with title
    tgt_btn = WebDriverWait(browser, 5).until(
        EC.element_to_be_clickable((By.XPATH, f"//button[normalize-space()='{title_tgt}']"))
    )
    tgt_btn.click()

    # handle alert confirming result
    try:
        WebDriverWait(browser, 5).until(EC.alert_is_present())
        alert = browser.switch_to.alert
        alert_text = alert.text
        alert.accept()
    except Exception:
        alert_text = ""

    assert "added to playlist" in alert_text.lower() or "already in" in alert_text.lower()


def _get_playlist_like_count(browser):
    # returns integer likes count shown on the playlist page
    span = browser.find_element(By.XPATH, "//span[contains(text(),'likes')]")
    text = span.text.strip()
    try:
        num = int(text.split()[0])
    except Exception:
        num = 0
    return num


def test_like_and_unlike_playlist(browser):
    login_with_env(browser)
    title = f"selenium-like-{int(time.time())}"
    create_playlist(browser, title)

    open_playlist_from_library(browser, title, timeout=20)

    before = _get_playlist_like_count(browser)
    # click like button in header (button containing the Heart icon)
    header_like_btn = browser.find_element(
        By.XPATH,
        "//div[contains(@class,'flex items-center gap-4 mt-6')]//button[.//*[name()='svg' and contains(@class,'w-8')]]",
    )
    header_like_btn.click()
    time.sleep(0.5)
    after_like = _get_playlist_like_count(browser)
    assert after_like == before + 1

    # unlike
    header_like_btn.click()
    time.sleep(0.5)
    after_unlike = _get_playlist_like_count(browser)
    assert after_unlike == before


def test_comment_like_delete_flow(browser):
    login_with_env(browser)
    title = f"selenium-comment-{int(time.time())}"
    create_playlist(browser, title)

    open_playlist_from_library(browser, title, timeout=20)

    comment_text = f"Automated comment {int(time.time())}"
    # find comment input
    input_el = WebDriverWait(browser, 5).until(
        EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Add a comment...']"))
    )
    input_el.clear()
    input_el.send_keys(comment_text)
    # submit by pressing Enter (form submit)
    input_el.send_keys(Keys.RETURN)

    # wait for comment to appear
    comment_p = WebDriverWait(browser, 10).until(
        EC.presence_of_element_located((By.XPATH, f"//p[normalize-space()='{comment_text}']"))
    )
    assert comment_p

    # like the comment
    comment_container = comment_p.find_element(By.XPATH, "ancestor::div[contains(@class,'flex gap-3')]")
    like_btn = comment_container.find_element(By.XPATH, ".//button[@aria-label='Like comment']")
    likes_span = comment_container.find_element(By.XPATH, ".//button[@aria-label='Like comment']/following-sibling::span[1]")
    before_likes = int(likes_span.text.strip() or 0)
    like_btn.click()
    WebDriverWait(browser, 5).until(lambda d: int(likes_span.text.strip() or 0) >= before_likes + 1)

    # open comment menu and delete
    menu_btn = comment_container.find_element(
        By.XPATH,
        ".//div[contains(@class,'absolute') and contains(@class,'top-2')]/button",
    )
    menu_btn.click()
    del_btn = WebDriverWait(browser, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='Delete']"))
    )
    del_btn.click()
    # confirm dialog
    try:
        WebDriverWait(browser, 5).until(EC.alert_is_present())
        alert = browser.switch_to.alert
        alert.accept()
    except Exception:
        pass

    # ensure comment removed
    time.sleep(0.5)
    elems = browser.find_elements(By.XPATH, f"//p[normalize-space()='{comment_text}']")
    assert not elems


def test_delete_playlist(browser):
    login_with_env(browser)
    title = f"selenium-delete-{int(time.time())}"
    create_playlist(browser, title)

    open_playlist_from_library(browser, title, timeout=20)

    # click Delete
    del_btn = WebDriverWait(browser, 5).until(
        EC.element_to_be_clickable(
            (By.XPATH, "//div[contains(@class,'flex items-center gap-4 mt-6')]//button[normalize-space()='Delete']")
        )
    )
    del_btn.click()
    # confirm
    try:
        WebDriverWait(browser, 5).until(EC.alert_is_present())
        alert = browser.switch_to.alert
        alert.accept()
    except Exception:
        pass

    WebDriverWait(browser, 10).until(EC.url_contains('/app/library'))
    assert '/app/library' in browser.current_url
