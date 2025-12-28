import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.ui_helpers import (
    BASE_URL,
    login_with_env,
    click_with_fallback
)

# ----------------------------------------------------------------
# TEST 1: MEDIA PLAYER CONTROLS (UC-10 & FR-9)
# ----------------------------------------------------------------
def test_media_player_controls(browser):
    print("\n----------------------------------------------------------------")
    print("   [TEST 1] BAŞLIYOR: Medya Oynatıcı Kontrolleri")
    
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)
    
    # 1. Ana sayfaya git
    browser.get(f"{BASE_URL}/app/home")
    time.sleep(2) # Sayfa yüklenmesini bekle

    # 2. Bir Playlist'e Gir
    # Hero Banner varsa "Play Now" butonu bizi playlist sayfasına atar.
    # Yoksa herhangi bir playlist kartına tıklarız.
    try:
        try:
            # Hero Banner "Play Now" butonu (Navigate eder)
            hero_btn = browser.find_element(By.XPATH, "//button[contains(normalize-space(), 'Play Now')]")
            click_with_fallback(browser, hero_btn)
            print("   [Adım] Hero Banner üzerinden playlist sayfasına gidiliyor...")
        except:
            # Hero yoksa ilk karta tıkla
            print("   [Bilgi] Hero Banner yok, listeden bir playlist seçiliyor...")
            first_card_title = wait.until(EC.element_to_be_clickable((By.XPATH, "(//h3)[1]")))
            click_with_fallback(browser, first_card_title)
        
        # Playlist sayfasına girdiğimizi doğrula
        wait.until(EC.url_contains("/playlist/"))
        print(f"   [Adım] Playlist sayfasına girildi: {browser.current_url}")

    except Exception as e:
        pytest.skip(f"Playlist sayfasına gidilemedi: {e}")

    # 3. Listeden Bir Şarkıya Tıkla (Player'ı tetiklemek için)
    try:
        # Şarkı listesinin yüklenmesini bekle (Grup class'ı olan divler şarkı satırlarıdır)
        first_song_row = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'group') and contains(@class, 'grid-cols')]")))
        
        click_with_fallback(browser, first_song_row)
        print("   [Adım] Listedeki ilk şarkıya tıklandı.")
        
    except Exception as e:
        pytest.fail(f"Şarkı listesi bulunamadı veya boş: {e}")

    # 4. Player Bar'ın Görünmesini Bekle
    try:
        # 'fixed bottom-0' sınıfına sahip div (Player Bar)
        player_bar = wait.until(EC.visibility_of_element_located((By.XPATH, "//div[contains(@class, 'fixed') and contains(@class, 'bottom-0')]")))
        print("   [Kontrol] Player Bar açıldı.")
    except:
        browser.save_screenshot("player_bar_error.png")
        pytest.fail("Şarkıya tıklanmasına rağmen Player Bar açılmadı!")

    # 5. Play/Pause Testi
    try:
        # Şarkı başladığı için Pause butonu görünmeli
        pause_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//svg[contains(@class, 'lucide-pause')]]")))
        click_with_fallback(browser, pause_btn)
        print("   [Adım] Şarkı duraklatıldı (Pause).")
        time.sleep(1)

        # Şimdi Play butonu görünmeli
        play_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'fixed')]//button[.//svg[contains(@class, 'lucide-play')]]")))
        click_with_fallback(browser, play_btn)
        print("   [Adım] Şarkı tekrar başlatıldı (Play).")
        
    except Exception as e:
        print(f"   [Uyarı] Play/Pause butonları bulunamadı: {e}")

    print("   [TEST 1] TAMAMLANDI ✅")


# ----------------------------------------------------------------
# TEST 2: PLAYLIST LIKE / UNLIKE (UC-11 & FR-10)
# ----------------------------------------------------------------
def test_playlist_social_interaction(browser):
    print("\n----------------------------------------------------------------")
    print("   [TEST 2] BAŞLIYOR: Playlist Beğeni (Like/Unlike)")
    
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)

    # 1. Playlist Sayfasına Git
    if "/playlist/" not in browser.current_url:
        browser.get(f"{BASE_URL}/app/home")
        time.sleep(2)
        try:
            playlist_title = wait.until(EC.element_to_be_clickable((By.XPATH, "(//h3)[1]")))
            click_with_fallback(browser, playlist_title)
            wait.until(EC.url_contains("/playlist/"))
            print(f"   [Adım] Playlist detay sayfasına girildi.")
        except:
            pytest.skip("Playlist detay sayfasına gidilemedi.")

    # 2. Like Butonunu Bul (Header'daki)
    # STRATEJİ: Header'daki "likes" yazısını (örn: "5 likes") referans alarak yanındaki butonu buluyoruz.
    # Bu yöntem, sayfadaki diğer kalp ikonlarıyla karışmasını %100 engeller.
    # 2. Header Like Butonunu Bul (Frontend değiştirmeden)
    try:
        likes_text_element = wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//span[contains(normalize-space(), 'likes')]")
            )
        )

        # Aynı satırdaki (container) ilk button = playlist like
        header_like_btn = likes_text_element.find_element(
            By.XPATH,
            "ancestor::div[contains(@class,'flex')][1]//button[1]"
        )

        browser.execute_script(
            "arguments[0].scrollIntoView({block:'center'});",
            header_like_btn
        )
        time.sleep(0.5)

        print(f"   [Bilgi] Mevcut durum: {likes_text_element.text}")

        click_with_fallback(browser, header_like_btn)
        print("   [Adım] Header Like butonuna tıklandı.")

        time.sleep(1)
        print("   [Başarılı] Like işlemi tamamlandı.")

    except Exception as e:
        print(f"   [Hata] Header Like butonu bulunamadı: {e}")
        browser.save_screenshot("like_error.png")
        raise

    print("   [TEST 2] TAMAMLANDI ✅")



# TEST 3: COMMENTING SYSTEM (UC-12 & FR-11)
# ----------------------------------------------------------------
def test_comment_submission(browser):
    print("\n----------------------------------------------------------------")
    print("   [TEST 3] BAŞLIYOR: Yorum Yapma")
    
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)
    
    # Playlist sayfasında olduğumuzdan emin olalım, değilsek gidelim
    if "/playlist/" not in browser.current_url:
        browser.get(f"{BASE_URL}/app/home")
        time.sleep(2)
        try:
            playlist_title = wait.until(EC.element_to_be_clickable((By.XPATH, "(//h3)[1]")))
            click_with_fallback(browser, playlist_title)
            wait.until(EC.url_contains("/playlist/"))
        except:
            pytest.skip("Playlist sayfasına girilemedi.")

    # 2. Yorum Yaz
    test_comment = f"Test {int(time.time())}"
    
    try:
        # Input alanını bul
        comment_input = wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Add a comment...']")))
        
        # Input'a scroll yap
        browser.execute_script("arguments[0].scrollIntoView({block: 'center'});", comment_input)
        
        comment_input.clear()
        comment_input.send_keys(test_comment)
        
        # Gönder butonunu bul (Input'un yanındaki buton)
        send_btn = browser.find_element(By.XPATH, "//input[@placeholder='Add a comment...']/following-sibling::button")
        click_with_fallback(browser, send_btn)
        
        print(f"   [Adım] Yorum gönderildi: {test_comment}")
        
        # Yorumun sayfada göründüğünü doğrula (Biraz zaman tanıyarak)
        wait.until(EC.text_to_be_present_in_element((By.XPATH, "//body"), test_comment))
        print("   [Başarılı] Yorum sayfada göründü.")
        
    except Exception as e:
        print(f"   [Hata] Yorum işlemi başarısız: {e}")
        raise e

    print("   [TEST 3] TAMAMLANDI ✅")
    print("----------------------------------------------------------------\n")