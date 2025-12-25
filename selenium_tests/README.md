# Selenium tests for SoundPuff

Setup
-----

1. Create and activate a Python virtual environment (recommended):

```bash
python3 -m venv .venv
source .venv/bin/activate
```

2. Install dependencies:

```bash
pip install -r selenium_tests/requirements.txt
```

Running tests
-------------

Start the dev server (Vite default):

```bash
npm run dev
```

Run tests (defaults to `http://localhost:3000`):

```bash
# headless (default)
BASE_URL=http://localhost:3000 pytest -q selenium_tests

# run with visible browser for debugging
HEADLESS=0 BASE_URL=http://localhost:3000 pytest -q selenium_tests

# if your machine/app is a bit slow to load/render
SELENIUM_TIMEOUT=20 HEADLESS=0 BASE_URL=http://localhost:3000 pytest -q selenium_tests
```

Auth-required tests
-------------------

Some tests require an authenticated session.

Provide existing credentials:

```bash
export TEST_EMAIL=you@example.com
export TEST_PASSWORD=yourpassword
```

Alternatively, put them in one of these files (tests will auto-load them):

- `.env`
- `.env.local`
- `selenium_tests/.env`

Example `selenium_tests/.env`:

```bash
TEST_EMAIL=you@example.com
TEST_PASSWORD=yourpassword
```

If playlist creation fails due to missing songs, seed your backend with songs/playlists or set:

```bash
export TEST_SONG_QUERY=some_query_that_returns_songs
```

Notes
-----
- Tests use Selenium 4 which uses Selenium Manager to obtain the appropriate browser driver automatically.
- Update selectors in `test_click_and_navigation.py` to match the actual DOM elements you want to interact with.
- If your dev server runs on a different port, set `BASE_URL` accordingly.
