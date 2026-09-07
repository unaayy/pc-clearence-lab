import time
from playwright.sync_api import sync_playwright

OUTPUT_FILE = "urls_list.txt"

def recolectar_urls():
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

        print("🔍 Navegando a la base de datos principal de GPUs...")
        try:
            # Cargamos la página raíz oficial que sí está soportada
            page.goto("https://www.techpowerup.com/gpu-specs/", timeout=60000, wait_until="domcontentloaded")
            
            print("  ⏳ Esperando validación o carga de la página...")
            time.sleep(5) # Margen por si salta Cloudflare
            
            # Hacemos scroll progresivo para forzar la carga de la tabla completa de componentes
            for _ in range(5):
                page.evaluate("window.scrollBy(0, 800)")
                time.sleep(1)

            # Extraemos todos los enlaces a fichas de GPUs presentes en la tabla/lista principal
            hrefs = page.eval_on_selector_all(
                "a[href^='/gpu-specs/']", 
                "elements => elements.map(el => el.getAttribute('href'))"
            )

            for href in hrefs:
                # Filtramos para asegurarnos de que es un modelo individual (tienen extensión tipo .b1234)
                if href and "." in href and not href.endswith("/gpu-specs/"):
                    full_url = f"https://www.techpowerup.com{href}" if href.startswith("/") else href
                    collected_urls.add(full_url)

            print(f"  └─ ✅ Capturadas {len(collected_urls)} URLs directas de GPUs.")

        except Exception as e:
            print(f"❌ Error durante la recolección: {e}")

        browser.close()

    # Guardamos acumulando sobre las que ya tuvieras en urls_list.txt
    existing_urls = set()
    try:
        with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
            existing_urls = set(line.strip() for line in f if line.strip())
    except FileNotFoundError:
        pass

    all_urls = sorted(existing_urls.union(collected_urls))

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for url in all_urls:
            f.write(f"{url}\n")

    print(f"\n🎉 ¡Recolección exitosa! Se han guardado {len(all_urls)} URLs listas en '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    recolectar_urls()