import gspread
from google.oauth2.service_account import Credentials
import os

# Set up the Google Sheets client
SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "service_account.json")
SPREADSHEET_ID = os.getenv("GOOGLE_SHEET_ID", "1TvzJfyjPKm62EF8_rNvM8stnwpYYvPvgptbGmY0gVMM")

creds = Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)
gc = gspread.authorize(creds)

# Get worksheet by name or create if not exists
def get_worksheet(name):
    sh = gc.open_by_key(SPREADSHEET_ID)
    try:
        ws = sh.worksheet(name)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(title=name, rows=100, cols=20)
    # Ensure header row exists for known sheets
    if name == "Armies":
        headers = ["ArmyID", "OwnerID", "Units"]
        values = ws.get_all_values()
        if not values or values[0] != headers:
            ws.insert_row(headers, 1)
    elif name == "Battles":
        headers = ["BattleID", "Aggressor", "Defender", "Winner", "Armies", "Log"]
        values = ws.get_all_values()
        if not values or values[0] != headers:
            ws.insert_row(headers, 1)
    return ws

# Sync an army to the sheet
# army_dict: {id, owner, units: [{type, count}, ...]}
def sync_army(army_dict):
    ws = get_worksheet("Armies")
    # Find by army id and owner, update or append
    all_records = ws.get_all_records()
    row_idx = None
    for idx, rec in enumerate(all_records, start=2):
        if str(rec.get("ArmyID")) == str(army_dict["id"]) and str(rec.get("OwnerID")) == str(army_dict["owner"]):
            row_idx = idx
            break
    units_str = ", ".join(f"{u['count']} {u['type']}" for u in army_dict["units"])
    row = [army_dict["id"], army_dict["owner"], units_str]
    if row_idx:
        # Update the entire row starting at column A
        ws.update(f"A{row_idx}", [row])  # type: ignore
    else:
        ws.append_row(row)

# Sync a battle result to the sheet
def sync_battle(battle_dict):
    ws = get_worksheet("Battles")
    # battle_dict: {id, aggressor, defender, winner, armies, log}
    armies_str = "; ".join(
        f"{a['owner']}:{', '.join(str(u['count']) + ' ' + str(u['type']) for u in a['units'])}"
        for a in battle_dict["armies"]
    )
    log_str = " | ".join(e.get("message", "") for e in battle_dict.get("log", []))
    row = [battle_dict.get("id", ""), battle_dict.get("aggressor", ""), battle_dict.get("defender", ""), battle_dict.get("winner", ""), armies_str, log_str]
    ws.append_row(row)

# --- Persistent battle thread tracking ---
def get_active_battle_threads():
    """Return a set of active battle thread IDs from the 'ActiveBattles' worksheet."""
    ws = get_worksheet("ActiveBattles")
    values = ws.get_all_values()
    if not values or values[0] != ["ThreadID"]:
        ws.insert_row(["ThreadID"], 1)
        return set()
    return set(row[0] for row in values[1:] if row)

def set_active_battle_threads(thread_ids):
    """Replace the list of active battle thread IDs in the 'ActiveBattles' worksheet."""
    ws = get_worksheet("ActiveBattles")
    ws.clear()
    ws.append_row(["ThreadID"])
    for tid in thread_ids:
        ws.append_row([str(tid)])
