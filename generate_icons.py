import sys
import os
from PIL import Image

input_path = r"C:\Users\rohit\.gemini\antigravity\brain\f692b655-6fa7-4667-b9f0-aa8d55afa50d\.user_uploaded\media_1788534950660.jpg"
public_dir = r"C:\Users\rohit\.gemini\antigravity\scratch\maxe\public"

if not os.path.exists(public_dir):
    os.makedirs(public_dir)

try:
    img = Image.open(input_path)
    img = img.convert("RGBA")
    
    # Save 512x512
    img_512 = img.resize((512, 512), Image.Resampling.LANCZOS)
    img_512.save(os.path.join(public_dir, "icon-512x512.png"), format="PNG")
    
    # Save 192x192
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(public_dir, "icon-192x192.png"), format="PNG")
    
    # Save favicon.ico (32x32)
    img_32 = img.resize((32, 32), Image.Resampling.LANCZOS)
    img_32.save(os.path.join(public_dir, "favicon.ico"), format="ICO")
    
    print("SUCCESS")
except Exception as e:
    print(f"FAILED: {e}")
