const { Collection } = require('discord.js');

class GameManager {
    constructor() {
        this.games = new Collection(); // Key: channelId, Value: GameState
    }

    createGame(channelId, aggressor, defender) {
        if (this.games.has(channelId)) {
            return false; // Game already exists
        }
        const newGame = new GameState(aggressor, defender);
        this.games.set(channelId, newGame);
        return newGame;
    }

    getGame(channelId) {
        return this.games.get(channelId);
    }

    endGame(channelId) {
        return this.games.delete(channelId);
    }
}

class GameState {
    constructor(aggressor, defender) {
        this.aggressor = aggressor;
        this.defender = defender;
        this.turn = 1;
        this.phase = 'placement'; // placement, battle, rally
        this.currentPlayer = aggressor.id;
        this.armies = {
            [aggressor.id]: [],
            [defender.id]: []
        };
        this.settlements = {
            [aggressor.id]: [{ x: 10, y: 18 }], // Default settlement for aggressor
            [defender.id]: [{ x: 10, y: 2 }]  // Default settlement for defender
        };
        this.map = new Collection(); // Key: "x,y", Value: army object
        this.resources = {
            [aggressor.id]: { bronze: 5, timber: 5, mounts: 5, food: 10 },
            [defender.id]: { bronze: 5, timber: 5, mounts: 5, food: 10 }
        };
        this.battle = null; // Will hold the Battle instance when one is active
        this.battlefield = null; // Will be a 9x9 grid
    }

    addArmy(playerId) {
        const army = {
            id: this.armies[playerId].length + 1,
            owner: playerId,
            units: [
                { type: 'infantry', count: 5 },
                { type: 'commander', count: 1 },
            ],
            position: null, // x, y on the main map
        };
        this.armies[playerId].push(army);
        return army;
    }

    placeArmy(playerId, armyId, x, y) {
        const army = this.getArmy(playerId, armyId);
        if (!army) return { success: false, message: "Army not found." };
        if (army.position) return { success: false, message: "This army has already been placed." };

        const playerSettlements = this.settlements[playerId];
        const isNearSettlement = playerSettlements.some(s => Math.abs(s.x - x) <= 1 && Math.abs(s.y - y) <= 1);

        if (!isNearSettlement) {
            return { success: false, message: "You must place armies on or adjacent to one of your settlements." };
        }

        const mapKey = `${x},${y}`;
        if (this.map.has(mapKey)) {
            // Allow up to 2 armies on the same tile
            const armiesOnTile = this.map.get(mapKey);
            if (armiesOnTile.length >= 2) {
                return { success: false, message: "A tile cannot hold more than two armies." };
            }
            armiesOnTile.push(army);
        } else {
            this.map.set(mapKey, [army]);
        }

        army.position = { x, y };
        return { success: true, message: `Army #${army.id} placed at (${x}, ${y}).` };
    }

    moveArmy(playerId, armyId, newX, newY) {
        const army = this.getArmy(playerId, armyId);
        if (!army) return { success: false, message: "Army not found." };
        if (!army.position) return { success: false, message: "This army has not been placed on the map yet." };

        const { x: oldX, y: oldY } = army.position;
        const distance = Math.abs(oldX - newX) + Math.abs(oldY - newY); // Manhattan distance

        if (distance === 0) return { success: false, message: "The army is already at that position." };
        if (distance > 3) return { success: false, message: `You can only move up to 3 tiles. Distance to (${newX}, ${newY}) is ${distance} tiles.` };

        // Check resource cost for moving outside expansion range
        const playerSettlements = this.settlements[playerId];
        const isInExpansionRange = playerSettlements.some(s => Math.abs(s.x - newX) <= 3 && Math.abs(s.y - newY) <= 3);

        if (!isInExpansionRange) {
            if (this.resources[playerId].food < 1) {
                return { success: false, message: "You need at least 1 food to move an army outside your expansion range." };
            }
            this.resources[playerId].food -= 1;
        }

        // Update map
        const oldMapKey = `${oldX},${oldY}`;
        const armiesOnOldTile = this.map.get(oldMapKey).filter(a => a.id !== armyId || a.owner !== playerId); // A bit complex if IDs aren't unique across players
        if (armiesOnOldTile.length > 0) {
            this.map.set(oldMapKey, armiesOnOldTile);
        } else {
            this.map.delete(oldMapKey);
        }

        const newMapKey = `${newX},${newY}`;
        if (this.map.has(newMapKey)) {
            const armiesOnNewTile = this.map.get(newMapKey);
            if (armiesOnNewTile.length >= 2) {
                // Move failed, revert map change
                if (this.map.has(oldMapKey)) this.map.get(oldMapKey).push(army);
                else this.map.set(oldMapKey, [army]);
                return { success: false, message: "A tile cannot hold more than two armies." };
            }
            armiesOnNewTile.push(army);
        } else {
            this.map.set(newMapKey, [army]);
        }

        army.position = { x: newX, y: newY };
        let replyMessage = `Army #${army.id} moved from (${oldX}, ${oldY}) to (${newX}, ${newY}).`;
        if (!isInExpansionRange) {
            replyMessage += " 1 food was consumed.";
        }
        return { success: true, message: replyMessage };
    }

    startBattle(tileX, tileY) {
        const mapKey = `${tileX},${tileY}`;
        const armiesOnTile = this.map.get(mapKey);

        if (!armiesOnTile || armiesOnTile.length < 2) {
            return { success: false, message: "There are not enough armies on this tile to start a battle." };
        }

        const aggressorArmy = armiesOnTile.find(a => a.owner === this.aggressor.id);
        const defenderArmy = armiesOnTile.find(a => a.owner === this.defender.id);

        if (!aggressorArmy || !defenderArmy) {
            return { success: false, message: "Both an aggressor and a defender army must be on the tile to start a battle." };
        }

        if (this.battle) {
            return { success: false, message: "A battle is already in progress in this war." };
        }

        const allArmies = armiesOnTile.filter(a => a.owner === this.aggressor.id || a.owner === this.defender.id);
        this.battle = new Battle(this.aggressor.id, this.defender.id, allArmies);

        return { success: true, message: "Battle initiated! The placement phase begins.", battle: this.battle };
    }

    modifyArmy(playerId, armyId, modification) {
        const army = this.getArmy(playerId, armyId);
        if (!army) return { success: false, message: "Army not found." };

        const playerResources = this.resources[playerId];
        let cost = {};
        let newUnits = [];

        switch (modification) {
            case 'shock':
                cost = { bronze: 1 };
                newUnits = [{ type: 'shock', count: 3 }];
                break;
            case 'archer':
                cost = { timber: 1 };
                newUnits = [{ type: 'archer', count: 3 }];
                break;
            case 'cavalry':
                cost = { mounts: 1 };
                newUnits = [{ type: 'cavalry', count: 4 }];
                break;
            case 'chariot':
                cost = { mounts: 1 };
                newUnits = [{ type: 'chariot', count: 2 }];
                break;
            default:
                return { success: false, message: "Invalid modification." };
        }

        // Check resources
        for (const resource in cost) {
            if (playerResources[resource] < cost[resource]) {
                return { success: false, message: `Not enough ${resource}. Required: ${cost[resource]}, You have: ${playerResources[resource]}.` };
            }
        }

        // Deduct resources
        for (const resource in cost) {
            playerResources[resource] -= cost[resource];
        }

        // Add units
        for (const newUnit of newUnits) {
            const existingUnit = army.units.find(u => u.type === newUnit.type);
            if (existingUnit) {
                existingUnit.count += newUnit.count;
            } else {
                army.units.push(newUnit);
            }
        }

        return { success: true, message: `Army #${armyId} successfully modified with ${newUnits.map(u => `${u.count} ${u.type}`).join(', ')}.` };
    }

    getArmy(playerId, armyId) {
        return this.armies[playerId].find(a => a.id === armyId);
    }
}

class Battle {
    constructor(aggressorId, defenderId, armies) {
        this.aggressorId = aggressorId;
        this.defenderId = defenderId;
        this.armies = armies;
        this.board = Array(9).fill(null).map(() => Array(9).fill(null));
        this.phase = 'placement'; // placement, battle, rally
        this.currentPlayer = aggressorId;
        this.placedUnits = {
            [aggressorId]: [],
            [defenderId]: []
        };
        this.totalUnitCount = this.countTotalUnits();
    }

    countTotalUnits() {
        return this.armies.reduce((total, army) => {
            return total + army.units.reduce((subTotal, unit) => subTotal + unit.count, 0);
        }, 0);
    }

    placeUnit(playerId, unitType, x, y, orientation) {
        if (this.phase !== 'placement') {
            return { success: false, message: "It is not the placement phase." };
        }
        if (this.currentPlayer !== playerId) {
            return { success: false, message: "It's not your turn to place units." };
        }

        const isAggressor = playerId === this.aggressorId;
        const validY = isAggressor ? (y >= 7 && y <= 8) : (y >= 0 && y <= 1);
        if (!validY || x < 0 || x > 8) {
            return { success: false, message: `You can only place units in your deployment zone. Your zone is y: ${isAggressor ? '7-8' : '0-1'}.` };
        }

        if (this.board[y][x]) {
            return { success: false, message: "This tile is already occupied." };
        }

        const playerArmies = this.armies.filter(a => a.owner === playerId);
        let unitSource = null;
        for (const army of playerArmies) {
            const unitInArmy = army.units.find(u => u.type === unitType && u.count > 0);
            if (unitInArmy) {
                unitSource = unitInArmy;
                break;
            }
        }

        if (!unitSource) {
            return { success: false, message: `You do not have any available ${unitType} units to place.` };
        }

        unitSource.count--;
        this.board[y][x] = {
            type: unitType,
            owner: playerId,
            orientation: orientation || 'north',
            hasActed: false
        };
        this.placedUnits[playerId].push({ type: unitType, x, y });

        const totalPlaced = this.placedUnits[this.aggressorId].length + this.placedUnits[this.defenderId].length;
        if (totalPlaced >= this.totalUnitCount) {
            this.phase = 'battle';
            this.currentPlayer = this.aggressorId;
            return { success: true, phase: 'battle', message: `Placed ${unitType} at (${x},${y}). All units have been placed! The battle phase begins. It is now the aggressor's turn.` };
        }

        this.currentPlayer = (this.currentPlayer === this.aggressorId) ? this.defenderId : this.aggressorId;
        return { success: true, phase: 'placement', message: `Placed ${unitType} at (${x},${y}). It is now the other player's turn to place a unit.` };
    }

    getUnitProperties(unitType) {
        const properties = {
            infantry: { movement: 1, hp: 1, canAttack: true },
            shock: { movement: 1, hp: 1, canAttack: true, immuneTo: ['infantry', 'cavalry', 'commander'] },
            archer: { movement: 1, cardinalOnly: true, hp: 1, canAttack: false, range: 3 },
            commander: { movement: 1, hp: 1, canAttack: true, immuneTo: ['infantry', 'cavalry'] },
            cavalry: { movement: 3, hp: 1, canAttack: true },
            chariot: { movement: 3, hp: 1, canAttack: true },
        };
        return properties[unitType] || { movement: 0, hp: 1 };
    }

    archerFire(playerId, fromX, fromY, toX, toY) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };
        const archer = this.board[fromY][fromX];
        if (!archer || archer.type !== 'archer' || archer.owner !== playerId) return { success: false, message: "No archer unit at the specified position." };
        if (archer.hasActed) return { success: false, message: "That archer has already acted this turn." };
        const dx = Math.abs(fromX - toX);
        const dy = Math.abs(fromY - toY);
        if (dx + dy > 3 || (dx === 0 && dy === 0)) return { success: false, message: "Target is out of range (archer range is 3)." };
        const target = this.board[toY][toX];
        if (!target || target.owner === playerId) return { success: false, message: "No valid enemy unit at the target position." };
        // Apply injury
        target.status = 'injured';
        archer.hasActed = true;
        return { success: true, message: `Archer at (${fromX},${fromY}) fired at (${toX},${toY}) and injured the enemy!` };
    }

    moveUnit(playerId, fromX, fromY, toX, toY) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };

        const unit = this.board[fromY][fromX];
        if (!unit) return { success: false, message: "There is no unit at the specified starting position." };
        if (unit.owner !== playerId) return { success: false, message: "You do not own that unit." };
        if (unit.hasActed) return { success: false, message: "That unit has already acted this turn." };

        if (this.board[toY][toX]) return { success: false, message: "The destination tile is occupied." };

        const props = this.getUnitProperties(unit.type);
        const distance = Math.abs(fromX - toX) + Math.abs(fromY - toY);

        if (props.cardinalOnly && (fromX !== toX && fromY !== toY)) {
            return { success: false, message: `${unit.type} can only move in cardinal directions (not diagonally).` };
        }
        if (distance > props.movement) {
            return { success: false, message: `${unit.type} can only move ${props.movement} tile(s). You tried to move ${distance}.` };
        }

        this.board[toY][toX] = unit;
        this.board[fromY][fromX] = null;
        unit.hasActed = true;

        return { success: true, message: `Moved ${unit.type} from (${fromX},${fromY}) to (${toX},${toY}).` };
    }

    turnUnit(playerId, x, y, newOrientation) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };

        const unit = this.board[y][x];
        if (!unit) return { success: false, message: "There is no unit at the specified position." };
        if (unit.owner !== playerId) return { success: false, message: "You do not own that unit." };
        if (unit.hasActed) return { success: false, message: "That unit has already acted this turn." };

        unit.orientation = newOrientation;
        unit.hasActed = true;

        return { success: true, message: `Turned ${unit.type} at (${x},${y}) to face ${newOrientation}.` };
    }

    endTurn(playerId) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };

        // Resolve attacks: for each unit, if an enemy is in front, attack
        const toRemove = [];
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (!unit || !this.getUnitProperties(unit.type).canAttack) continue;
                // Find the tile in front based on orientation
                let tx = x, ty = y;
                if (unit.orientation === 'north') ty--;
                else if (unit.orientation === 'south') ty++;
                else if (unit.orientation === 'east') tx++;
                else if (unit.orientation === 'west') tx--;
                if (tx < 0 || tx > 8 || ty < 0 || ty > 8) continue;
                const target = this.board[ty][tx];
                if (!target || target.owner === unit.owner) continue;
                // Simple rule: if not immune, destroy target
                const props = this.getUnitProperties(target.type);
                if (props.immuneTo && props.immuneTo.includes(unit.type)) {
                    // If already injured, destroy; else, injure
                    if (target.status === 'injured') toRemove.push([tx, ty]);
                    else target.status = 'injured';
                } else {
                    toRemove.push([tx, ty]);
                }
            }
        }
        // Remove destroyed units
        for (const [x, y] of toRemove) {
            this.board[y][x] = null;
        }

        this.currentPlayer = (this.currentPlayer === this.aggressorId) ? this.defenderId : this.aggressorId;
        // Reset hasActed for the new player's units
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (unit && unit.owner === this.currentPlayer) {
                    unit.hasActed = false;
                }
            }
        }
        return { success: true, message: `Turn ended. Attacks resolved. It is now the other player's turn.` };
    }

    renderBoard() {
        const emptySquare = '⬛';
        const unitIcons = {
            infantry: '🛡️',
            commander: '👑',
            shock: '⚡',
            archer: '🏹',
            cavalry: '🐎',
            chariot: '🏛️',
        };

        let boardString = '';
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (unit) {
                    boardString += unitIcons[unit.type] || '❓';
                } else {
                    boardString += emptySquare;
                }
            }
            boardString += '\n';
        }
        return boardString;
    }
}

// Singleton instance
const gameManager = new GameManager();
module.exports = { gameManager, GameState };
