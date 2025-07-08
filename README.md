# Battle Simulator

Python-based turn-based battle and siege simulator.

## Setup
```powershell
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
# generate placeholder assets:
python src/assets/generate_tiles.py
python src/assets/generate_sprites.py
```

## Running
```powershell
python -m src.main
```

## Project Structure
```
battle-sim/
├── src/
│   ├── __init__.py
│   ├── main.py
   │   ├── renderer.py
│   ├── engine.py
│   ├── models/
│   ├── objects/
│   ├── utils.py
│   └── assets/       # sprites and tiles
├── data/
├── tests/
└── requirements.txt
```

