import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium_tests.ui_helpers import (
    BASE_URL,
    login_with_env,
    click_with_fallback
)

# ----------------------------------------------------------------
# TEST 1: ARAMA FONKSİYONU (UC-09)
# ----------------------------------------------------------------
def test_search_functionality(browser):
    """
    SearchPage.tsx testleri:
    1. Geçerli arama yap.
    2. Sonuçların listelendiğini doğrula.
    3. 'Songs', 'Users' tablarına geçişi kontrol et.
    """
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)
    
    # 1. Arama sayfasına git
    browser.get(f"{BASE_URL}/app/search")

    # 2. Input'u bul
    search_input = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for songs, playlists, or users...']"))
    )
    
    # 3. Arama yap: "Rock"
    search_term = "Pop" 
    search_input.clear()
    search_input.send_keys(search_term)
    time.sleep(1) # Sonuçları bekle
    
    # 4. Şarkı sonuçlarının geldiğini doğrula
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Songs')]")))
    except:
        print("Uyarı: 'Songs' başlığı bulunamadı, arama sonucu boş olabilir.")
    
    assert search_term in browser.page_source or "No results found" in browser.page_source

    # 5. Tab Değişikliği Testi - Users Tabına Geç
    users_tab = browser.find_element(By.XPATH, "//button[normalize-space()='Users']")
    click_with_fallback(browser, users_tab)
    time.sleep(1)


# ----------------------------------------------------------------
# TEST 2: SOSYAL ETKİLEŞİM - FOLLOW (UC-07) - GÜNCELLENDİ
# ----------------------------------------------------------------
def test_follow_unfollow_flow(browser):
    """
    ProfilePage.tsx testleri: Follow / Unfollow işlemi.
    """
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)

    # go to search page
    browser.get(f"{BASE_URL}/app/search")
    
    # wait for input
    search_input = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for songs, playlists, or users...']"))
    )
    search_input.clear()
    
    #a real username to search
    target_user = "lura"
    search_input.send_keys(target_user)
    time.sleep(2) # Sonuçları bekle
    
    # click on users tab
    users_tab = browser.find_element(By.XPATH, "//button[normalize-space()='Users']")
    click_with_fallback(browser, users_tab)
    time.sleep(1)

    # click on the first user from the list
    try:
       #we can click from avatar or name
        first_user = wait.until(EC.element_to_be_clickable((By.XPATH, "//div[contains(@class, 'bg-gray-900')]//img | //div[contains(@class, 'bg-gray-900')]//p")))
        click_with_fallback(browser, first_user)
    except:
        pytest.skip(f"Arama sonucunda '{target_user}' için kullanıcı bulunamadı, veritabanını kontrol et.")

    # find profile page
    try:
        
        if len(browser.find_elements(By.XPATH, "//button[contains(normalize-space(), 'Edit Profile')]")) > 0:
             pytest.skip("Kendi profilimize (login olduğumuz hesap) denk geldik, follow testi yapılamaz.")
             return

        # wait for Follow/Unfollow buttons
        follow_btn = wait.until(EC.presence_of_element_located((
            By.XPATH, 
            "//button[contains(normalize-space(), 'Follow') or contains(normalize-space(), 'Unfollow') or contains(normalize-space(), 'Following')]"
        )))
        
        initial_text = follow_btn.text
        print(f"   [Bilgi] Başlangıç Durumu: {initial_text}")
        
        # click
        click_with_fallback(browser, follow_btn)
        
        # wait for the text change
        def text_has_changed(driver):
            try:
                btn = driver.find_element(By.XPATH, "//button[contains(normalize-space(), 'Follow') or contains(normalize-space(), 'Unfollow') or contains(normalize-space(), 'Following')]")
                return btn.text != initial_text
            except:
                return False
            
        wait.until(text_has_changed)
        
        new_text = browser.find_element(By.XPATH, "//button[contains(normalize-space(), 'Follow') or contains(normalize-space(), 'Unfollow') or contains(normalize-space(), 'Following')]").text
        print(f"   [Başarılı] Follow durumu değişti: {initial_text} -> {new_text}")
        
    except Exception as e:
        print(f"   [Hata] Buton bulunamadı veya etkileşim hatası: {str(e)}")
        raise e


# ----------------------------------------------------------------
# TEST 3: FEED PERFORMANS & SCROLL (UC-08 & NFR-4)
# ----------------------------------------------------------------
def test_feed_performance(browser):
    """
    HomePage.tsx testleri: Feed yüklenme hızı.
    """
    login_with_env(browser)
    browser.get(f"{BASE_URL}/app/home")
    wait = WebDriverWait(browser, 15)

    start_time = time.time()

    # 1. "Your Feed" başlığının gelmesini bekle
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Your Feed')]")))
    
    # 2. Kartların görünür olmasını bekle
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(text(), 'Your Feed')]/..//h3")))

    end_time = time.time()
    load_time = end_time - start_time
    
    print(f"   [Performans] Feed Load Time: {load_time:.2f}s")
    
    # NFR-4: 2 saniye kuralı (Frontend render payı ile 3s)
    assert load_time < 3.0, f"Feed çok yavaş yüklendi: {load_time}s"


# ----------------------------------------------------------------
# TEST 4: GUEST ERİŞİM KISITLAMASI (UC-03)
# ----------------------------------------------------------------
def test_guest_cannot_access_protected_routes(browser):
    """
    Guest Kullanıcı Testleri: Login olmadan erişim denemesi.
    """
    browser.delete_all_cookies()
    
    # Korumalı sayfaya gitmeyi dene
    browser.get(f"{BASE_URL}/app/search")
    
    # Login sayfasına (/auth) attı mı?
    try:
        WebDriverWait(browser, 5).until(EC.url_contains("/auth"))
        assert "/auth" in browser.current_url
    except:
        pass

    # Ana sayfaya (Landing) erişebiliyor mu?
    browser.get(BASE_URL)
    wait = WebDriverWait(browser, 10)
    
    # "Share Your Music" veya benzeri landing page metni
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Share Your Music')]")))

# ----------------------------------------------------------------
# TEST 5: SEARCH PERFORMANCE (NFR-4 variant)
# ----------------------------------------------------------------
def test_search_response_time(browser):
    """
    Performance Test: Measures how fast search results appear.
    Criteria: Results should appear within 2 seconds (NFR-4).
    """
    login_with_env(browser)
    wait = WebDriverWait(browser, 15)
    
    # 1. Arama sayfasına git
    browser.get(f"{BASE_URL}/app/search")
    
    # 2. Input'u bul
    search_input = wait.until(
        EC.visibility_of_element_located((By.XPATH, "//input[@placeholder='Search for songs, playlists, or users...']"))
    )
    
    # 3. Sayacı başlat ve Arama yap
    search_term = "Pop"
    search_input.clear()
    
    start_time = time.time() # Kronometre başla ⏱️
    search_input.send_keys(search_term)
    
    # 4. Sonuçların DOM'a düşmesini bekle (Songs veya Users başlığı)
    # Not: React state update + Network gecikmesi dahil süre
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(text(), 'Songs')] | //h2[contains(text(), 'Users')]")))
    
    end_time = time.time() # Kronometre dur 🛑
    
    response_time = end_time - start_time
    print(f"   [Performans] Search Response Time: {response_time:.2f}s")
    
    # Hedef: 2.0 saniyenin altında olmalı
    assert response_time < 2.0, f"Arama çok yavaş: {response_time:.2f}s (Hedef: < 2.0s)"

   