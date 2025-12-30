import os
import shutil

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKUP_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "tools", "_affiliates_backup"))

def main():
    if not os.path.isdir(BACKUP_DIR):
        print(f"ERROR: backup folder not found: {BACKUP_DIR}")
        return

    restored = 0

    for root, _, files in os.walk(BACKUP_DIR):
        for name in files:
            if name.lower() != "index.html":
                continue

            backup_path = os.path.join(root, name)
            rel = os.path.relpath(backup_path, BACKUP_DIR)
            target_path = os.path.join(PROJECT_ROOT, rel)

            os.makedirs(os.path.dirname(target_path), exist_ok=True)
            shutil.copy2(backup_path, target_path)
            restored += 1

    print(f"ENABLE DONE: restored_files={restored}")

if __name__ == "__main__":
    main()
