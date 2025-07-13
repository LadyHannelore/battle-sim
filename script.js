// Grand-Tactical Battle System
// Based on the README specifications

console.log('Battle Sim Script Loading...');

// Game state and configuration
let gameState = {
    board: [],
    terrain: [],
    structures: [],
    currentTurn: 1,
    currentPhase: 'initiative',
    activePlayer: 'white',
    weather: 'clear',
    selectedUnit: null,
    commanders: [],
    standingOrders: [],
    victoryConditions: {
        openField: { objectivesNeeded: 3, routThreshold: 0.5 },
        siege: { turnsToHold: 30, keepCaptured: false }
    },
    battleType: 'open-field',
    boardSize: 8
};

// Regiment catalogue with complete stats from README
const REGIMENT_CATALOGUE = {
    peasants: { atk: 4, def: 3, hp: 60, mv: 3, mor: 60, rng: 0, sta: 3, cost: 1, type: 'infantry' },
    lightFoot: { atk: 7, def: 5, hp: 50, mv: 4, mor: 70, rng: 0, sta: 4, cost: 2, type: 'infantry' },
    bowmen: { atk: 6, def: 3, hp: 40, mv: 4, mor: 65, rng: 5, sta: 3, cost: 2, type: 'ranged', ammo: 10 },
    pikemen: { atk: 8, def: 6, hp: 55, mv: 3, mor: 75, rng: 1, sta: 4, cost: 3, type: 'infantry', firstStrike: true },
    lightHorse: { atk: 8, def: 4, hp: 45, mv: 6, mor: 75, rng: 0, sta: 5, cost: 3, type: 'cavalry' },
    armoredFoot: { atk: 10, def: 9, hp: 70, mv: 2, mor: 80, rng: 0, sta: 5, cost: 4, type: 'infantry' },
    armoredHorse: { atk: 12, def: 7, hp: 60, mv: 5, mor: 85, rng: 0, sta: 6, cost: 5, type: 'cavalry' },
    catapult: { atk: 15, def: 1, hp: 30, mv: 2, mor: 50, rng: 8, sta: 2, cost: 4, type: 'siege', ammo: 5 },
    ballista: { atk: 12, def: 2, hp: 25, mv: 2, mor: 50, rng: 6, sta: 2, cost: 3, type: 'siege', ammo: 8 },
    batteringRam: { atk: 25, def: 2, hp: 40, mv: 2, mor: 60, rng: 1, sta: 2, cost: 3, type: 'siege' },
    siegeTower: { atk: 0, def: 5, hp: 80, mv: 2, mor: 70, rng: 0, sta: 3, cost: 5, type: 'siege' },
    commander: { atk: 8, def: 6, hp: 40, mv: 4, mor: 90, rng: 0, sta: 4, cost: 0, type: 'commander', leadership: 3, tactics: 3, logistics: 3 }
};

// Terrain effects
const TERRAIN_EFFECTS = {
    open: { mvCost: 1, defBonus: 0, missileModifier: 0 },
    forest: { mvCost: 2, defBonus: 2, missileModifier: -2 },
    hill: { mvCost: 2, defBonus: 3, missileModifier: 0 },
    marsh: { mvCost: 3, defBonus: 0, missileModifier: 0, cavalryPenalty: -1 },
    road: { mvCost: 0.5, defBonus: 0, missileModifier: 0 }
};

// Structure types
const STRUCTURES = {
    wall: { hp: 100, def: 6, blocks: true },
    palisade: { hp: 40, def: 4, blocks: true },
    gate: { hp: 60, def: 2, blocks: false, openable: true },
    ironGate: { hp: 100, def: 4, blocks: false, openable: true },
    keep: { hp: 200, def: 8, blocks: true, objective: true }
};

// Experience levels
const EXPERIENCE_LEVELS = {
    green: { atkBonus: 0, defBonus: 0, morBonus: 0, hpBonus: 0 },
    regular: { atkBonus: 1, defBonus: 1, morBonus: 10, hpBonus: 10 },
    veteran: { atkBonus: 2, defBonus: 2, morBonus: 20, hpBonus: 20 },
    elite: { atkBonus: 3, defBonus: 3, morBonus: 30, hpBonus: 30 },
    legendary: { atkBonus: 4, defBonus: 4, morBonus: 40, hpBonus: 40 }
};

// Formation types
const FORMATIONS = {
    line: { atkMod: 0, defMod: 0, mvMod: 0 },
    column: { atkMod: 0, defMod: -2, mvMod: 2 },
    phalanx: { atkMod: 0, defMod: 1.5, mvMod: -1, cavalryDefense: true },
    schiltron: { atkMod: 0, defMod: 2, mvMod: 0, immobile: true, cavalryDefense: true },
    wedge: { atkMod: 3, defMod: -2, mvMod: 0, chargeOnly: true },
    skirmish: { atkMod: 0, defMod: 0, mvMod: 1, missileResist: 0.3 },
    shieldwall: { atkMod: 0, defMod: 3, mvMod: -1, missileDefense: true },
    square: { atkMod: 0, defMod: 1, mvMod: -2, cavalryDefense: true }
};

// Weather effects
const WEATHER_EFFECTS = {
    clear: { missileRange: 0, movement: 0 },
    rain: { missileRange: -2, movement: 0 },
    snow: { missileRange: 0, movement: -1 },
    fog: { missileRange: -3, movement: 0, ambush: true }
};

// Unit creation function
function createUnit(type, color, row, col) {
    const stats = REGIMENT_CATALOGUE[type];
    if (!stats) return null;
    
    return {
        type: type,
        color: color,
        row: row,
        col: col,
        hp: stats.hp,
        maxHp: stats.hp,
        morale: stats.mor,
        maxMorale: stats.mor,
        stamina: stats.sta,
        maxStamina: stats.sta,
        formation: 'line',
        experience: 'regular',
        engaged: false,
        routed: false,
        ammo: stats.ammo || 0,
        maxAmmo: stats.ammo || 0,
        orders: null,
        status: []
    };
}

// Game board setup
function setupBoard() {
    gameState.board = [];
    gameState.terrain = [];
    gameState.structures = [];
    
    for (let r = 0; r < gameState.boardSize; r++) {
        gameState.board[r] = [];
        gameState.terrain[r] = [];
        gameState.structures[r] = [];
        for (let c = 0; c < gameState.boardSize; c++) {
            gameState.board[r][c] = null;
            gameState.terrain[r][c] = 'open';
            gameState.structures[r][c] = null;
        }
    }
    
    // Place initial units
    setupInitialUnits();
}

function setupInitialUnits() {
    // White army (bottom)
    const whiteUnits = [
        { pos: [7, 1], type: 'lightFoot' },
        { pos: [7, 2], type: 'bowmen' },
        { pos: [7, 3], type: 'commander' },
        { pos: [7, 4], type: 'pikemen' },
        { pos: [7, 5], type: 'bowmen' },
        { pos: [7, 6], type: 'lightFoot' },
        { pos: [6, 3], type: 'lightHorse' }
    ];
    
    // Black army (top)
    const blackUnits = [
        { pos: [0, 1], type: 'lightFoot' },
        { pos: [0, 2], type: 'bowmen' },
        { pos: [0, 3], type: 'commander' },
        { pos: [0, 4], type: 'pikemen' },
        { pos: [0, 5], type: 'bowmen' },
        { pos: [0, 6], type: 'lightFoot' },
        { pos: [1, 3], type: 'lightHorse' }
    ];
    
    // Place units
    whiteUnits.forEach(unit => {
        const [r, c] = unit.pos;
        gameState.board[r][c] = createUnit(unit.type, 'white', r, c);
    });
    
    blackUnits.forEach(unit => {
        const [r, c] = unit.pos;
        gameState.board[r][c] = createUnit(unit.type, 'black', r, c);
    });
}

// Board rendering
function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = r;
            square.dataset.col = c;
            
            // Add terrain class
            const terrain = gameState.terrain[r][c];
            if (terrain !== 'open') {
                square.classList.add(terrain);
            }
            
            // Add structure if present
            const structure = gameState.structures[r][c];
            if (structure) {
                square.classList.add('structure');
                square.setAttribute('data-structure', structure.type);
            }
            
            // Add unit if present
            const unit = gameState.board[r][c];
            if (unit) {
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${unit.color}`;
                unitElement.textContent = getUnitSymbol(unit.type);
                
                if (unit.routed) {
                    unitElement.classList.add('routed');
                }
                
                square.appendChild(unitElement);
            }
            
            board.appendChild(square);
        }
    }
}

// Unit symbol mapping
function getUnitSymbol(type) {
    const symbols = {
        peasants: '🔱',
        lightFoot: '🛡️',
        bowmen: '🏹',
        pikemen: '🗡️',
        lightHorse: '🐎',
        armoredFoot: '⚔️',
        armoredHorse: '🐴',
        catapult: '🏰',
        ballista: '🎯',
        batteringRam: '🔨',
        siegeTower: '🏛️',
        commander: '👑'
    };
    return symbols[type] || '?';
}

// Event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    try {
        const board = document.getElementById('board');
        if (board) {
            board.addEventListener('click', handleBoardClick);
            console.log('Board click listener added');
        } else {
            console.error('Board element not found');
        }
        
        // Control buttons
        const buttons = ['roll-initiative', 'end-turn', 'save-game', 'load-game', 'new-game', 'start-battle', 'random-setup'];
        buttons.forEach(buttonId => {
            const element = document.getElementById(buttonId);
            if (element) {
                console.log(`Found button: ${buttonId}`);
            } else {
                console.error(`Button not found: ${buttonId}`);
            }
        });
        
        // Add event listeners with error handling
        const rollBtn = document.getElementById('roll-initiative');
        if (rollBtn) rollBtn.addEventListener('click', rollInitiative);
        
        const endBtn = document.getElementById('end-turn');
        if (endBtn) endBtn.addEventListener('click', endTurn);
        
        const weatherBtn = document.getElementById('weather-control');
        if (weatherBtn) weatherBtn.addEventListener('click', checkWeather);
        
        const commandBtn = document.getElementById('command-phase');
        if (commandBtn) commandBtn.addEventListener('click', enterCommandPhase);
        
        const resupplyBtn = document.getElementById('resupply');
        if (resupplyBtn) resupplyBtn.addEventListener('click', resupplyUnits);
        
        const saveBtn = document.getElementById('save-game');
        if (saveBtn) saveBtn.addEventListener('click', saveGame);
        
        const loadBtn = document.getElementById('load-game');
        if (loadBtn) loadBtn.addEventListener('click', loadGame);
        
        const newBtn = document.getElementById('new-game');
        if (newBtn) newBtn.addEventListener('click', newGame);
        
        // Setup buttons
        const startBtn = document.getElementById('start-battle');
        if (startBtn) startBtn.addEventListener('click', startBattle);
        
        const randomBtn = document.getElementById('random-setup');
        if (randomBtn) randomBtn.addEventListener('click', randomizeSetup);
        
        // Setup page controls
        const boardSizeSelect = document.getElementById('board-size');
        if (boardSizeSelect) boardSizeSelect.addEventListener('change', handleBoardSizeChange);
        
        // Battle type radio buttons
        const battleTypeRadios = document.querySelectorAll('input[name="battle-type"]');
        battleTypeRadios.forEach(radio => {
            radio.addEventListener('change', handleBattleTypeChange);
        });
        
        console.log('Event listeners setup complete');
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
}

// Board click handler
function handleBoardClick(event) {
    const square = event.target.closest('.square');
    if (!square) return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    
    if (gameState.selectedUnit) {
        // Try to move or attack
        handleUnitAction(row, col);
    } else {
        // Select unit
        selectUnit(row, col);
    }
}

function selectUnit(row, col) {
    const unit = gameState.board[row][col];
    if (!unit || unit.color !== gameState.activePlayer) {
        gameState.selectedUnit = null;
        updateBoardDisplay();
        return;
    }
    
    gameState.selectedUnit = unit;
    updateBoardDisplay();
    updateUnitInfo();
}

function handleUnitAction(row, col) {
    const unit = gameState.selectedUnit;
    if (!unit) return;
    
    const validMoves = getValidMoves(unit);
    const validAttacks = getValidAttacks(unit);
    
    if (validMoves.some(pos => pos.row === row && pos.col === col)) {
        if (moveUnit(unit, row, col)) {
            gameState.selectedUnit = null;
            updateBoardDisplay();
        }
    } else if (validAttacks.some(pos => pos.row === row && pos.col === col)) {
        attackUnit(unit, row, col);
        gameState.selectedUnit = null;
        updateBoardDisplay();
    } else {
        // Invalid move - show notification
        if (gameState.board[row][col] !== null) {
            showNotification('Cannot move to occupied tile!', 'warning');
        } else {
            showNotification('Target is out of range!', 'warning');
        }
    }
}

// Movement system
function getValidMoves(unit) {
    const moves = [];
    const stats = REGIMENT_CATALOGUE[unit.type];
    const moveRange = stats.mv;
    
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            if (gameState.board[r][c] === null) {
                const distance = Math.abs(r - unit.row) + Math.abs(c - unit.col);
                if (distance <= moveRange) {
                    moves.push({ row: r, col: c });
                }
            }
        }
    }
    
    return moves;
}

function getValidAttacks(unit) {
    const attacks = [];
    const stats = REGIMENT_CATALOGUE[unit.type];
    const attackRange = stats.rng;
    
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const target = gameState.board[r][c];
            if (target && target.color !== unit.color) {
                const distance = Math.abs(r - unit.row) + Math.abs(c - unit.col);
                if (distance <= attackRange || (attackRange === 0 && distance <= 1)) {
                    attacks.push({ row: r, col: c });
                }
            }
        }
    }
    
    return attacks;
}

function moveUnit(unit, newRow, newCol) {
    // Check if target tile is occupied
    if (gameState.board[newRow][newCol] !== null) {
        showNotification('Cannot move - tile is occupied!', 'warning');
        return false;
    }
    
    // Check if movement is within unit's movement range
    const currentRow = unit.row;
    const currentCol = unit.col;
    const distance = Math.abs(newRow - currentRow) + Math.abs(newCol - currentCol);
    
    if (distance > unit.mv) {
        showNotification(`Cannot move - distance ${distance} exceeds movement range ${unit.mv}!`, 'warning');
        return false;
    }
    
    // Check if unit has enough stamina
    if (unit.stamina <= 0) {
        showNotification('Cannot move - unit is exhausted!', 'warning');
        return false;
    }
    
    // Perform the movement
    gameState.board[currentRow][currentCol] = null;
    unit.row = newRow;
    unit.col = newCol;
    gameState.board[newRow][newCol] = unit;
    
    // Reduce stamina
    unit.stamina = Math.max(0, unit.stamina - 1);
    
    renderBoard();
    updateUI();
    
    showNotification(`${unit.type} moved to ${newRow}, ${newCol}`, 'info');
    return true;
}

function attackUnit(attacker, targetRow, targetCol) {
    const target = gameState.board[targetRow][targetCol];
    if (!target) return;
    
    const damage = calculateDamage(attacker, target);
    target.hp -= damage;
    
    if (target.hp <= 0) {
        // Unit destroyed
        gameState.board[targetRow][targetCol] = null;
        showNotification(`${target.type} destroyed!`, 'success');
    } else {
        showNotification(`${target.type} takes ${damage} damage!`, 'warning');
    }
    
    // Reduce attacker's stamina
    attacker.stamina = Math.max(0, attacker.stamina - 1);
    
    // Use ammo if ranged
    if (attacker.ammo > 0) {
        attacker.ammo--;
    }
    
    renderBoard();
    updateUI();
}

function calculateDamage(attacker, target) {
    const attackerStats = REGIMENT_CATALOGUE[attacker.type];
    const targetStats = REGIMENT_CATALOGUE[target.type];
    
    let damage = attackerStats.atk - targetStats.def;
    
    // Apply terrain modifiers
    const terrain = gameState.terrain[target.row][target.col];
    if (TERRAIN_EFFECTS[terrain]) {
        damage -= TERRAIN_EFFECTS[terrain].defBonus;
    }
    
    // Apply formation modifiers
    const formation = FORMATIONS[target.formation];
    if (formation) {
        damage -= formation.defMod;
    }
    
    // Random factor
    damage += Math.floor(Math.random() * 6) - 3;
    
    return Math.max(1, damage);
}

// Turn management
function rollInitiative() {
    gameState.currentPhase = 'orders';
    gameState.currentTurn++;
    
    // Reset unit stamina
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const unit = gameState.board[r][c];
            if (unit) {
                unit.stamina = Math.min(unit.maxStamina, unit.stamina + 2);
            }
        }
    }
    
    updateUI();
    showNotification(`Turn ${gameState.currentTurn} - Initiative rolled!`, 'info');
}

function endTurn() {
    gameState.activePlayer = gameState.activePlayer === 'white' ? 'black' : 'white';
    gameState.currentPhase = 'movement';
    gameState.selectedUnit = null;
    
    updateUI();
    showNotification(`${gameState.activePlayer} player's turn`, 'info');
}

// UI updates
function updateUI() {
    document.getElementById('current-turn').textContent = gameState.currentTurn;
    document.getElementById('current-phase').textContent = gameState.currentPhase;
    document.getElementById('active-player').textContent = gameState.activePlayer;
    document.getElementById('weather').textContent = gameState.weather;
    
    updateBoardDisplay();
    updateUnitInfo();
}

function updateBoardDisplay() {
    // Clear all highlights
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('valid-move', 'valid-attack', 'selected-unit');
    });
    
    if (gameState.selectedUnit) {
        // Highlight selected unit
        const selectedSquare = document.querySelector(`[data-row="${gameState.selectedUnit.row}"][data-col="${gameState.selectedUnit.col}"]`);
        if (selectedSquare) {
            selectedSquare.classList.add('selected-unit');
        }
        
        // Highlight valid moves (empty tiles only)
        const validMoves = getValidMoves(gameState.selectedUnit);
        validMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (square) {
                square.classList.add('valid-move');
            }
        });
        
        // Highlight valid attacks (occupied by enemies)
        const validAttacks = getValidAttacks(gameState.selectedUnit);
        validAttacks.forEach(attack => {
            const square = document.querySelector(`[data-row="${attack.row}"][data-col="${attack.col}"]`);
            if (square) {
                square.classList.add('valid-attack');
            }
        });
    }
}

function updateUnitInfo() {
    const unitInfo = document.getElementById('unit-info');
    const unit = gameState.selectedUnit;
    
    if (unit) {
        const stats = REGIMENT_CATALOGUE[unit.type];
        unitInfo.innerHTML = `
            <h3>${unit.type} (${unit.color})</h3>
            <div class="stat-bars">
                <div class="stat-bar">
                    <span>HP:</span>
                    <div class="bar">
                        <div class="fill hp-fill" style="width: ${(unit.hp / unit.maxHp) * 100}%"></div>
                    </div>
                    <span>${unit.hp}/${unit.maxHp}</span>
                </div>
                <div class="stat-bar">
                    <span>Morale:</span>
                    <div class="bar">
                        <div class="fill morale-fill" style="width: ${(unit.morale / unit.maxMorale) * 100}%"></div>
                    </div>
                    <span>${unit.morale}/${unit.maxMorale}</span>
                </div>
                <div class="stat-bar">
                    <span>Stamina:</span>
                    <div class="bar">
                        <div class="fill stamina-fill" style="width: ${(unit.stamina / unit.maxStamina) * 100}%"></div>
                    </div>
                    <span>${unit.stamina}/${unit.maxStamina}</span>
                </div>
            </div>
            <div class="unit-stats">
                <p>Attack: ${stats.atk}</p>
                <p>Defense: ${stats.def}</p>
                <p>Movement: ${stats.mv}</p>
                <p>Range: ${stats.rng}</p>
                ${unit.ammo > 0 ? `<p>Ammo: ${unit.ammo}/${unit.maxAmmo}</p>` : ''}
            </div>
        `;
    } else {
        unitInfo.innerHTML = '<p>Select a unit to view its information</p>';
    }
}

// Save/Load system
function saveGame() {
    const saveData = {
        gameState: gameState,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('battle-sim-save', JSON.stringify(saveData));
    showNotification('Game saved!', 'success');
}

function loadGame() {
    const saveData = localStorage.getItem('battle-sim-save');
    if (saveData) {
        const data = JSON.parse(saveData);
        gameState = data.gameState;
        renderBoard();
        updateUI();
        showNotification('Game loaded!', 'success');
    } else {
        showNotification('No saved game found!', 'error');
    }
}

function newGame() {
    if (confirm('Start a new game? This will reset the current battle.')) {
        setupBoard();
        gameState.currentTurn = 1;
        gameState.currentPhase = 'initiative';
        gameState.activePlayer = 'white';
        gameState.selectedUnit = null;
        renderBoard();
        updateUI();
        showNotification('New game started!', 'success');
    }
}

// Setup functions
function randomizeSetup() {
    // Randomize board size
    const sizes = [8, 16, 30];
    const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
    document.getElementById('board-size').value = randomSize;
    
    // Randomize battle type
    const battleTypes = ['open-field', 'siege'];
    const randomType = battleTypes[Math.floor(Math.random() * battleTypes.length)];
    document.querySelector(`input[name="battle-type"][value="${randomType}"]`).checked = true;
    
    showNotification(`Random setup: ${randomType === 'siege' ? 'Siege' : 'Open Field'} battle on ${randomSize}x${randomSize} board`, 'info');
}

function startBattle() {
    // Get selected battle type
    const battleType = document.querySelector('input[name="battle-type"]:checked').value;
    const boardSize = parseInt(document.getElementById('board-size').value);
    
    gameState.battleType = battleType;
    gameState.boardSize = boardSize;
    gameState.currentTurn = 1;
    gameState.currentPhase = 'initiative';
    gameState.activePlayer = 'white';
    gameState.selectedUnit = null;
    
    // Setup board with selected configuration
    setupBoard();
    
    // Deploy armies based on composition
    deployArmies();
    
    // Add terrain based on battle type
    if (battleType === 'siege') {
        setupSiegeTerrain();
    } else {
        setupRandomTerrain();
    }
    
    renderBoard();
    updateUI();
    
    // Switch to game tab
    document.querySelector('[data-tab="game"]').click();
    
    showNotification(`${battleType === 'siege' ? 'Siege' : 'Open field'} battle begins! Board size: ${boardSize}x${boardSize}`, 'success');
}

function handleBoardSizeChange(event) {
    const newSize = parseInt(event.target.value);
    showNotification(`Board size set to ${newSize}x${newSize}`, 'info');
}

function handleBattleTypeChange(event) {
    const battleType = event.target.value;
    showNotification(`Battle type set to ${battleType === 'siege' ? 'Siege' : 'Open Field'}`, 'info');
}

function setupSiegeTerrain() {
    // Clear terrain first
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            gameState.terrain[r][c] = 'open';
            gameState.structures[r][c] = null;
        }
    }
    
    const center = Math.floor(gameState.boardSize / 2);
    
    // Create fortress walls in center
    for (let r = center - 2; r <= center + 2; r++) {
        for (let c = center - 2; c <= center + 2; c++) {
            if (r >= 0 && r < gameState.boardSize && c >= 0 && c < gameState.boardSize) {
                // Outer wall
                if (r === center - 2 || r === center + 2 || c === center - 2 || c === center + 2) {
                    gameState.structures[r][c] = { type: 'wall', hp: 100, maxHp: 100 };
                }
                // Keep in center
                if (r === center && c === center) {
                    gameState.structures[r][c] = { type: 'keep', hp: 200, maxHp: 200 };
                }
            }
        }
    }
    
    // Add gate
    if (center + 2 < gameState.boardSize) {
        gameState.structures[center][center + 2] = { type: 'gate', hp: 60, maxHp: 60, open: false };
    }
}

function setupRandomTerrain() {
    // Random terrain placement for open field battles
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const random = Math.random();
            if (random < 0.1) {
                gameState.terrain[r][c] = 'forest';
            } else if (random < 0.15) {
                gameState.terrain[r][c] = 'hill';
            } else if (random < 0.2) {
                gameState.terrain[r][c] = 'marsh';
            } else {
                gameState.terrain[r][c] = 'open';
            }
            gameState.structures[r][c] = null;
        }
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Enhanced features
function initializeEnhancedFeatures() {
    // Weather system
    const weatherBtn = document.getElementById('weather-control');
    if (weatherBtn) {
        weatherBtn.addEventListener('click', () => {
            const weathers = ['clear', 'rain', 'snow', 'fog'];
            const currentIndex = weathers.indexOf(gameState.weather);
            gameState.weather = weathers[(currentIndex + 1) % weathers.length];
            updateUI();
            showNotification(`Weather changed to ${gameState.weather}`, 'info');
        });
    }
    
    // Formation controls
    const formationSelect = document.getElementById('formation-select');
    if (formationSelect) {
        formationSelect.addEventListener('change', (e) => {
            if (gameState.selectedUnit) {
                gameState.selectedUnit.formation = e.target.value;
                updateUnitInfo();
                showNotification(`Formation changed to ${e.target.value}`, 'info');
            }
        });
    }
    
    // Board size controls
    const boardSizeBtn = document.getElementById('board-size');
    if (boardSizeBtn) {
        boardSizeBtn.addEventListener('click', () => {
            const sizes = [6, 8, 10, 12];
            const currentIndex = sizes.indexOf(gameState.boardSize);
            gameState.boardSize = sizes[(currentIndex + 1) % sizes.length];
            setupBoard();
            renderBoard();
            updateUI();
            showNotification(`Board size changed to ${gameState.boardSize}x${gameState.boardSize}`, 'info');
        });
    }
}

// Tab system
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab
            btn.classList.add('active');
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Enhanced Tutorial System
function setupTutorialNavigation() {
    const tutorialNavBtns = document.querySelectorAll('.tutorial-nav-btn');
    const tutorialSections = document.querySelectorAll('.tutorial-section');
    
    tutorialNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            // Remove active class from all buttons and sections
            tutorialNavBtns.forEach(b => b.classList.remove('active'));
            tutorialSections.forEach(section => section.classList.remove('active'));
            
            // Add active class to clicked button and corresponding section
            btn.classList.add('active');
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

function setupTutorialActions() {
    const startInteractiveTutorial = document.getElementById('start-interactive-tutorial');
    const practiceBattle = document.getElementById('practice-battle');
    
    if (startInteractiveTutorial) {
        startInteractiveTutorial.addEventListener('click', () => {
            // Switch to game tab and start interactive tutorial
            document.querySelector('[data-tab="game"]').click();
            setTimeout(() => {
                startInteractiveTutorialMode();
            }, 100);
        });
    }
    
    if (practiceBattle) {
        practiceBattle.addEventListener('click', () => {
            // Switch to game tab and start practice battle
            document.querySelector('[data-tab="game"]').click();
            setTimeout(() => {
                startPracticeBattle();
            }, 100);
        });
    }
}

function startInteractiveTutorialMode() {
    // Reset game state for tutorial
    gameState.boardSize = 8;
    setupBoard();
    
    // Start the guided tutorial
    const tutorialSteps = [
        {
            title: "Welcome to the Interactive Tutorial!",
            content: "Let's learn how to play step by step. First, let's look at the game board.",
            action: () => {}
        },
        {
            title: "Your Army",
            content: "These are your units (white pieces). Each unit has different abilities. Click on the Light Foot unit (🛡️) at the bottom row.",
            action: () => {
                const lightFootUnit = findUnitByType('lightFoot', 'white');
                if (lightFootUnit) {
                    const square = document.querySelector(`.square[data-row="${lightFootUnit.row}"][data-col="${lightFootUnit.col}"]`);
                    if (square) {
                        square.classList.add('tutorial-highlight');
                    }
                }
            }
        },
        {
            title: "Unit Selection",
            content: "Great! You've selected a unit. Notice the green outline showing it's selected, and the yellow squares showing where it can move.",
            action: () => {}
        },
        {
            title: "Movement",
            content: "Click on any yellow square to move your unit there. Try moving the unit forward.",
            action: () => {}
        },
        {
            title: "Tutorial Complete!",
            content: "Congratulations! You've learned the basics. Continue playing to master advanced tactics.",
            action: () => {
                document.querySelectorAll('.tutorial-highlight').forEach(el => {
                    el.classList.remove('tutorial-highlight');
                });
            }
        }
    ];
    
    startGuidedTutorial(tutorialSteps);
}

function startPracticeBattle() {
    // Set up a balanced practice battle
    gameState.boardSize = 8;
    setupBoard();
    
    // Add some strategic terrain
    gameState.terrain[3][3] = 'hill';
    gameState.terrain[3][4] = 'hill';
    gameState.terrain[1][1] = 'forest';
    gameState.terrain[1][2] = 'forest';
    gameState.terrain[6][6] = 'marsh';
    
    // Set up balanced armies
    setupPracticeArmies();
    renderBoard();
    updateUI();
    
    showNotification('Practice battle ready! Try different tactics and strategies.', 'success');
}

function setupPracticeArmies() {
    // Clear existing units
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            gameState.board[r][c] = null;
        }
    }
    
    // White army (player)
    const whiteUnits = [
        { pos: [7, 2], type: 'lightFoot' },
        { pos: [7, 3], type: 'bowmen' },
        { pos: [7, 4], type: 'commander' },
        { pos: [7, 5], type: 'bowmen' },
        { pos: [7, 6], type: 'lightFoot' },
        { pos: [6, 3], type: 'pikemen' },
        { pos: [6, 5], type: 'lightHorse' }
    ];
    
    // Black army (opponent)
    const blackUnits = [
        { pos: [0, 2], type: 'lightFoot' },
        { pos: [0, 3], type: 'bowmen' },
        { pos: [0, 4], type: 'commander' },
        { pos: [0, 5], type: 'bowmen' },
        { pos: [0, 6], type: 'lightFoot' },
        { pos: [1, 3], type: 'pikemen' },
        { pos: [1, 5], type: 'lightHorse' }
    ];
    
    // Place units
    whiteUnits.forEach(unit => {
        const [r, c] = unit.pos;
        gameState.board[r][c] = createUnit(unit.type, 'white', r, c);
    });
    
    blackUnits.forEach(unit => {
        const [r, c] = unit.pos;
        gameState.board[r][c] = createUnit(unit.type, 'black', r, c);
    });
}

function findUnitByType(type, color) {
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const unit = gameState.board[r][c];
            if (unit && unit.type === type && unit.color === color) {
                return unit;
            }
        }
    }
    return null;
}

function startGuidedTutorial(steps) {
    let currentStep = 0;
    
    function showStep(stepIndex) {
        if (stepIndex >= steps.length) {
            showNotification('Tutorial completed! You\'re ready to command your army.', 'success');
            return;
        }
        
        const step = steps[stepIndex];
        step.action();
        
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-popup">
                <div class="tutorial-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${((stepIndex + 1) / steps.length) * 100}%"></div>
                    </div>
                    <span class="progress-text">${stepIndex + 1} / ${steps.length}</span>
                </div>
                <h3>${step.title}</h3>
                <p>${step.content}</p>
                <div class="tutorial-buttons">
                    ${stepIndex > 0 ? '<button onclick="previousStep()" class="btn secondary">Previous</button>' : ''}
                    <button onclick="nextStep()" class="btn primary">${stepIndex === steps.length - 1 ? 'Finish' : 'Next'}</button>
                    <button onclick="this.closest(\'.tutorial-overlay\').remove()" class="btn secondary">Skip Tutorial</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Store functions globally for button access
        window.nextStep = function() {
            overlay.remove();
            currentStep++;
            showStep(currentStep);
        };
        
        window.previousStep = function() {
            overlay.remove();
            currentStep--;
            showStep(currentStep);
        };
    }
    
    showStep(0);
}

// Add tutorial highlight styles
const tutorialHighlightStyles = document.createElement('style');
tutorialHighlightStyles.textContent = `
    .tutorial-highlight {
        animation: tutorialPulse 2s ease-in-out infinite;
        box-shadow: 0 0 20px var(--gold-color) !important;
        z-index: 100;
        position: relative;
    }
    
    @keyframes tutorialPulse {
        0%, 100% { 
            box-shadow: 0 0 20px var(--gold-color) !important;
            transform: scale(1);
        }
        50% { 
            box-shadow: 0 0 30px var(--gold-color) !important;
            transform: scale(1.05);
        }
    }
    
    .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .tutorial-popup {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
    
    .tutorial-progress {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .progress-bar {
        flex: 1;
        height: 8px;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
        overflow: hidden;
    }
    
    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #d4af37, #b8860b);
        transition: width 0.3s ease;
    }
    
    .progress-text {
        font-size: 0.9rem;
        color: #666;
        min-width: 40px;
    }
    
    .tutorial-buttons {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    
    .tutorial-buttons button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: all 0.2s ease;
    }
    
    .tutorial-buttons .btn.primary {
        background: #b8860b;
        color: white;
    }
    
    .tutorial-buttons .btn.secondary {
        background: #f0f0f0;
        color: #666;
    }
    
    .tutorial-buttons button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
    }
`;
document.head.appendChild(tutorialHighlightStyles);

// Army composition management
let playerArmies = {
    player1: {},
    player2: {}
};

function setupArmyBuilder() {
    const player1Container = document.getElementById('player1-units');
    const player2Container = document.getElementById('player2-units');
    
    if (!player1Container || !player2Container) {
        console.log('Army builder containers not found');
        return;
    }
    
    // Create unit selection interface for both players
    [
        { container: player1Container, player: 'player1' },
        { container: player2Container, player: 'player2' }
    ].forEach(({ container, player }) => {
        container.innerHTML = '';
        
        // Create unit selection grid
        Object.entries(REGIMENT_CATALOGUE).forEach(([unitType, stats]) => {
            const unitCard = document.createElement('div');
            unitCard.className = 'unit-card';
            
            const unitName = unitType.charAt(0).toUpperCase() + unitType.slice(1).replace(/([A-Z])/g, ' $1');
            
            unitCard.innerHTML = `
                <div class="unit-info">
                    <h5>${unitName}</h5>
                    <div class="unit-stats">
                        <span>ATK: ${stats.atk}</span>
                        <span>DEF: ${stats.def}</span>
                        <span>HP: ${stats.hp}</span>
                        <span>Cost: ${stats.cost}</span>
                    </div>
                </div>
                <div class="unit-controls">
                    <button class="unit-btn decrease" onclick="adjustUnitCount('${player}', '${unitType}', -1)">-</button>
                    <span class="unit-count" id="${player}-${unitType}-count">0</span>
                    <button class="unit-btn increase" onclick="adjustUnitCount('${player}', '${unitType}', 1)">+</button>
                </div>
            `;
            
            container.appendChild(unitCard);
        });
        
        // Add total cost display
        const totalCostDiv = document.createElement('div');
        totalCostDiv.className = 'army-total';
        totalCostDiv.innerHTML = `
            <h4>Total Army Cost: <span id="${player}-total-cost">0</span></h4>
        `;
        container.appendChild(totalCostDiv);
    });
    
    // Initialize army counts
    playerArmies.player1 = {};
    playerArmies.player2 = {};
    Object.keys(REGIMENT_CATALOGUE).forEach(unitType => {
        playerArmies.player1[unitType] = 0;
        playerArmies.player2[unitType] = 0;
    });
}

function adjustUnitCount(player, unitType, change) {
    const currentCount = playerArmies[player][unitType] || 0;
    const newCount = Math.max(0, currentCount + change);
    
    playerArmies[player][unitType] = newCount;
    
    // Update display
    const countElement = document.getElementById(`${player}-${unitType}-count`);
    if (countElement) {
        countElement.textContent = newCount;
    }
    
    // Update total cost
    updateArmyCost(player);
}

function updateArmyCost(player) {
    let totalCost = 0;
    Object.entries(playerArmies[player]).forEach(([unitType, count]) => {
        const unitStats = REGIMENT_CATALOGUE[unitType];
        if (unitStats) {
            totalCost += count * unitStats.cost;
        }
    });
    
    const costElement = document.getElementById(`${player}-total-cost`);
    if (costElement) {
        costElement.textContent = totalCost;
    }
}

function getPlayerArmy(player) {
    return Object.entries(playerArmies[player])
        .filter(([unitType, count]) => count > 0)
        .map(([unitType, count]) => ({ unitType, count }));
}

// Initialize game
function initializeGame() {
    setupTabs();
    setupBoard();
    setupEventListeners();
    setupTutorialNavigation();
    setupTutorialActions();
    initializeEnhancedFeatures();
    setupArmyBuilder();
    updateUI();
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Game...');
    initializeGame();
});

function deployArmies() {
    // Clear the board first
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            gameState.board[r][c] = null;
        }
    }
    
    // Deploy Player 1 (White) army
    deployPlayerArmy('player1', 'white', 0, 2); // Bottom rows
    
    // Deploy Player 2 (Black) army  
    deployPlayerArmy('player2', 'black', gameState.boardSize - 2, gameState.boardSize); // Top rows
    
    showNotification('Armies deployed! Battle is ready to begin.', 'success');
}

function deployPlayerArmy(player, color, startRow, endRow) {
    const army = getPlayerArmy(player);
    let currentRow = startRow;
    let currentCol = 0;
    
    army.forEach(({ unitType, count }) => {
        for (let i = 0; i < count; i++) {
            if (currentRow >= endRow) {
                console.warn(`Not enough space to deploy all ${player} units`);
                return;
            }
            
            // Check if position is already occupied
            if (gameState.board[currentRow][currentCol] !== null) {
                // Find next available position
                let foundPosition = false;
                for (let r = startRow; r < endRow && !foundPosition; r++) {
                    for (let c = 0; c < gameState.boardSize && !foundPosition; c++) {
                        if (gameState.board[r][c] === null) {
                            currentRow = r;
                            currentCol = c;
                            foundPosition = true;
                        }
                    }
                }
                
                if (!foundPosition) {
                    console.warn(`No available space to deploy ${player} ${unitType}`);
                    return;
                }
            }
            
            const unitStats = { ...REGIMENT_CATALOGUE[unitType] };
            const unit = {
                type: unitType,
                color: color,
                row: currentRow,
                col: currentCol,
                ...unitStats,
                maxStamina: unitStats.sta,
                stamina: unitStats.sta,
                currentHp: unitStats.hp,
                formation: 'line',
                id: `${player}-${unitType}-${i}`
            };
            
            // Place unit on board
            gameState.board[currentRow][currentCol] = unit;
            
            // Move to next position
            currentCol++;
            if (currentCol >= gameState.boardSize) {
                currentCol = 0;
                currentRow++;
            }
        }
    });
}

// Weather control function
function checkWeather() {
    const weatherTypes = ['clear', 'overcast', 'rain', 'storm', 'fog', 'snow'];
    const currentWeather = gameState.weather;
    
    // Roll for weather change
    const roll = Math.floor(Math.random() * 6) + 1;
    let newWeather = currentWeather;
    
    if (roll <= 2) {
        // Weather changes
        newWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    }
    
    gameState.weather = newWeather;
    updateUI();
    
    if (newWeather !== currentWeather) {
        showNotification(`Weather changed to ${newWeather}!`, 'info');
    } else {
        showNotification(`Weather remains ${currentWeather}`, 'info');
    }
}

function enterCommandPhase() {
    if (gameState.currentPhase === 'initiative') {
        gameState.currentPhase = 'orders';
        showNotification('Entering command phase - Issue orders to your units', 'info');
    } else if (gameState.currentPhase === 'orders') {
        gameState.currentPhase = 'movement';
        showNotification('Orders phase complete - Movement phase begins', 'info');
    } else if (gameState.currentPhase === 'movement') {
        gameState.currentPhase = 'combat';
        showNotification('Movement complete - Combat phase begins', 'info');
    } else {
        showNotification('Complete current phase first', 'warning');
    }
    updateUI();
}

function resupplyUnits() {
    let resuppliedCount = 0;
    
    for (let r = 0; r < gameState.boardSize; r++) {
        for (let c = 0; c < gameState.boardSize; c++) {
            const unit = gameState.board[r][c];
            if (unit && unit.color === gameState.activePlayer) {
                // Restore stamina
                if (unit.stamina < unit.maxStamina) {
                    unit.stamina = Math.min(unit.maxStamina, unit.stamina + 3);
                    resuppliedCount++;
                }
                
                // Restore ammunition if ranged unit
                if (unit.type === 'bowmen' || unit.type === 'catapult' || unit.type === 'ballista') {
                    const maxAmmo = REGIMENT_CATALOGUE[unit.type].ammo;
                    if (unit.ammo < maxAmmo) {
                        unit.ammo = maxAmmo;
                        resuppliedCount++;
                    }
                }
                
                // Restore some HP
                if (unit.currentHp < unit.hp) {
                    unit.currentHp = Math.min(unit.hp, unit.currentHp + 10);
                    resuppliedCount++;
                }
            }
        }
    }
    
    if (resuppliedCount > 0) {
        showNotification(`Resupplied ${resuppliedCount} units`, 'success');
    } else {
        showNotification('No units need resupply', 'info');
    }
    updateUI();
}