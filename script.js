// Game State Management
class GameState {
    constructor() {
        this.currentPage = 'home';
        this.customArmies = {
            red: [],
            blue: []
        };
        this.armyLimits = {
            maxUnits: 12,
            minUnits: 4,
            requiredCommanders: 1
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
            // Rally phase - heal injured units and reset positions
            [...this.redArmy, ...this.blueArmy].forEach(unit => {
                if (unit.injured) {
                    unit.injured = false;
                    this.addLogMessage(`${unit.type} recovers from injuries`, 'info');
                }
            });
        } else if (this.currentPhase === 'rally') {
            this.currentTurn++;
            this.currentPhase = 'battle';
            this.currentPlayer = 'red';
            // Reset all units for new turn
            [...this.redArmy, ...this.blueArmy].forEach(unit => {
                unit.resetTurn();
            });
        }
        updateUI();
        populateAvailableUnits();
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
                icon: '🛡️', // Updated to ensure distinct icon
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
                icon: '👑', // Ensures commander icon is correctly set
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
                icon: '🚛', // Updated to ensure distinct icon
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
        // Ensure the target position is within the battlefield grid
        if (x < 0 || x >= gameState.battlefield[0].length || y < 0 || y >= gameState.battlefield.length) {
            return false;
        }

        // Prevent moving to an occupied cell
        if (gameState.battlefield[y][x] !== null) {
            return false;
        }

        // During placement phase, units can be placed anywhere valid
        if (this.x === null && this.y === null) {
            return true; // Will be checked by placement zone logic
        }

        if (this.hasMoved) return false;

        const dx = Math.abs(x - this.x);
        const dy = Math.abs(y - this.y);

        if (this.cardinalOnly) {
            return (dx === 0 || dy === 0) && (dx + dy <= this.movement);
        }

        return Math.max(dx, dy) <= this.movement;
    }

    canAttack(targetX, targetY) {
        // Ensure the target position is within the battlefield grid
        if (targetX < 0 || targetX >= gameState.battlefield[0].length || targetY < 0 || targetY >= gameState.battlefield.length) {
            return false;
        }

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

        // Diagonal attacks for units that can attack diagonally
        if (this.canAttackDiagonal) {
            return dx === dy && dx <= this.attackRange;
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

        confirmAction(`Are you sure you want to attack ${target.type}?`, () => {
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
        });
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
            showVictoryScreen(this.team);
        }
    }

    resetTurn() {
        this.hasMoved = false;
        this.hasActed = false;
    }

    turn(direction) {
        if (['north', 'south', 'east', 'west'].includes(direction)) {
            this.direction = direction;
            gameState.addLogMessage(`${this.type} turned to face ${direction}.`, 'info');
        } else {
            console.error('Invalid direction:', direction);
        }
    }

    doNothing() {
        this.hasMoved = true;
        this.hasActed = true;
        gameState.addLogMessage(`${this.type} chose to do nothing this turn.`, 'info');
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

function initializeBattle() {
    gameState.reset();
    createBattlefield();
    populateAvailableUnits();
    updateUI();
    gameState.addLogMessage('Battle initialized. Red player begins placement phase.', 'info');
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
    
    // Check both armies have minimum units
    if (redArmy.length < gameState.armyLimits.minUnits || blueArmy.length < gameState.armyLimits.minUnits) {
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
        statusMessage = 'Ready to battle!';
    }
    
    statusElement.textContent = statusMessage;
    statusElement.parentElement.className = `ready-status ${isReady ? 'valid' : 'invalid'}`;
    startButton.disabled = !isReady;
}

function startBattle() {
    if (!document.getElementById('start-battle-btn').disabled) {
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

    addHoverEffects();
}

function addHoverEffects() {
    const cells = document.querySelectorAll('.battlefield-cell');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', () => {
            const x = parseInt(cell.dataset.x, 10);
            const y = parseInt(cell.dataset.y, 10);
            if (gameState.selectedUnit && gameState.selectedUnit.canMoveTo(x, y)) {
                cell.classList.add('highlight-move');
            } else if (gameState.selectedUnit && gameState.selectedUnit.canAttack(x, y)) {
                cell.classList.add('highlight-attack');
            }
        });
        cell.addEventListener('mouseleave', () => {
            cell.classList.remove('highlight-move', 'highlight-attack');
        });
    });
}

function populateAvailableUnits() {
    const unitsContainer = document.getElementById('available-units');
    unitsContainer.innerHTML = '';
    
    const currentArmy = gameState.currentPlayer === 'red' ? gameState.redArmy : gameState.blueArmy;
    
    currentArmy.forEach(unit => {
        if (gameState.currentPhase === 'placement' && unit.x === null) {
            // Show units that haven't been placed yet
            const unitElement = createUnitElement(unit);
            unitsContainer.appendChild(unitElement);
        } else if ((gameState.currentPhase === 'battle' || gameState.currentPhase === 'rally') && unit.x !== null) {
            // Show units that are on the battlefield
            const unitElement = createUnitElement(unit);
            unitsContainer.appendChild(unitElement);
        }
    });
    
    // Add phase-specific instructions
    const instructionElement = document.createElement('div');
    instructionElement.className = 'phase-instructions';
    instructionElement.style.cssText = 'padding: 1rem; background: rgba(0,0,0,0.1); border-radius: 5px; margin-top: 1rem; font-size: 0.9rem;';
    
    if (gameState.currentPhase === 'placement') {
        instructionElement.innerHTML = '<strong>Placement Phase:</strong><br>Select units and place them in your deployment zone.';
    } else if (gameState.currentPhase === 'battle') {
        instructionElement.innerHTML = '<strong>Battle Phase:</strong><br>Select units to move and attack. Click green squares to move, red squares to attack.';
    } else if (gameState.currentPhase === 'rally') {
        instructionElement.innerHTML = '<strong>Rally Phase:</strong><br>Units recover from injuries. Click "End Turn" to continue.';
    }
    
    unitsContainer.appendChild(instructionElement);
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
            if ((isRed && y >= 7 || !isRed && y <= 1) && !gameState.battlefield[y][x]) {
                cell.classList.add('valid-move');
            }
        });
    } else if (gameState.currentPhase === 'battle' && unit.x !== null) {
        // Highlight valid moves
        for (let dx = -unit.movement; dx <= unit.movement; dx++) {
            for (let dy = -unit.movement; dy <= unit.movement; dy++) {
                const x = unit.x + dx;
                const y = unit.y + dy;
                if (unit.canMoveTo(x, y)) {
                    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (cell) cell.classList.add('valid-move');
                }
            }
        }

        // Highlight valid attacks
        for (let dx = -unit.attackRange; dx <= unit.attackRange; dx++) {
            for (let dy = -unit.attackRange; dy <= unit.attackRange; dy++) {
                const x = unit.x + dx;
                const y = unit.y + dy;
                if (unit.canAttack(x, y)) {
                    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
                    if (cell) cell.classList.add('valid-attack');
                }
            }
        }
    }
}

function handleCellClick(x, y) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (!cell) return;

    if (gameState.currentPhase === 'placement') {
        this.handlePlacementClick(x, y, cell);
    } else if (gameState.currentPhase === 'battle') {
        this.handleBattleClick(x, y, cell);
    }
}

function handlePlacementClick(x, y, cell) {
    if (!gameState.selectedUnit) return;

    // Ensure the cell is valid for placement
    if (!cell.classList.contains('valid-move')) return;

    // Prevent placing on an occupied cell
    if (gameState.battlefield[y][x] !== null) {
        alert('Cannot place unit on an occupied cell.');
        return;
    }

    gameState.selectedUnit.move(x, y);
    gameState.selectedUnit = null;
    populateAvailableUnits();
    checkPlacementComplete();
}

function handleBattleClick(x, y, cell) {
    if (!gameState.selectedUnit) return;

    const target = gameState.battlefield[y][x];

    // If clicking on valid move location and unit can move
    if (cell.classList.contains('valid-move') && !gameState.selectedUnit.hasMoved) {
        const moveSuccessful = gameState.selectedUnit.move(x, y);
        if (!moveSuccessful) {
            alert('Move failed. Please try again.');
            return;
        }
    } else if (cell.classList.contains('valid-attack') && target) {
        // Ensure the target is an enemy unit
        if (target.team === gameState.selectedUnit.team) {
            alert('Cannot attack your own unit.');
            return;
        }

        gameState.selectedUnit.attack(target);
    }

    highlightValidActions(gameState.selectedUnit);
}

function checkPlacementComplete() {
    const redComplete = gameState.redArmy.every(unit => unit.x !== null);
    const blueComplete = gameState.blueArmy.every(unit => unit.x !== null);

    if (redComplete && blueComplete) {
        gameState.nextPhase();
    }
}

function animateUnitMovement(unit, targetX, targetY) {
    const unitElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
    if (unitElement) {
        unitElement.style.transition = 'transform 0.5s ease';
        unitElement.style.transform = `translate(${targetX * 50}px, ${targetY * 50}px)`;
    }
}

function animateAttack(unit, target) {
    const unitElement = document.querySelector(`[data-unit-id="${unit.id}"]`);
    const targetElement = document.querySelector(`[data-unit-id="${target.id}"]`);
    if (unitElement && targetElement) {
        unitElement.classList.add('attack-animation');
        setTimeout(() => {
            unitElement.classList.remove('attack-animation');
        }, 500);
    }
}

// Update move and attack methods to include animations
Unit.prototype.move = function(x, y) {
    if (!this.canMoveTo(x, y)) return false;
    actionHistory.addAction({ type: 'move', unit: this, from: { x: this.x, y: this.y }, to: { x, y } });
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
};

Unit.prototype.attack = function(target) {
    if (!target || target.team === this.team || target.cannotBeAttacked) return false;
    actionHistory.addAction({ type: 'attack', attacker: this, target });
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
};

function confirmAction(message, onConfirm) {
    const confirmation = window.confirm(message);
    if (confirmation) {
        onConfirm();
    }
}

// Update attack and end turn methods to include confirmation dialogs
Unit.prototype.attack = function(target) {
    if (!target || target.team === this.team || target.cannotBeAttacked) return false;

    confirmAction(`Are you sure you want to attack ${target.type}?`, () => {
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
    });
};

function endTurn() {
    confirmAction('Are you sure you want to end your turn?', () => {
        gameState.switchPlayer();
        gameState.nextPhase();
    });
}

function undoLastAction() {
    const action = actionHistory.undo();
    if (!action) return;

    if (action.type === 'move') {
        action.unit.move(action.from.x, action.from.y);
    } else if (action.type === 'attack') {
        // Handle undoing an attack (e.g., restoring target state)
    }

    updateUI();
}

function redoLastAction() {
    const action = actionHistory.redo();
    if (!action) return;

    if (action.type === 'move') {
        action.unit.move(action.to.x, action.to.y);
    } else if (action.type === 'attack') {
        // Handle redoing an attack
    }

    updateUI();
}

// Settings Menu Functions
function showSettingsMenu() {
    const settingsMenu = document.createElement('div');
    settingsMenu.className = 'settings-menu';
    settingsMenu.innerHTML = `
        <h2>Game Settings</h2>
        <label>
            Battlefield Size:
            <input type="number" id="battlefield-size" value="9" min="5" max="15">
        </label>
        <label>
            Max Units per Army:
            <input type="number" id="max-units" value="12" min="4" max="20">
        </label>
        <button onclick="applySettings()">Apply</button>
        <button onclick="closeSettingsMenu()">Close</button>
    `;
    document.body.appendChild(settingsMenu);
}

function applySettings() {
    const battlefieldSizeInput = document.getElementById('battlefield-size');
    const maxUnitsInput = document.getElementById('max-units');

    if (!battlefieldSizeInput || !maxUnitsInput) {
        console.error('Settings inputs are missing.');
        return;
    }

    const battlefieldSize = parseInt(battlefieldSizeInput.value, 10);
    const maxUnits = parseInt(maxUnitsInput.value, 10);

    if (isNaN(battlefieldSize) || isNaN(maxUnits) || battlefieldSize < 5 || battlefieldSize > 15 || maxUnits < 4 || maxUnits > 20) {
        console.error('Invalid settings values.');
        return;
    }

    gameState.battlefield = Array(battlefieldSize).fill().map(() => Array(battlefieldSize).fill(null));
    gameState.armyLimits.maxUnits = maxUnits;

    closeSettingsMenu();
    initializeBattle();
}

function closeSettingsMenu() {
    const settingsMenu = document.querySelector('.settings-menu');
    if (settingsMenu) {
        settingsMenu.remove();
    }
}

// Add a button to open the settings menu
const settingsButton = document.createElement('button');
settingsButton.textContent = 'Settings';
settingsButton.onclick = showSettingsMenu;
document.body.appendChild(settingsButton);

// Tutorial Functions
function startTutorial() {
    const tutorialSteps = [
        'Welcome to the game! Let me guide you through the basics.',
        'Step 1: Select a unit by clicking on it.',
        'Step 2: Move your unit by clicking on a highlighted cell.',
        'Step 3: Attack an enemy unit by clicking on a red-highlighted cell.',
        'Step 4: End your turn by clicking the "End Turn" button.',
        'That’s it! You’re ready to play. Good luck!'
    ];

    let currentStep = 0;

    function showNextStep() {
        if (currentStep >= tutorialSteps.length) {
            document.querySelector('.tutorial-overlay').remove();
            return;
        }

        const overlay = document.querySelector('.tutorial-overlay') || document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-step">
                <p>${tutorialSteps[currentStep]}</p>
                <button onclick="showNextStep()">Next</button>
            </div>
        `;
        document.body.appendChild(overlay);
        currentStep++;
    }

    showNextStep();
}

// Add a button to start the tutorial
const tutorialButton = document.createElement('button');
tutorialButton.textContent = 'Tutorial';
tutorialButton.onclick = startTutorial;
document.body.appendChild(tutorialButton);

class ReplayManager {
    constructor() {
        this.actions = [];
    }

    recordAction(action) {
        this.actions.push(action);
    }

    playReplay() {
        let index = 0;
        const interval = setInterval(() => {
            if (index >= this.actions.length) {
                clearInterval(interval);
                return;
            }

            const action = this.actions[index];
            if (action.type === 'move') {
                action.unit.move(action.to.x, action.to.y);
            } else if (action.type === 'attack') {
                action.attacker.attack(action.target);
            }

            index++;
        }, 1000);
    }
}

const replayManager = new ReplayManager();

// Update move and attack methods to record actions for replay
Unit.prototype.move = function(x, y) {
    if (!this.canMoveTo(x, y)) return false;
    replayManager.recordAction({ type: 'move', unit: this, to: { x, y } });
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
};

Unit.prototype.attack = function(target) {
    if (!target || target.team === this.team || target.cannotBeAttacked) return false;
    replayManager.recordAction({ type: 'attack', attacker: this, target });
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
};

// Add a button to play the replay after the game ends
function showReplayButton() {
    const replayButton = document.createElement('button');
    replayButton.textContent = 'Watch Replay';
    replayButton.onclick = () => replayManager.playReplay();
    document.body.appendChild(replayButton);
}

// Call showReplayButton when the game ends
Unit.prototype.destroyUnit = function(target) {
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
        showVictoryScreen(this.team);
        showReplayButton();
    }
};

function handleTurnAction(unit, direction) {
    unit.turn(direction);
    updateUI();
}

function handleDoNothingAction(unit) {
    unit.doNothing();
    updateUI();
}

module.exports = { ReplayManager, applySettings };
