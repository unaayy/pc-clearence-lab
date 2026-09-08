import time
from playwright.sync_api import sync_playwright

OUTPUT_FILE = "urls_cases_list.txt"

TARGET_URLS = [
    "https://www.pccomponentes.com/cajas-torres",
    "https://www.coolmod.com/componentes-pc-torres-cajas/",
    "https://www.amazon.es/s?k=caja+pc+gaming"
]

EXCLUDED_KEYWORDS = [
    'cart', 'login', 'buscar', 'service', 'soporte', 'zendesk', 'privacy',
    'flixcar', 'flixfacts', 'google', 'facebook', 'twitter', 'instagram',
    'cookies', 'politica', 'condiciones', 'ayuda', 'blog', 'devoluciones',
    'componentes-pc-torres-cajas', 'cajas-torres', 'sillas', 'portatiles',
    'smartphones', 'teclados', 'ratones', 'monitores', 'auriculares'
]

def es_url_valida(url):
    url_lower = url.lower()
    return not any(keyword in url_lower for keyword in EXCLUDED_KEYWORDS)

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

        for target_url in TARGET_URLS:
            print(f"🔍 Navegando a: {target_url}...")
            try:
                page.goto(target_url, timeout=60000, wait_until="domcontentloaded")
                time.sleep(2)

                for _ in range(5):
                    page.evaluate("window.scrollBy(0, 800)")
                    time.sleep(1)

                hrefs = page.eval_on_selector_all(
                    "a[href]",
                    "elements => elements.map(el => el.getAttribute('href'))"
                )

                subtotal = len(collected_urls)

                for href in hrefs:
                    if not href or href.startswith('#') or href.startswith('javascript:'):
                        continue

                    if href.startswith('/'):
                        if "pccomponentes.com" in target_url:
                            full_url = f"https://www.pccomponentes.com{href}"
                        elif "coolmod.com" in target_url:
                            full_url = f"https://www.coolmod.com{href}"
                        elif "amazon.es" in target_url:
                            full_url = f"https://www.amazon.es{href}"
                        else:
                            full_url = href
                    else:
                        full_url = href

                    clean_url = full_url.split('?')[0].rstrip('/')

                    if not es_url_valida(clean_url):
                        continue

                    if "pccomponentes.com" in target_url:
                        if clean_url.startswith("https://www.pccomponentes.com/") and len(clean_url.split('/')) == 4:
                            collected_urls.add(clean_url)

                    elif "coolmod.com" in target_url:
                        # Filtrar exclusivamente productos que sean torres/cajas
                        if any(k in clean_url for k in ['caja', 'torre', 'lian-li', 'nzxt', 'corsair', 'fractal', 'deepcool', 'msi-mag', 'phanteks', 'unykach']):
                            if len(clean_url.split('/')) == 4:
                                collected_urls.add(clean_url)

                    elif "amazon.es" in target_url and "/dp/" in href:
                        parts = href.split('/dp/')
                        if len(parts) > 1:
                            asin = parts[1].split('/')[0].split('?')[0]
                            if len(asin) == 10 and asin.isalnum():
                                collected_urls.add(f"https://www.amazon.es/dp/{asin}")

                nuevas = len(collected_urls) - subtotal
                print(f"   └─ ✅ Capturadas {nuevas} URLs de cajas válidas.")

            except Exception as e:
                print(f"❌ Error procesando {target_url}: {e}")

        browser.close()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for url in sorted(collected_urls):
            f.write(f"{url}\n")

    print(f"\n🎉 Recolección finalizada: {len(collected_urls)} URLs guardadas en '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    recolectar_cajas()