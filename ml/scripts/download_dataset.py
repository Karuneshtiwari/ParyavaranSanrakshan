"""
ParyavaranSanrakshan - TrashNet Dataset Download and Verification Script
Dataset source: Gary Thung & Mindy Yang (TrashNet: https://github.com/garythung/trashnet)
Classes: cardboard, glass, metal, paper, plastic, trash
"""

import os
import sys
import shutil
import urllib.request
import zipfile

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))
DATASET_DIR = os.path.join(DATA_DIR, "dataset-resized")
EXPECTED_CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

# Mirror/Source URL for TrashNet zip archive (HuggingFace/GitHub release mirror)
TRASHNET_ZIP_URL = "https://huggingface.co/datasets/garythung/trashnet/resolve/main/dataset-resized.zip"


def verify_dataset(dataset_dir: str) -> bool:
    if not os.path.exists(dataset_dir):
        return False
    
    print("\n--- Verifying TrashNet Dataset Structure ---")
    total_images = 0
    class_counts = {}
    
    for cls in EXPECTED_CLASSES:
        cls_dir = os.path.join(dataset_dir, cls)
        if not os.path.isdir(cls_dir):
            print(f"[-] Missing class folder: {cls}")
            return False
        
        valid_files = [
            f for f in os.listdir(cls_dir) 
            if f.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]
        class_counts[cls] = len(valid_files)
        total_images += len(valid_files)
        print(f"  [+] Class '{cls}': {len(valid_files)} images")
        
    print(f"\n[✓] Verification successful! Total verified images: {total_images}")
    return total_images > 0


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"Target data directory: {DATA_DIR}")
    
    if verify_dataset(DATASET_DIR):
        print("\nDataset is already downloaded, verified, and ready for model training!")
        return 0
    
    print("\nTrashNet dataset not found locally. Attempting automated download...")
    zip_path = os.path.join(DATA_DIR, "trashnet.zip")
    
    try:
        def reporthook(count, block_size, total_size):
            if total_size > 0:
                percent = int(count * block_size * 100 / total_size)
                sys.stdout.write(f"\rDownloading TrashNet: {percent}% complete")
                sys.stdout.flush()

        urllib.request.urlretrieve(TRASHNET_ZIP_URL, zip_path, reporthook)
        print("\nDownload finished. Extracting archive...")
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(DATA_DIR)
            
        if os.path.exists(zip_path):
            os.remove(zip_path)
            
        if verify_dataset(DATASET_DIR):
            print("\n[✓] Dataset extracted and successfully verified!")
            return 0
        else:
            print("\n[!] Directory structure does not match expected classes after extraction.")
            return 1
            
    except Exception as e:
        print(f"\n[!] Automatic download failed gracefully: {e}")
        print("\nManual download method:")
        print("1. Download TrashNet dataset from: https://github.com/garythung/trashnet")
        print("2. Extract the dataset folder into: data/dataset-resized/")
        print("3. Ensure 6 subfolders exist: cardboard, glass, metal, paper, plastic, trash")
        print("Refer to DATASETS.md for more details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
