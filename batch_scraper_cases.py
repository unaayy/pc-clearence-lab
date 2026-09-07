import json
import time
import random
import os
import re
from playwright.sync_api import sync_playwright

DATA_FILE = 'src/data/hardware.json'
LOG_FILE = 'processed_cases_urls.txt'
URLS_FILE = 'urls_cases_list.txt'

def cargar_procesadas():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            return set(line.strip() for line in f if line.strip())
    return set()

def guardar_caja(case_data, url):
    if not os.path.exists(DATA_FILE):
        print(f"❌ No se encontró el archivo {DATA_FILE}")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    if 'cases' not in data:
        data['cases'] = []

    # Evitamos duplicados por ID / slug
    if not any(c['id'] == case_data['id'] for c in data['cases']):
        data['cases'].append(case_data)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # Registrar URL como procesada
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{url}\n")

def extraer_caja(page, url):
    page.goto(url, timeout=45000, wait_until="domcontentloaded")
    
    # Extraemos marca y modelo a partir del slug de la URL
    url_slug = url.split("/review/")[1].split("/")[0]
    parts = url_slug.split("-")
    
    brand = parts[0].upper() if len(parts) > 0 else "UNKNOWN"
    model = " ".join([p.capitalize() for p in parts[1:]])
    slug = url_slug

    case_data = {
        "id": slug,
        "brand": brand,
        "model": model,
        "slug": slug,
        "maxGpuLengthMM": 360.0,  # Valor por defecto seguro si no se especifica
        "maxAioSizeMM": 360,
        "supportedFormFactors": ["ATX", "Micro-ATX", "Mini-ITX"]
    }

    # Intentamos extraer el valor real de GPU Clearance del texto/tablas
    content = page.content()
    
    # Patrones comunes en TechPowerUp para medidas de gráfica
    match = re.search(r'(?:GPU|Graphics Card)(?: clearance| length)?:?\s*(\d{3})\s*mm', content, re.IGNORECASE)
    if not match:
        match = re.search(r'(\d{3})\s*mm\s*(?:GPU|Graphics Card)', content, re.IGNORECASE)
        
    if match:
        case_data["maxGpuLengthMM"] = float(match.group(1))

    return case_data

def ejecutar_worker_cajas():
    if not os.path.exists(URLS_FILE):
        print(f"❌ No existe '{URLS_FILE}'. Ejecuta primero url_collector_cases.py")
        return

    with open(URLS_FILE, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    # Palabras clave de artículos no deseados
    PALABRAS_PROHIBIDAS = ["benchmark", "steam-deck", "performance", "game-test", "handheld", "ally-x", "claw-8"]

    procesadas = cargar_procesadas()
    pendientes = [u for u in urls if u not in procesadas]

    print(f"🚀 Iniciando worker de Cajas: {len(pendientes)} URLs pendientes de {len(urls)}.")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=['--disable-blink-features=AutomationControlled', '--start-maximized']
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080}
        )
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        for idx, url in enumerate(pendientes, 1):
            # Filtro de seguridad: saltar si la URL es de un benchmark/juego
            if any(palabra in url.lower() for palabra in PALABRAS_PROHIBIDAS):
                print(f"[{idx}/{len(pendientes)}] ⚠️ Saltando artículo (no es caja): {url}")
                continue

            print(f"[{idx}/{len(pendientes)}] Procesando Caja: {url}")
            page = context.new_page()
            
            try:
                case_data = extraer_caja(page, url)
                guardar_caja(case_data, url)
                print(f"  ✅ Guardada: {case_data['brand']} {case_data['model']} (Max GPU: {case_data['maxGpuLengthMM']}mm)")
            except Exception as e:
                print(f"  ❌ Error en la URL: {e}")
            finally:
                page.close()

            time.sleep(random.uniform(4.0, 7.0))

        browser.close()
        print("\n🎉 ¡Proceso por lotes de Cajas finalizado con éxito!")
if __name__ == '__main__':
    ejecutar_worker_cajas()