import os
import json
import urllib.request
import urllib.parse
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

OUTPUT_DIR = r"C:\Users\upasa\.gemini\antigravity\scratch\mars-guard\frontend\public\assets\nasa"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SEARCH_QUERIES = [
    "jezero crater perseverance",
    "mars rover panorama",
    "hirise mars close up",
    "mars dust storm",
    "mars rover selfie curiosity perseverance",
    "mars sunset",
    "mars sand dunes",
    "mars ice polar cap",
    "olympus mons mars",
    "valles marineris mars",
    "gale crater curiosity"
]

manifest = []
downloaded_ids = set()

print("Fetching curated NASA images...")

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MARS-GUARD/2.0 NASA-Challenge'
}

for query in SEARCH_QUERIES:
    if len(manifest) >= 45:
        break
    try:
        url = f"https://images-api.nasa.gov/search?q={urllib.parse.quote(query)}&media_type=image"
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('collection', {}).get('items', [])
            for item in items:
                if len(manifest) >= 45:
                    break
                data_list = item.get('data', [])
                links = item.get('links', [])
                if not data_list or not links:
                    continue
                d = data_list[0]
                nasa_id = d.get('nasa_id', '')
                if not nasa_id or nasa_id in downloaded_ids:
                    continue
                
                # Get image link (thumb or orig)
                img_url = links[0].get('href', '')
                if not img_url:
                    continue
                
                # Fetch asset manifest to find medium or orig
                orig_img_url = img_url
                try:
                    asset_url = f"https://images-api.nasa.gov/asset/{urllib.parse.quote(nasa_id)}"
                    asset_req = urllib.request.Request(asset_url, headers=headers)
                    with urllib.request.urlopen(asset_req, context=ctx, timeout=10) as a_resp:
                        asset_data = json.loads(a_resp.read().decode('utf-8'))
                        asset_items = asset_data.get('collection', {}).get('items', [])
                        # Prefer ~medium or ~small to stay fast and lightweight
                        for ai in asset_items:
                            href = ai.get('href', '')
                            if '~medium.jpg' in href or '~small.jpg' in href or '~thumb.jpg' in href:
                                orig_img_url = href
                                break
                except Exception:
                    pass
                
                # Filename
                safe_id = "".join([c if c.isalnum() or c in "-_" else "_" for c in nasa_id])
                filename = f"{safe_id}.jpg"
                filepath = os.path.join(OUTPUT_DIR, filename)
                
                try:
                    img_req = urllib.request.Request(orig_img_url, headers=headers)
                    with urllib.request.urlopen(img_req, context=ctx, timeout=15) as i_resp:
                        content = i_resp.read()
                        if len(content) > 1000:
                            with open(filepath, 'wb') as f:
                                f.write(content)
                            
                            downloaded_ids.add(nasa_id)
                            entry = {
                                "id": nasa_id,
                                "filename": filename,
                                "title": d.get('title', 'Mars Exploration Surface Observation'),
                                "date": d.get('date_created', '2021-02-18'),
                                "instrument": d.get('secondary_creator', 'NASA / JPL-Caltech / MSSS / MRO / Mastcam-Z'),
                                "credit": "NASA / JPL-Caltech / University of Arizona / MSSS",
                                "description": (d.get('description', '') or '')[:200],
                                "category": query.split()[0].title(),
                                "original_url": orig_img_url,
                                "local_path": f"/assets/nasa/{filename}"
                            }
                            manifest.append(entry)
                            print(f"[{len(manifest)}/45] Saved {filename}: {entry['title'][:40]}")
                except Exception as e:
                    print(f"Failed to download image {orig_img_url}: {e}")
    except Exception as e:
        print(f"Query error for '{query}': {e}")

print(f"Total images downloaded: {len(manifest)}")

# Also download Mars globe texture
mars_tex_path = os.path.join(OUTPUT_DIR, "mars_surface_texture.jpg")
mars_bump_path = os.path.join(OUTPUT_DIR, "mars_elevation_bump.jpg")

# NASA Viking Mars color mosaic (public domain NASA map)
mars_tex_url = "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/mars_1k_color.jpg"
try:
    print("Downloading Mars globe texture...")
    req = urllib.request.Request(mars_tex_url, headers=headers)
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        with open(mars_tex_path, 'wb') as f:
            f.write(resp.read())
        print("Mars surface texture saved.")
except Exception as e:
    print(f"Mars texture download note: {e}")

# Save manifest.json
manifest_path = os.path.join(OUTPUT_DIR, "manifest.json")
with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, indent=2)

print(f"Manifest written with {len(manifest)} entries to {manifest_path}")

