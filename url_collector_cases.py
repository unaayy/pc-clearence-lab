import time
from playwright.sync_api import sync_playwright

OUTPUT_FILE = "urls_cases_list.txt"

def recolectar_cajas():
    collected_urls = set()

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled', '--start-maximized']
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        print("🔍 Navegando a la sección de Cajas/Cases...")
        try:
            # Apuntamos directamente a la categoría de Cases en la sección de reviews
            page.goto("https://www.techpowerup.com/review/?category=Cases", timeout=60000, wait_until="domcontentloaded")
            
            # Esperamos a que cargue la lista o rejilla de artículos
            page.wait_for_selector("article, div.review, table.reviews", timeout=20000)
            
            # Scroll para forzar la carga de más cajas
            for _ in range(5):
                page.evaluate("window.scrollBy(0, 800)")
                time.sleep(1)

            # Buscamos todos los enlaces a reviews dentro de la página
            hrefs = page.eval_on_selector_all(
                "a[href*='/review/']", 
                "elements => elements.map(el => el.getAttribute('href'))"
            )

            for href in hrefs:
                # Filtramos para asegurarnos de que es una review individual de una caja
                if href and href.count('/') >= 2 and not href.endswith('/review/') and not 'category=' in href:
                    full_url = f"https://www.techpowerup.com{href}" if href.startswith('/') else href
                    # Guardamos la página principal de la review (página 1)
                    clean_url = full_url.split('/page-')[0] if '/page-' in full_url else full_url
                    collected_urls.add(clean_url)

            print(f"  └─ ✅ Capturadas {len(collected_urls)} URLs de Cajas únicas.")

        except Exception as e:
            print(f"❌ Error durante la recolección: {e}")

        browser.close()

    # Guardado de URLs
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for url in sorted(collected_urls):
            f.write(f"{url}\n")

    print(f"\n🎉 Recolección finalizada: {len(collected_urls)} URLs guardadas en '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    recolectar_cajas()