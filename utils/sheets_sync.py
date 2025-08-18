import json
import os
from pathlib import Path
import threading

# Local JSON storage directory (create if missing)
DATA_DIR = Path(os.getenv("BATTLE_SIM_DATA_DIR", "data")).resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)

ARMIES_FILE = DATA_DIR / "armies.json"
BATTLES_FILE = DATA_DIR / "battles.json"
ACTIVE_BATTLES_FILE = DATA_DIR / "active_battles.json"

_lock = threading.Lock()


def _read_json(path: Path, default):
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return default
    except Exception as e:
        print(f"[Local Store] Failed to read {path.name}: {e}")
        return default



def _enum_to_str(obj):
    # Recursively convert enums to their value or name
    if isinstance(obj, dict):
        return {k: _enum_to_str(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_enum_to_str(v) for v in obj]
    elif hasattr(obj, "__class__") and hasattr(obj, "name") and hasattr(obj, "value"):
        # Enum type
        return str(obj.value)
    return obj

def _atomic_write_json(path: Path, data) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    try:
        # Convert enums to strings before saving
        safe_data = _enum_to_str(data)
        with tmp.open("w", encoding="utf-8") as f:
            json.dump(safe_data, f, ensure_ascii=False, indent=2)
        tmp.replace(path)
    except Exception as e:
        print(f"[Local Store] Failed to write {path.name}: {e}")


# Sync an army to local storage
# army_dict: {id, owner, units: [{type, count}, ...]}
def sync_army(army_dict):
    with _lock:
        armies = _read_json(ARMIES_FILE, [])
        # Find by (id, owner)
        idx = next((i for i, rec in enumerate(armies)
                    if str(rec.get("id")) == str(army_dict.get("id")) and str(rec.get("owner")) == str(army_dict.get("owner"))), None)
        if idx is None:
            armies.append(army_dict)
        else:
            armies[idx] = army_dict
        _atomic_write_json(ARMIES_FILE, armies)


# Sync a battle result to local storage
def sync_battle(battle_dict):
    with _lock:
        battles = _read_json(BATTLES_FILE, [])
        battles.append(battle_dict)
        _atomic_write_json(BATTLES_FILE, battles)


# --- Persistent battle thread tracking ---
def get_active_battle_threads():
    """Return a set of active battle thread IDs from local storage."""
    with _lock:
        data = _read_json(ACTIVE_BATTLES_FILE, [])
        # Normalize to strings for consistency
        return set(str(x) for x in data if x is not None)


def set_active_battle_threads(thread_ids):
    """Replace the list of active battle thread IDs in local storage."""
    with _lock:
        data = [str(t) for t in thread_ids]
        _atomic_write_json(ACTIVE_BATTLES_FILE, data)
