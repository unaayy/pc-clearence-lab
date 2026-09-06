import json
import os
import re
import requests
from bs4 import BeautifulSoup

DATA_FILE = os.path.join("src", "data", "hardware.json")

def load_data():
    if not os.path.exists(DATA_FILE):
        return {"cases": [], "gpus": [], "aios": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print("✅ Base de datos 'hardware.json' actualizada con éxito.")

def generate_slug(brand, model):
    return f"{brand}-{model}".lower().replace(" ", "-").replace("+", "plus").replace("/", "-")

# --- INYECTOR DE GRÁFICAS ---
def add_gpu(brand, model, length_mm, width_mm, height_mm, connector_type="12VHPWR"):
    data = load_data()
    slug = generate_slug(brand, model)
    
    new_gpu = {
        "id": slug,
        "brand": brand,
        "model": model,
        "slug": slug,
        "connectorType": connector_type,
        "dimensions": {
            "lengthMM": float(length_mm),
            "widthMM": float(width_mm),
            "heightMM": float(height_mm)
        }
    }
    
    data["gpus"] = [g for g in data["gpus"] if g["slug"] != slug]
    data["gpus"].append(new_gpu)
    save_data(data)

# --- INYECTOR DE TORRES / CAJAS ---
def add_case(brand, model, max_gpu_length, max_cpu_cooler_height, psu_shroud_depth=0, radiator_front_support=True):
    data = load_data()
    slug = generate_slug(brand, model)
    
    new_case = {
        "id": slug,
        "brand": brand,
        "model": model,
        "slug": slug,
        "maxGpuLengthMM": float(max_gpu_length),
        "maxCpuCoolerHeightMM": float(max_cpu_cooler_height),
        "psuShroudDepthMM": float(psu_shroud_depth),
        "radiatorFrontSupport": radiator_front_support
    }
    
    data["cases"] = [c for c in data["cases"] if c["slug"] != slug]
    data["cases"].append(new_case)
    save_data(data)

# --- CRAWLER / SCRAPER AUTÓNOMO DE DIMENSIONES ---
def parse_specs_html(html_text):
    """
    Usa BeautifulSoup para buscar patrones de dimensiones en mm dentro de un texto HTML.
    """
    soup = BeautifulSoup(html_text, "html.parser")
    text = soup.get_text()
    
    # Busca números seguidos de 'mm' (ej: 340 mm x 150 mm x 60 mm)
    matches = re.findall(r'(\d+(?:\.\d+)?)\s*mm', text, re.IGNORECASE)
    numbers = [float(m) for m in matches]
    return numbers

def run_automation():
    print("🕷️ Ejecutando ingestión masiva de componentes...")
    
    # 1. Inyectamos nuevas Cajas/Torres populares
    new_cases = [
        ("Fractal Design", "North", 355.0, 170.0, 0, True),
        ("Hyte", "Y60", 375.0, 160.0, 0, False),
        ("DeepCool", "CH560 Digital", 380.0, 175.0, 0, True),
        ("Montech", "KING 95 PRO", 420.0, 175.0, 0, True)
    ]
    
    for case_item in new_cases:
        add_case(*case_item)

    # 2. Inyectamos un nuevo lote de GPUs
    new_gpus = [
        ("Sapphire", "PULSE RX 7700 XT", 280.0, 128.7, 52.5, "8-pin"),
        ("XFX", "Speedster QICK 319 RX 7800 XT", 335.0, 130.0, 52.0, "8-pin"),
        ("Gigabyte", "AORUS GeForce RTX 4090 MASTER", 358.0, 162.8, 75.1, "12VHPWR")
    ]
    
    for gpu_item in new_gpus:
        add_gpu(*gpu_item)

if __name__ == "__main__":
    run_automation()