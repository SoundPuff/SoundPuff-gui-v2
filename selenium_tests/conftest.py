import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def _load_env_file(path: str) -> None:
    """Tiny .env loader (KEY=VALUE lines) so pytest can reuse app credentials.

    Only sets variables that aren't already set in the environment.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" not in line:
                    continue
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = value
    except FileNotFoundError:
        return


# Load root .env files if present so tests don't skip when creds exist in project env
_load_env_file(os.path.join(os.getcwd(), ".env"))
_load_env_file(os.path.join(os.getcwd(), ".env.local"))
_load_env_file(os.path.join(os.getcwd(), "selenium_tests", ".env"))


# Base URL used for tests
BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")


@pytest.fixture
def browser():
    opts = Options()
    headless = os.getenv("HEADLESS", "1") in ("1", "true", "True")
    if headless:
        opts.add_argument("--headless=new")
        opts.add_argument("--disable-gpu")
    drv = webdriver.Chrome(options=opts)
    drv.set_window_size(1280, 800)
    # Avoid flakiness on slower page loads
    try:
        drv.set_page_load_timeout(30)
        drv.set_script_timeout(30)
    except Exception:
        pass
    yield drv
    try:
        drv.quit()
    except Exception:
        pass


def get_base_url():
    return BASE_URL
