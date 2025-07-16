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
        return sh.worksheet(name)
    except gspread.WorksheetNotFound:
        return sh.add_worksheet(title=name, rows=100, cols=20)

# Sync an army to the sheet
# army_dict: {id, owner, units: [{type, count}, ...]}
def sync_army(army_dict):
    ws = get_worksheet("Armies")
    # Find by army id and owner, update or append
    all_records = ws.get_all_records()
    row_idx = None
    for idx, rec in enumerate(all_records, start=2):
        if rec.get("ArmyID") == army_dict["id"] and rec.get("OwnerID") == army_dict["owner"]:
            row_idx = idx
            break
    units_str = ", ".join(f"{u['count']} {u['type']}" for u in army_dict["units"])
    row = [army_dict["id"], army_dict["owner"], units_str]
    if row_idx:
        ws.update(f"A{row_idx}:C{row_idx}", [row])
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
