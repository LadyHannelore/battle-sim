// Game State Management
class GameState {
    constructor() {
        this.currentPage = 'home';
        this.warActive = false;
        this.selectedCasus = null;
        this.warObjective = '';
        this.currentTurn = 1;
        this.maxTurns = 6; // Default, varies by casus belli
        this.warWeariness = false;
        this.supplyLineIssues = false;
        this.customArmies = {
            red: [],
            blue: []
        };
        this.armyLimits = {
            maxUnits: 12,
            minUnits: 4,
            requiredCommanders: 1
        };
        this.warCosts = {
            diplomaticFavor: 1,
            armyCreation: 1, // Labor cost
            maintenance: 1   // Food cost per army after turn 3
        };
        this.currentTurn = 1;
        this.currentPhase = 'placement'; // placement, battle, rally
        this.currentPlayer = 'red'; // red (aggressor), blue (defender)
        this.selectedUnit = null;
        this.selectedCell = null;
        this.selectedAction = null;
        this.battlefield = Array(9).fill().map(() => Array(9).fill(null));
        this.redArmy = [];
        this.blueArmy = [];
        this.battleLog = [];
        this.placementPhaseComplete = { red: false, blue: false };
    }

    reset() {
        this.currentTurn = 1;
        this.currentPhase = 'placement';
        this.currentPlayer = 'red';
        this.selectedUnit = null;
        this.selectedCell = null;
        this.selectedAction = null;
        this.battlefield = Array(9).fill().map(() => Array(9).fill(null));
        this.redArmy = [];
        this.blueArmy = [];
        this.battleLog = [];
        this.placementPhaseComplete = { red: false, blue: false };
        this.initializeArmies();
    }

    initializeArmies() {
        // Use custom armies if available, otherwise use default
        if (this.customArmies.red.length > 0 && this.customArmies.blue.length > 0) {
            this.redArmy = [...this.customArmies.red];
            this.blueArmy = [...this.customArmies.blue];
        } else {
            // Default army composition for demo
            this.redArmy = [
                ...Array(3).fill().map((_, i) => new Unit('infantry', 'red', `red-inf-${i}`)),
                new Unit('commander', 'red', 'red-cmd-1'),
                new Unit('shock', 'red', 'red-shock-1'),
                new Unit('archer', 'red', 'red-archer-1'),
                new Unit('cavalry', 'red', 'red-cavalry-1'),
                new Unit('chariot', 'red', 'red-chariot-1')
            ];
            
            this.blueArmy = [
                ...Array(3).fill().map((_, i) => new Unit('infantry', 'blue', `blue-inf-${i}`)),
                new Unit('commander', 'blue', 'blue-cmd-1'),
                new Unit('shock', 'blue', 'blue-shock-1'),
                new Unit('archer', 'blue', 'blue-archer-1'),
                new Unit('cavalry', 'blue', 'blue-cavalry-1'),
                new Unit('chariot', 'blue', 'blue-chariot-1')
            ];
        }
    }

    addLogMessage(message, type = 'info') {
        this.battleLog.push({ message, type, timestamp: Date.now() });
        updateBattleLog();
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'blue' : 'red';
        updateUI();
    }

    nextPhase() {
        if (this.currentPhase === 'placement') {
            this.currentPhase = 'battle';
            this.currentPlayer = 'red'; // Red always goes first in battle
        } else if (this.currentPhase === 'battle') {
            this.currentPhase = 'rally';
        } else if (this.currentPhase === 'rally') {
            this.currentTurn++;
            this.currentPhase = 'battle';
            this.currentPlayer = 'red';
        }
        updateUI();
    }
}

// Unit Class
class Unit {
    constructor(type, team, id) {
        this.type = type;
        this.team = team;
        this.id = id;
        this.x = null;
        this.y = null;
        this.direction = 'north'; // north, south, east, west
        this.injured = false;
        this.hasMoved = false;
        this.hasActed = false;
        
        // Set unit properties based on type
        this.setUnitProperties();
    }

    setUnitProperties() {
        const properties = {
            infantry: {
                icon: '🛡️',
                attack: 1,
                defense: 0,
                movement: 1,
                attackRange: 1,
                canAttackDiagonal: false,
                cost: 'Base'
            },
            shock: {
                icon: '⚡',
                attack: 1,
                defense: 'immune',
                movement: 1,
                attackRange: 1,
                canAttackDiagonal: false,
                immuneToSingle: ['infantry', 'commander'],
                vulnerableTo: ['cavalry-flanking', 'archer'],
                cost: '1 Bronze'
            },
            archer: {
                icon: '🏹',
                attack: 1,
                defense: 0,
                movement: 1,
                attackRange: 2,
                canAttackDiagonal: true,
                causesInjury: false,
                mustBeStationary: true,
                cost: '1 Timber'
            },
            commander: {
                icon: '👑',
                attack: 1,
                defense: 'immune',
                movement: 1,
                attackRange: 1,
                canAttackDiagonal: false,
                immuneToSingle: ['infantry', 'cavalry'],
                immuneToInjury: true,
                deathPenalty: 'movement-1',
                cost: 'Auto-included'
            },
            cavalry: {
                icon: '🐎',
                attack: 1,
                defense: 0,
                movement: 3,
                attackRange: 1,
                canAttackDiagonal: false,
                flankingBonus: ['shock'],
                cost: '1 Mount'
            },
            'light-chariot': {
                icon: '🛡️',
                attack: 1,
                defense: 'immune-front',
                movement: 3,
                attackRange: 1,
                canAttackDiagonal: false,
                vulnerableToSideRear: true,
                requiresRider: true,
                cost: '1 Mount'
            },
            'heavy-chariot': {
                icon: '🏛️',
                attack: 1,
                defense: 'takes-3-hits',
                movement: 2,
                attackRange: 1,
                canAttackDiagonal: false,
                requiresRider: true,
                hitPoints: 3,
                cost: '1 Mount'
            },
            scout: {
                icon: '👁️',
                attack: 0,
                defense: 'untouchable',
                movement: 5,
                attackRange: 0,
                canAttackDiagonal: false,
                cannotAttack: true,
                cannotBeAttacked: true,
                revealsEnemies: true,
                cost: '1 free per army'
            }
        };

        const props = properties[this.type];
        Object.assign(this, props);
        
        // Initialize hit points for heavy chariots
        if (this.type === 'heavy-chariot') {
            this.currentHitPoints = this.hitPoints;
        }
    }

    getIcon() {
        return this.icon;
    }

    canMoveTo(x, y) {
        if (this.hasMoved) return false;
        
        const dx = Math.abs(x - this.x);
        const dy = Math.abs(y - this.y);
        
        if (this.cardinalOnly) {
            return (dx === 0 || dy === 0) && (dx + dy <= this.movement);
        }
        
        return Math.max(dx, dy) <= this.movement;
    }

    canAttack(targetX, targetY) {
        if (this.hasActed || this.cannotAttack) return false;
        
        // Archers must be stationary to fire
        if (this.type === 'archer' && this.hasMoved) return false;
        
        const dx = Math.abs(targetX - this.x);
        const dy = Math.abs(targetY - this.y);
        
        if (this.type === 'archer') {
            return dx + dy <= this.attackRange && (dx + dy > 0);
        }
        
        // For non-archers, check if target is in front based on direction
        if (this.attackRange === 1) {
            switch (this.direction) {
                case 'north': return targetX === this.x && targetY === this.y - 1;
                case 'south': return targetX === this.x && targetY === this.y + 1;
                case 'east': return targetX === this.x + 1 && targetY === this.y;
                case 'west': return targetX === this.x - 1 && targetY === this.y;
            }
        }
        
        return false;
    }

    move(x, y) {
        if (!this.canMoveTo(x, y)) return false;
        
        // Remove from old position
        if (this.x !== null && this.y !== null) {
            gameState.battlefield[this.y][this.x] = null;
        }
        
        // Move to new position
        this.x = x;
        this.y = y;
        gameState.battlefield[y][x] = this;
        this.hasMoved = true;
        
        return true;
    }

    attack(target) {
        if (!target || target.team === this.team || target.cannotBeAttacked) return false;
        
        let damage = this.attack;
        let targetDestroyed = false;
        
        // Check for cavalry flanking bonus against shock
        if (this.type === 'cavalry' && target.type === 'shock') {
            const attackDirection = this.getAttackDirection(target);
            if (attackDirection === 'side' || attackDirection === 'rear') {
                damage += 1; // Flanking bonus
                gameState.addLogMessage(`${this.type} flanks ${target.type}!`, 'success');
            }
        }
        
        // Check for vulnerability to side/rear attacks (light chariots)
        if (target.vulnerableToSideRear) {
            const attackDirection = this.getAttackDirection(target);
            if (attackDirection === 'side' || attackDirection === 'rear') {
                targetDestroyed = true;
                gameState.addLogMessage(`${target.type} vulnerable to ${attackDirection} attack!`, 'success');
            }
        }
        
        // Check immunities
        if (target.defense === 'immune' || target.immuneToSingle) {
            if (target.immuneToSingle && target.immuneToSingle.includes(this.type)) {
                if (!target.previousAttacker || target.previousAttacker !== this.type) {
                    target.previousAttacker = this.type;
                    gameState.addLogMessage(`${target.type} is immune to single ${this.type} attack`, 'info');
                    return false;
                }
            }
        }
        
        // Handle heavy chariot damage
        if (target.type === 'heavy-chariot') {
            target.currentHitPoints -= damage;
            if (target.currentHitPoints <= 0) {
                targetDestroyed = true;
            } else {
                gameState.addLogMessage(`${target.type} takes damage (${target.currentHitPoints}/${target.hitPoints} HP remaining)`, 'info');
            }
        } else if (targetDestroyed || damage > 0) {
            targetDestroyed = true;
        }
        
        if (targetDestroyed) {
            this.destroyUnit(target);
            gameState.addLogMessage(`${this.type} destroys ${target.type}`, 'success');
        } else {
            gameState.addLogMessage(`${this.type} attacks ${target.type} but cannot penetrate defense`, 'info');
        }
        
        this.hasActed = true;
        return true;
    }

    getAttackDirection(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        
        // Determine which direction we're attacking from relative to target's facing
        switch (target.direction) {
            case 'north':
                if (dy > 0) return 'front';
                if (dy < 0) return 'rear';
                return 'side';
            case 'south':
                if (dy < 0) return 'front';
                if (dy > 0) return 'rear';
                return 'side';
            case 'east':
                if (dx < 0) return 'front';
                if (dx > 0) return 'rear';
                return 'side';
            case 'west':
                if (dx > 0) return 'front';
                if (dx < 0) return 'rear';
                return 'side';
            default:
                return 'front';
        }
    }

    destroyUnit(target) {
        // Remove from battlefield
        if (target.x !== null && target.y !== null) {
            gameState.battlefield[target.y][target.x] = null;
        }
        
        // Remove from army
        const army = target.team === 'red' ? gameState.redArmy : gameState.blueArmy;
        const index = army.indexOf(target);
        if (index > -1) {
            army.splice(index, 1);
        }
        
        // Check win condition
        if (target.type === 'commander') {
            gameState.addLogMessage(`${target.team} commander destroyed! ${this.team} wins!`, 'success');
            endBattle(this.team);
        }
    }

    resetTurn() {
        this.hasMoved = false;
        this.hasActed = false;
    }
}

// Initialize game state
const gameState = new GameState();

// Navigation Functions
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId + '-page').classList.add('active');
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    
    gameState.currentPage = pageId;
    
    // Initialize page-specific content
    if (pageId === 'battle') {
        initializeBattle();
    } else if (pageId === 'army-builder') {
        initializeArmyBuilder();
    }
}

// War Declaration Functions
function selectCasus(type) {
    gameState.selectedCasus = type;
    
    // Remove previous selection
    document.querySelectorAll('.casus-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Select new casus
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    // Show war details and set turn limits
    const warDetails = document.getElementById('war-details');
    warDetails.style.display = 'block';
    
    // Set turn limits based on casus belli
    switch(type) {
        case 'skirmish':
        case 'raid':
            gameState.maxTurns = 4;
            break;
        case 'conquest':
        case 'subjugation':
            gameState.maxTurns = 6;
            break;
    }
    
    checkBattleReadiness();
}

function initializeBattle() {
    gameState.warActive = true;
    gameState.reset();
    
    // Apply war weariness and supply line effects
    if (gameState.currentTurn > 4) {
        gameState.warWeariness = true;
        gameState.addLogMessage('War weariness sets in - all units suffer -1 combat strength', 'error');
    }
    
    createBattlefield();
    populateAvailableUnits();
    updateUI();
    gameState.addLogMessage('Battle initialized. Red player begins placement phase.', 'info');
    
    if (gameState.selectedCasus) {
        gameState.addLogMessage(`War declared with ${gameState.selectedCasus} casus belli`, 'info');
    }
}

// Army Builder Functions
let unitIdCounter = 0;
let selectedTeam = 'red';

function selectTeam(team) {
    selectedTeam = team;
    
    // Update team button visual state
    document.querySelectorAll('.btn-team').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-team="${team}"]`).classList.add('active');
}

function generateUnitId(type, team) {
    return `${team}-${type}-${++unitIdCounter}`;
}

function addUnit(unitType) {
    const currentTeam = selectedTeam;
    
    // Check army size limit
    if (gameState.customArmies[currentTeam].length >= gameState.armyLimits.maxUnits) {
        alert(`Army size limit reached (${gameState.armyLimits.maxUnits} units maximum)`);
        return;
    }
    
    // Check commander limit
    if (unitType === 'commander') {
        const commanderCount = gameState.customArmies[currentTeam].filter(unit => unit.type === 'commander').length;
        if (commanderCount >= gameState.armyLimits.requiredCommanders) {
            alert('Each army can only have 1 commander');
            return;
        }
    }
    
    const unitId = generateUnitId(unitType, currentTeam);
    const newUnit = new Unit(unitType, currentTeam, unitId);
    gameState.customArmies[currentTeam].push(newUnit);
    
    updateArmyDisplay();
    checkBattleReadiness();
}

function removeUnit(team, unitIndex) {
    gameState.customArmies[team].splice(unitIndex, 1);
    updateArmyDisplay();
    checkBattleReadiness();
}

function clearArmy(team) {
    gameState.customArmies[team] = [];
    updateArmyDisplay();
    checkBattleReadiness();
}

function generateRandomArmy(team) {
    clearArmy(team);
    
    // Always add 1 commander
    const commanderId = generateUnitId('commander', team);
    gameState.customArmies[team].push(new Unit('commander', team, commanderId));
    
    // Add random units to fill army
    const unitTypes = ['infantry', 'shock', 'archer', 'cavalry', 'chariot'];
    const armySize = Math.floor(Math.random() * (gameState.armyLimits.maxUnits - gameState.armyLimits.minUnits)) + gameState.armyLimits.minUnits;
    
    for (let i = 1; i < armySize; i++) {
        const randomType = unitTypes[Math.floor(Math.random() * unitTypes.length)];
        const unitId = generateUnitId(randomType, team);
        gameState.customArmies[team].push(new Unit(randomType, team, unitId));
    }
    
    updateArmyDisplay();
    checkBattleReadiness();
}

function loadPreset(presetType) {
    const presets = {
        balanced: {
            red: [
                { type: 'commander', count: 1 },
                { type: 'infantry', count: 3 },
                { type: 'shock', count: 2 },
                { type: 'archer', count: 2 },
                { type: 'cavalry', count: 2 },
                { type: 'scout', count: 1 }
            ],
            blue: [
                { type: 'commander', count: 1 },
                { type: 'infantry', count: 3 },
                { type: 'shock', count: 2 },
                { type: 'archer', count: 2 },
                { type: 'cavalry', count: 2 },
                { type: 'scout', count: 1 }
            ]
        },
        cavalry: {
            red: [
                { type: 'commander', count: 1 },
                { type: 'cavalry', count: 4 },
                { type: 'light-chariot', count: 2 },
                { type: 'infantry', count: 2 },
                { type: 'archer', count: 1 },
                { type: 'scout', count: 1 }
            ],
            blue: [
                { type: 'commander', count: 1 },
                { type: 'cavalry', count: 4 },
                { type: 'light-chariot', count: 2 },
                { type: 'infantry', count: 2 },
                { type: 'archer', count: 1 },
                { type: 'scout', count: 1 }
            ]
        },
        defensive: {
            red: [
                { type: 'commander', count: 1 },
                { type: 'shock', count: 3 },
                { type: 'archer', count: 3 },
                { type: 'heavy-chariot', count: 2 },
                { type: 'infantry', count: 2 },
                { type: 'scout', count: 1 }
            ],
            blue: [
                { type: 'commander', count: 1 },
                { type: 'shock', count: 3 },
                { type: 'archer', count: 3 },
                { type: 'heavy-chariot', count: 2 },
                { type: 'infantry', count: 2 },
                { type: 'scout', count: 1 }
            ]
        },
        archer: {
            red: [
                { type: 'commander', count: 1 },
                { type: 'archer', count: 4 },
                { type: 'infantry', count: 3 },
                { type: 'shock', count: 2 },
                { type: 'light-chariot', count: 1 },
                { type: 'scout', count: 1 }
            ],
            blue: [
                { type: 'commander', count: 1 },
                { type: 'archer', count: 4 },
                { type: 'infantry', count: 3 },
                { type: 'shock', count: 2 },
                { type: 'light-chariot', count: 1 },
                { type: 'scout', count: 1 }
            ]
        }
    };
    
    const preset = presets[presetType];
    if (!preset) return;
    
    // Clear both armies
    gameState.customArmies.red = [];
    gameState.customArmies.blue = [];
    
    // Build both armies from preset
    ['red', 'blue'].forEach(team => {
        preset[team].forEach(unitGroup => {
            for (let i = 0; i < unitGroup.count; i++) {
                const unitId = generateUnitId(unitGroup.type, team);
                gameState.customArmies[team].push(new Unit(unitGroup.type, team, unitId));
            }
        });
    });
    
    updateArmyDisplay();
    checkBattleReadiness();
}

function updateArmyDisplay() {
    ['red', 'blue'].forEach(team => {
        const armyList = document.getElementById(`${team}-army-list`);
        const unitCount = document.getElementById(`${team}-unit-count`);
        const army = gameState.customArmies[team];
        
        // Update unit count
        unitCount.textContent = `(${army.length}/${gameState.armyLimits.maxUnits} units)`;
        
        // Clear and rebuild army list
        armyList.innerHTML = '';
        
        if (army.length === 0) {
            armyList.classList.remove('has-units');
            armyList.innerHTML = '<p style="text-align: center; color: #999; margin: 2rem 0;">No units added yet</p>';
        } else {
            armyList.classList.add('has-units');
            
            army.forEach((unit, index) => {
                const unitElement = document.createElement('div');
                unitElement.className = 'army-unit-item';
                unitElement.innerHTML = `
                    <div class="army-unit-info">
                        <span class="army-unit-icon">${unit.getIcon()}</span>
                        <span class="army-unit-name">${unit.type}</span>
                        <span class="army-unit-id">(${unit.id})</span>
                    </div>
                    <button class="btn-remove" onclick="removeUnit('${team}', ${index})">Remove</button>
                `;
                armyList.appendChild(unitElement);
            });
        }
    });
}

function checkBattleReadiness() {
    const redArmy = gameState.customArmies.red;
    const blueArmy = gameState.customArmies.blue;
    const statusElement = document.getElementById('army-status');
    const startButton = document.getElementById('start-battle-btn');
    
    let isReady = true;
    let statusMessage = '';
    
    // Check if casus belli is selected
    if (!gameState.selectedCasus) {
        isReady = false;
        statusMessage = 'Select a Casus Belli to declare war';
    }
    // Check war objective
    else if (!document.getElementById('war-target')?.value && gameState.selectedCasus) {
        isReady = false;
        statusMessage = 'Specify your war objective';
    }
    // Check both armies have minimum units
    else if (redArmy.length < gameState.armyLimits.minUnits || blueArmy.length < gameState.armyLimits.minUnits) {
        isReady = false;
        statusMessage = `Each army needs at least ${gameState.armyLimits.minUnits} units`;
    }
    // Check both armies have exactly 1 commander
    else if (redArmy.filter(u => u.type === 'commander').length !== 1 || 
             blueArmy.filter(u => u.type === 'commander').length !== 1) {
        isReady = false;
        statusMessage = 'Each army must have exactly 1 commander';
    }
    // All good!
    else {
        const casusBelli = gameState.selectedCasus;
        const turns = gameState.maxTurns;
        statusMessage = `Ready for ${casusBelli} (${turns} turn limit)! War cost: 1 Diplomatic Favor`;
    }
    
    statusElement.textContent = statusMessage;
    statusElement.parentElement.className = `ready-status ${isReady ? 'valid' : 'invalid'}`;
    startButton.disabled = !isReady;
}

function startBattleWithCustomArmies() {
    if (!document.getElementById('start-battle-btn').disabled) {
        gameState.warObjective = document.getElementById('war-target')?.value || '';
        gameState.addLogMessage(`War declared: ${gameState.selectedCasus} - ${gameState.warObjective}`, 'success');
        gameState.addLogMessage(`Diplomatic cost: -1 Favor. Army creation cost: 1 Labor per army`, 'info');
        showPage('battle');
    }
}

function initializeArmyBuilder() {
    // Initialize empty armies if not already set
    if (gameState.customArmies.red.length === 0 && gameState.customArmies.blue.length === 0) {
        // Start with a basic setup
        loadPreset('balanced');
    }
    
    updateArmyDisplay();
    checkBattleReadiness();
}

function createBattlefield() {
    const battlefield = document.getElementById('battlefield');
    battlefield.innerHTML = '';
    
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const cell = document.createElement('div');
            cell.className = 'battlefield-cell';
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            // Mark placement zones
            if (y >= 7) {
                cell.classList.add('red-zone');
            } else if (y <= 1) {
                cell.classList.add('blue-zone');
            }
            
            cell.addEventListener('click', () => handleCellClick(x, y));
            battlefield.appendChild(cell);
        }
    }
}

function populateAvailableUnits() {
    const unitsContainer = document.getElementById('available-units');
    unitsContainer.innerHTML = '';
    
    const currentArmy = gameState.currentPlayer === 'red' ? gameState.redArmy : gameState.blueArmy;
    
    currentArmy.forEach(unit => {
        if (gameState.currentPhase === 'placement' && unit.x === null) {
            const unitElement = createUnitElement(unit);
            unitsContainer.appendChild(unitElement);
        } else if (gameState.currentPhase === 'battle' && unit.x !== null) {
            const unitElement = createUnitElement(unit);
            unitsContainer.appendChild(unitElement);
        }
    });
}

function createUnitElement(unit) {
    const element = document.createElement('div');
    element.className = 'unit-item';
    element.dataset.unitId = unit.id;
    
    element.innerHTML = `
        <span class="unit-icon">${unit.getIcon()}</span>
        <span class="unit-name">${unit.type}</span>
        <span class="unit-status">${unit.injured ? '🩹' : ''}</span>
    `;
    
    element.addEventListener('click', () => selectUnit(unit));
    return element;
}

function selectUnit(unit) {
    gameState.selectedUnit = unit;
    
    // Update UI
    document.querySelectorAll('.unit-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelector(`[data-unit-id="${unit.id}"]`).classList.add('selected');
    
    // Show unit details
    showUnitDetails(unit);
    
    // Highlight valid moves/attacks
    highlightValidActions(unit);
}

function showUnitDetails(unit) {
    const detailsContainer = document.getElementById('unit-details');
    detailsContainer.innerHTML = `
        <p><strong>Type:</strong> ${unit.type}</p>
        <p><strong>Team:</strong> ${unit.team}</p>
        <p><strong>Attack:</strong> ${unit.attack}</p>
        <p><strong>Defense:</strong> ${unit.defense}</p>
        <p><strong>Movement:</strong> ${unit.movement}</p>
        <p><strong>Direction:</strong> ${unit.direction}</p>
        <p><strong>Status:</strong> ${unit.injured ? 'Injured' : 'Healthy'}</p>
        ${gameState.currentPhase === 'battle' ? `
        <p><strong>Moved:</strong> ${unit.hasMoved ? 'Yes' : 'No'}</p>
        <p><strong>Acted:</strong> ${unit.hasActed ? 'Yes' : 'No'}</p>
        ` : ''}
    `;
}

function highlightValidActions(unit) {
    // Clear previous highlights
    document.querySelectorAll('.battlefield-cell').forEach(cell => {
        cell.classList.remove('valid-move', 'valid-attack', 'selected');
    });
    
    if (gameState.currentPhase === 'placement') {
        // Highlight valid placement zones
        const isRed = unit.team === 'red';
        document.querySelectorAll('.battlefield-cell').forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            
            if (isRed && y >= 7 && !gameState.battlefield[y][x]) {
                cell.classList.add('valid-move');
            } else if (!isRed && y <= 1 && !gameState.battlefield[y][x]) {
                cell.classList.add('valid-move');
            }
        });
    } else if (gameState.currentPhase === 'battle' && unit.x !== null) {
        // Highlight current position
        const currentCell = document.querySelector(`[data-x="${unit.x}"][data-y="${unit.y}"]`);
        if (currentCell) currentCell.classList.add('selected');
        
        // Highlight valid moves
        if (!unit.hasMoved) {
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    if (unit.canMoveTo(x, y) && !gameState.battlefield[y][x]) {
                        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                        if (cell) cell.classList.add('valid-move');
                    }
                }
            }
        }
        
        // Highlight valid attacks
        if (!unit.hasActed) {
            for (let y = 0; y < 9; y++) {
                for (let x = 0; x < 9; x++) {
                    const target = gameState.battlefield[y][x];
                    if (target && target.team !== unit.team && unit.canAttack(x, y)) {
                        const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                        if (cell) cell.classList.add('valid-attack');
                    }
                }
            }
        }
    }
}

function handleCellClick(x, y) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    
    if (gameState.currentPhase === 'placement') {
        handlePlacementClick(x, y, cell);
    } else if (gameState.currentPhase === 'battle') {
        handleBattleClick(x, y, cell);
    }
}

function handlePlacementClick(x, y, cell) {
    if (!gameState.selectedUnit) return;
    
    if (cell.classList.contains('valid-move')) {
        // Place unit
        gameState.selectedUnit.move(x, y);
        updateBattlefield();
        gameState.addLogMessage(`${gameState.selectedUnit.type} placed at (${x}, ${y})`, 'info');
        
        // Check if placement is complete
        checkPlacementComplete();
        
        // Clear selection
        gameState.selectedUnit = null;
        populateAvailableUnits();
        clearHighlights();
    }
}

function handleBattleClick(x, y, cell) {
    if (!gameState.selectedUnit) return;
    
    if (cell.classList.contains('valid-move') && gameState.selectedAction === 'move') {
        // Move unit
        const oldX = gameState.selectedUnit.x;
        const oldY = gameState.selectedUnit.y;
        
        if (gameState.selectedUnit.move(x, y)) {
            updateBattlefield();
            gameState.addLogMessage(`${gameState.selectedUnit.type} moved from (${oldX}, ${oldY}) to (${x}, ${y})`, 'info');
            clearSelection();
        }
    } else if (cell.classList.contains('valid-attack') && gameState.selectedAction === 'attack') {
        // Attack target
        const target = gameState.battlefield[y][x];
        if (target && gameState.selectedUnit.attack(target)) {
            updateBattlefield();
            clearSelection();
        }
    }
}

function checkPlacementComplete() {
    const currentArmy = gameState.currentPlayer === 'red' ? gameState.redArmy : gameState.blueArmy;
    const unplacedUnits = currentArmy.filter(unit => unit.x === null);
    
    if (unplacedUnits.length === 0) {
        gameState.placementPhaseComplete[gameState.currentPlayer] = true;
        gameState.addLogMessage(`${gameState.currentPlayer} placement complete`, 'success');
        
        if (gameState.placementPhaseComplete.red && gameState.placementPhaseComplete.blue) {
            // Both players done, start battle phase
            gameState.nextPhase();
            gameState.addLogMessage('Placement complete. Battle phase begins!', 'success');
        } else {
            // Switch to other player
            gameState.switchPlayer();
        }
        
        populateAvailableUnits();
    }
}

function selectAction(action) {
    gameState.selectedAction = action;
    
    // Update action buttons
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update highlights
    if (gameState.selectedUnit) {
        highlightValidActions(gameState.selectedUnit);
    }
}

function endTurn() {
    if (gameState.currentPhase === 'placement') {
        if (!gameState.placementPhaseComplete[gameState.currentPlayer]) {
            alert('Complete unit placement before ending turn');
            return;
        }
        gameState.switchPlayer();
    } else if (gameState.currentPhase === 'battle') {
        // Reset all units for current player
        const currentArmy = gameState.currentPlayer === 'red' ? gameState.redArmy : gameState.blueArmy;
        currentArmy.forEach(unit => unit.resetTurn());
        
        if (gameState.currentPlayer === 'blue') {
            // Both players completed turn, advance to next turn
            gameState.currentTurn++;
            
            // Check for war mechanics
            checkWarConditions();
            
            gameState.nextPhase();
        } else {
            gameState.switchPlayer();
        }
    }
    
    clearSelection();
    populateAvailableUnits();
    updateUI();
}

function checkWarConditions() {
    // War weariness after turn 4
    if (gameState.currentTurn > 4 && !gameState.warWeariness) {
        gameState.warWeariness = true;
        gameState.addLogMessage('War weariness begins - units suffer -1 combat strength', 'error');
    }
    
    // Extended war penalty after turn 6
    if (gameState.currentTurn > 6) {
        gameState.addLogMessage('Extended war penalties: +1 Food maintenance per army', 'error');
    }
    
    // Check turn limits based on casus belli
    if (gameState.currentTurn >= gameState.maxTurns) {
        const casus = gameState.selectedCasus;
        if (casus === 'skirmish' || casus === 'raid') {
            gameState.addLogMessage('Turn limit reached! Evaluating war objectives...', 'error');
            // In a full implementation, this would check victory conditions
        }
    }
    
    // Supply line issues (simplified - would check army positions in full game)
    if (gameState.currentTurn > 2 && Math.random() < 0.3) {
        gameState.addLogMessage('Supply line disruption! Some units may be lost if beyond expansion range', 'error');
    }
}

function updateBattlefield() {
    // Clear all unit displays
    document.querySelectorAll('.battlefield-cell').forEach(cell => {
        const unit = cell.querySelector('.unit');
        if (unit) unit.remove();
    });
    
    // Place all units
    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const unit = gameState.battlefield[y][x];
            if (unit) {
                const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                const unitElement = document.createElement('div');
                unitElement.className = `unit ${unit.team}`;
                if (unit.injured) unitElement.classList.add('injured');
                unitElement.innerHTML = unit.getIcon();
                
                // Add direction indicator
                const directionElement = document.createElement('div');
                directionElement.className = 'unit-direction';
                directionElement.innerHTML = getDirectionSymbol(unit.direction);
                unitElement.appendChild(directionElement);
                
                cell.appendChild(unitElement);
            }
        }
    }
}

function getDirectionSymbol(direction) {
    const symbols = {
        north: '↑',
        south: '↓',
        east: '→',
        west: '←'
    };
    return symbols[direction] || '↑';
}

function updateUI() {
    document.getElementById('current-turn').textContent = gameState.currentTurn;
    document.getElementById('current-phase').textContent = gameState.currentPhase;
    document.getElementById('current-player').textContent = gameState.currentPlayer;
    
    // Update end turn button
    const endTurnBtn = document.getElementById('end-turn-btn');
    if (gameState.currentPhase === 'placement') {
        endTurnBtn.textContent = gameState.placementPhaseComplete[gameState.currentPlayer] ? 'Next Player' : 'Complete Placement';
    } else {
        endTurnBtn.textContent = 'End Turn';
    }
    
    // Show war status if active
    if (gameState.warActive && gameState.selectedCasus) {
        const battleHeader = document.querySelector('.battle-header h2');
        if (battleHeader) {
            battleHeader.textContent = `Battle Arena - ${gameState.selectedCasus.toUpperCase()} (Turn ${gameState.currentTurn}/${gameState.maxTurns})`;
        }
    }
    
    // Show war effects
    if (gameState.warWeariness) {
        const turnInfo = document.querySelector('.turn-info');
        if (turnInfo && !turnInfo.querySelector('.war-effects')) {
            const warEffects = document.createElement('span');
            warEffects.className = 'war-effects';
            warEffects.innerHTML = '<span style="color: #dc3545;">⚠️ War Weariness</span>';
            turnInfo.appendChild(warEffects);
        }
    }
}

function updateBattleLog() {
    const logContainer = document.getElementById('log-messages');
    logContainer.innerHTML = '';
    
    gameState.battleLog.slice(-10).forEach(entry => {
        const logElement = document.createElement('p');
        logElement.className = entry.type;
        logElement.textContent = entry.message;
        logContainer.appendChild(logElement);
    });
    
    logContainer.scrollTop = logContainer.scrollHeight;
}

function clearSelection() {
    gameState.selectedUnit = null;
    gameState.selectedAction = null;
    
    document.querySelectorAll('.unit-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    document.querySelectorAll('.btn-action').forEach(btn => {
        btn.classList.remove('active');
    });
    
    clearHighlights();
    
    document.getElementById('unit-details').innerHTML = '<p>Select a unit to view details</p>';
}

function clearHighlights() {
    document.querySelectorAll('.battlefield-cell').forEach(cell => {
        cell.classList.remove('valid-move', 'valid-attack', 'selected');
    });
}

function endBattle(winner) {
    gameState.addLogMessage(`Battle ended! ${winner} team victorious!`, 'success');
    
    setTimeout(() => {
        alert(`Battle Complete!\n\nWinner: ${winner.toUpperCase()} team\n\nReturning to home page...`);
        showPage('home');
        gameState.reset();
    }, 2000);
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Navigation event listeners
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showPage(btn.dataset.page);
        });
    });
    
    // Initialize with home page
    showPage('home');
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (gameState.currentPage === 'battle') {
            switch(e.key) {
                case 'Escape':
                    clearSelection();
                    break;
                case 'Enter':
                    if (gameState.selectedUnit && gameState.selectedAction) {
                        // Execute selected action
                    }
                    break;
                case ' ':
                    e.preventDefault();
                    endTurn();
                    break;
            }
        }
    });
});
