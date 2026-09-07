import json
import time
import random
import os
import re
from playwright.sync_api import sync_playwright

# Archivos de persistencia y datos
DATA_FILE = 'src/data/hardware.json'
LOG_FILE = 'processed_urls.txt'
URLS_FILE = 'urls_list.txt'

def cargar_procesadas():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            return set(line.strip() for line in f)
    return set()

def guardar_gpu(gpu_data, url):
    if not os.path.exists(DATA_FILE):
        print(f"❌ No se encontró el archivo {DATA_FILE}")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Evitamos duplicados por ID
    if not any(g['id'] == gpu_data['id'] for g in data.get('gpus', [])):
        data['gpus'].append(gpu_data)
        
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # Registrar URL como procesada
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(f"{url}\n")

def extraer_gpu_techpowerup(page, url):
    page.goto(url, timeout=45000, wait_until="domcontentloaded")
    
    # 1. Extraemos marca, modelo e id directamente de la propia URL para evitar desfases
    url_slug = url.split("/gpu-specs/")[1].split(".")[0]  # Obtiene 'asus-rog-strix-rtx-4090-oc'
    parts = url_slug.split("-")
    
    brand = parts[0].upper() if len(parts) > 0 else "UNKNOWN"
    # Reconstruimos un nombre legible a partir del slug de la URL
    model = " ".join([p.upper() if p in ["rtx", "gtx", "rx", "oc", "ti"] else p.capitalize() for p in parts[1:]])
    slug = url_slug

    gpu_data = {
        "id": slug,
        "brand": brand,
        "model": model,
        "slug": slug,
        "connectorType": "8-pin",
        "dimensions": {
            "lengthMM": 0.0,
            "widthMM": 0.0,
            "heightMM": 0.0
        }
    }

    # 2. Intentamos afinar el modelo exacto leyendo el H1 de la página si está listo
    try:
        h1_elem = page.locator("h1.gpudb-name")
        if h1_elem.count() > 0:
            full_title = h1_elem.inner_text().strip()
            if full_title and "Access Denied" not in full_title:
                brand = full_title.split(" ")[0]
                gpu_data["brand"] = brand
                gpu_data["model"] = full_title.replace(brand, "").strip()
    except Exception:
        pass  # Si falla el H1, se queda con el nombre extraído de la URL que es 100% preciso

    # 3. Extraemos las dimensiones desde la tabla de especificaciones
    for row in page.locator("tr, dl").all():
        try:
            text = row.inner_text()
            if "Length" in text and "mm" in text and gpu_data["dimensions"]["lengthMM"] == 0:
                match = re.search(r'(\d+(?:\.\d+)?)\s*mm', text)
                if match: gpu_data["dimensions"]["lengthMM"] = float(match.group(1))
            if "Width" in text and "mm" in text and gpu_data["dimensions"]["widthMM"] == 0:
                match = re.search(r'(\d+(?:\.\d+)?)\s*mm', text)
                if match: gpu_data["dimensions"]["widthMM"] = float(match.group(1))
            if "Height" in text and "mm" in text and gpu_data["dimensions"]["heightMM"] == 0:
                match = re.search(r'(\d+(?:\.\d+)?)\s*mm', text)
                if match: gpu_data["dimensions"]["heightMM"] = float(match.group(1))
        except Exception:
            continue

    # 4. Conector de energía
    content = page.content()
    if "12VHPWR" in content or "16-pin" in content:
        gpu_data["connectorType"] = "12VHPWR"

    return gpu_data

def ejecutar_worker():
    if not os.path.exists(URLS_FILE):
        print(f"❌ No existe el archivo '{URLS_FILE}'. Crea este archivo y añade las URLs.")
        return

    with open(URLS_FILE, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    procesadas = cargar_procesadas()
    pendientes = [u for u in urls if u not in procesadas]

    print(f"🚀 Iniciando worker masivo: {len(pendientes)} URLs pendientes de un total de {len(urls)}.")

    with sync_playwright() as p:
        # Modo stealth para saltar Cloudflare
        browser = p.chromium.launch(
            headless=False,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--start-maximized'
            ]
        )
        
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={'width': 1920, 'height': 1080},
            locale="es-ES"
        )
        
        # Ocultamos la variable navigator.webdriver
        context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

        for idx, url in enumerate(pendientes, 1):
            print(f"[{idx}/{len(pendientes)}] Procesando: {url}")
            
            # Abrimos una pestaña limpia para cada URL
            page = context.new_page()
            
            try:
                gpu_data = extraer_gpu_techpowerup(page, url)
                
                # Verificamos que no se haya colado un bloqueo 403
                if "403" in gpu_data["brand"] or "Access Denied" in gpu_data["model"]:
                    print("  ⚠️ Bloqueo detectado, saltando...")
                else:
                    guardar_gpu(gpu_data, url)
                    print(f"  ✅ Guardado correctamente: {gpu_data['brand']} {gpu_data['model']}")
            except Exception as e:
                print(f"  ❌ Error en la URL: {e}")
            finally:
                # Cerramos la pestaña siempre antes de pasar a la siguiente
                page.close()

            # Pausa aleatoria anti-bot entre 5 y 9 segundos
            wait_time = random.uniform(5.0, 9.0)
            time.sleep(wait_time)

        browser.close()
        print("🎉 ¡Proceso por lotes finalizado!")
if __name__ == '__main__':
    ejecutar_worker()