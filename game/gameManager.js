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

    endBattle(channelId) {
        const game = this.getGame(channelId);
        if (!game || !game.battle) return { success: false, message: "No active battle found." };
        
        const battle = game.battle;
        if (battle.phase !== 'ended') return { success: false, message: "Battle is not finished yet." };
        
        // Handle battle aftermath - remove defeated army
        const loser = battle.winner === game.aggressor.id ? game.defender.id : game.aggressor.id;
        
        // Find and remove the defeated army from the loser's armies
        const loserArmies = game.armies[loser];
        const battleArmyIds = battle.armies.filter(army => army.owner === loser).map(army => army.id);
        
        // Remove defeated armies
        game.armies[loser] = loserArmies.filter(army => !battleArmyIds.includes(army.id));
        
        // Clear the battle
        game.battle = null;
        
        return { success: true, message: "Battle concluded. Defeated army has been removed." };
    }
}

class GameState {

    disbandArmy(playerId, armyId) {
        const armies = this.armies[playerId];
        if (!armies) return { success: false, message: 'No armies found for this player.' };
        const index = armies.findIndex(a => a.id === armyId);
        if (index === -1) return { success: false, message: `Army #${armyId} not found.` };
        armies.splice(index, 1);
        return { success: true, message: `Army #${armyId} has been disbanded.` };
    }
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
        this.resources = {
            [aggressor.id]: { bronze: 5, timber: 5, mounts: 5, food: 10 },
            [defender.id]: { bronze: 5, timber: 5, mounts: 5, food: 10 }
        };
        this.battle = null; // Will hold the Battle instance when one is active
        this.treaty = null; // Will hold treaty negotiations
        this.ceasefire = null; // Will hold ceasefire information
    }

    addArmy(playerId) {
        const army = {
            id: this.armies[playerId].length + 1,
            owner: playerId,
            units: [
                { type: 'infantry', count: 5 },
                { type: 'commander', count: 1 },
            ],
        };
        this.armies[playerId].push(army);
        return army;
    }

    startBattle(aggressorArmyId, defenderArmyId) {
        // Get the specified armies
        const aggressorArmy = this.getArmy(this.aggressor.id, aggressorArmyId);
        const defenderArmy = this.getArmy(this.defender.id, defenderArmyId);

        if (!aggressorArmy) {
            return { success: false, message: "Aggressor army not found." };
        }

        if (!defenderArmy) {
            return { success: false, message: "Defender army not found." };
        }

        if (this.battle) {
            return { success: false, message: "A battle is already in progress in this war." };
        }

        // Create battle with the specified armies
        const battleArmies = [aggressorArmy, defenderArmy];
        this.battle = new Battle(this.aggressor.id, this.defender.id, battleArmies);

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

    forfeitBattle(playerId) {
        if (this.phase === 'ended') {
            return { success: false, message: 'The battle has already ended.' };
        }
        let winner, loser;
        if (playerId === this.aggressorId) {
            winner = this.defenderId;
            loser = this.aggressorId;
        } else if (playerId === this.defenderId) {
            winner = this.aggressorId;
            loser = this.defenderId;
        } else {
            return { success: false, message: 'You are not a participant in this battle.' };
        }
        this.phase = 'ended';
        this.log.push({
            type: 'forfeit',
            playerId,
            message: `Player <@${playerId}> forfeited the battle. <@${winner}> is the winner!`
        });
        return { success: true, battleEnded: true, winner, message: `<@${playerId}> forfeited. <@${winner}> wins the battle!` };
    }
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
        this.log = [];
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
        this.log.push({
            type: 'place',
            playerId,
            unitType,
            x,
            y,
            orientation: orientation || 'north',
            message: `Placed ${unitType} at (${x},${y}) facing ${orientation || 'north'}.`
        });

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
            chariot: { movement: 3, hp: 1, canAttack: true, chargeBonus: true, canTrample: true },
        };
        return properties[unitType] || { movement: 0, hp: 1 };
    }

    chariotCharge(playerId, fromX, fromY, toX, toY) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };
        
        const chariot = this.board[fromY][fromX];
        if (!chariot || chariot.type !== 'chariot' || chariot.owner !== playerId) {
            return { success: false, message: "No chariot unit at the specified position." };
        }
        if (chariot.hasActed) return { success: false, message: "That chariot has already acted this turn." };
        
        // Check if path is clear for charge
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.abs(dx) + Math.abs(dy);
        
        if (distance > 3) return { success: false, message: "Chariot charge range is limited to 3 tiles." };
        if (dx !== 0 && dy !== 0) return { success: false, message: "Chariot can only charge in straight lines." };
        
        // Check path for obstacles
        const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
        const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
        
        for (let i = 1; i < distance; i++) {
            const checkX = fromX + stepX * i;
            const checkY = fromY + stepY * i;
            if (this.board[checkY][checkX]) {
                return { success: false, message: "Path is blocked. Chariot cannot charge through other units." };
            }
        }
        
        const target = this.board[toY][toX];
        if (!target || target.owner === playerId) {
            return { success: false, message: "No valid enemy target at the charge destination." };
        }
        
        // Chariot charge destroys most units instantly
        const targetProps = this.getUnitProperties(target.type);
        if (targetProps.immuneTo && targetProps.immuneTo.includes('chariot')) {
            return { success: false, message: `${target.type} is immune to chariot charges!` };
        }
        
        // Move chariot to target position and destroy target
        this.board[toY][toX] = chariot;
        this.board[fromY][fromX] = null;
        chariot.hasActed = true;
        this.log.push({
            type: 'chariot_charge',
            playerId,
            fromX,
            fromY,
            toX,
            toY,
            targetType: target.type,
            message: `Chariot charged from (${fromX},${fromY}) to (${toX},${toY}) and destroyed the enemy ${target.type}!`
        });
        return { success: true, message: `Chariot charged from (${fromX},${fromY}) to (${toX},${toY}) and destroyed the enemy ${target.type}!` };
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
        this.log.push({
            type: 'archer_fire',
            playerId,
            fromX,
            fromY,
            toX,
            toY,
            message: `Archer at (${fromX},${fromY}) fired at (${toX},${toY}) and injured the enemy!`
        });
        return { success: true, message: `Archer at (${fromX},${fromY}) fired at (${toX},${toY}) and injured the enemy!` };
    }

    moveUnit(playerId, fromX, fromY, toX, toY) {
        if (this.phase !== 'battle') return { success: false, message: "It is not the battle phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };

        const unit = this.board[fromY][fromX];
        if (!unit) return { success: false, message: "There is no unit at the specified starting position." };
        if (unit.owner !== playerId) return { success: false, message: "You do not own that unit." };
        if (unit.hasActed) return { success: false, message: "That unit has already acted this turn." };

}

    checkBattleEnd() {

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
        this.log.push({
            type: 'move',
            playerId,
            unitType: unit.type,
            fromX,
            fromY,
            toX,
            toY,
            message: `Moved ${unit.type} from (${fromX},${fromY}) to (${toX},${toY}).`
        });
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
        this.log.push({
            type: 'turn',
            playerId,
            unitType: unit.type,
            x,
            y,
            newOrientation,
            message: `Turned ${unit.type} at (${x},${y}) to face ${newOrientation}.`
        });
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
            this.log.push({
                type: 'destroy',
                x,
                y,
                message: `Unit at (${x},${y}) was destroyed during attack resolution.`
            });
            this.board[y][x] = null;
        }

        // Check for win/lose conditions
        const battleResult = this.checkBattleEnd();
        if (battleResult.ended) {
            this.phase = 'ended';
            this.log.push({
                type: 'end',
                winner: battleResult.winner,
                message: battleResult.message
            });
            return { success: true, battleEnded: true, winner: battleResult.winner, message: battleResult.message };
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
        this.log.push({
            type: 'end_turn',
            playerId,
            message: `Turn ended. Attacks resolved. It is now the other player's turn.`
        });
        return { success: true, message: `Turn ended. Attacks resolved. It is now the other player's turn.` };
    }

    getHistory() {
        return this.log;
    }
    checkBattleEnd() {
        // Check if any commander is dead
        let aggressorCommander = null;
        let defenderCommander = null;
        let aggressorUnits = 0;
        let defenderUnits = 0;

        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (!unit) continue;

                if (unit.owner === this.aggressorId) {
                    aggressorUnits++;
                    if (unit.type === 'commander') {
                        aggressorCommander = unit;
                    }
                } else if (unit.owner === this.defenderId) {
                    defenderUnits++;
                    if (unit.type === 'commander') {
                        defenderCommander = unit;
                    }
                }
            }
        }

        // Win condition 1: Commander death
        if (!aggressorCommander) {
            return { ended: true, winner: this.defenderId, message: "The aggressor's commander has fallen! The defender wins!" };
        }
        if (!defenderCommander) {
            return { ended: true, winner: this.aggressorId, message: "The defender's commander has fallen! The aggressor wins!" };
        }

        // Win condition 2: All units eliminated
        if (aggressorUnits === 0) {
            return { ended: true, winner: this.defenderId, message: "All aggressor units have been eliminated! The defender wins!" };
        }
        if (defenderUnits === 0) {
            return { ended: true, winner: this.aggressorId, message: "All defender units have been eliminated! The aggressor wins!" };
        }

        // Win condition 3: Only commanders left (stalemate -> defender wins)
        if (aggressorUnits === 1 && defenderUnits === 1 && aggressorCommander && defenderCommander) {
            return { ended: true, winner: this.defenderId, message: "Only commanders remain! The battle ends in a stalemate - the defender wins!" };
        }

        // Win condition 4: Check for movement stalemate (no units can move or attack)
        if (this.checkStalemate()) {
            return { ended: true, winner: this.defenderId, message: "The battle has reached a stalemate with no possible moves - the defender wins!" };
        }

        return { ended: false };
    }

    checkStalemate() {
        // Check if any unit can move or attack
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (!unit) continue;
                
                const props = this.getUnitProperties(unit.type);
                
                // Check if unit can move
                for (let dy = -props.movement; dy <= props.movement; dy++) {
                    for (let dx = -props.movement; dx <= props.movement; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (Math.abs(dx) + Math.abs(dy) > props.movement) continue;
                        if (props.cardinalOnly && dx !== 0 && dy !== 0) continue;
                        
                        const newX = x + dx;
                        const newY = y + dy;
                        
                        if (newX >= 0 && newX < 9 && newY >= 0 && newY < 9 && !this.board[newY][newX]) {
                            return false; // Unit can move
                        }
                    }
                }
                
                // Check if unit can attack
                if (props.canAttack) {
                    const directions = [
                        { dx: 0, dy: -1, orientation: 'north' },
                        { dx: 1, dy: 0, orientation: 'east' },
                        { dx: 0, dy: 1, orientation: 'south' },
                        { dx: -1, dy: 0, orientation: 'west' }
                    ];
                    
                    for (const dir of directions) {
                        const targetX = x + dir.dx;
                        const targetY = y + dir.dy;
                        
                        if (targetX >= 0 && targetX < 9 && targetY >= 0 && targetY < 9) {
                            const target = this.board[targetY][targetX];
                            if (target && target.owner !== unit.owner) {
                                return false; // Unit can attack
                            }
                        }
                    }
                }
                
                // Check if archer can fire
                if (unit.type === 'archer') {
                    for (let ty = 0; ty < 9; ty++) {
                        for (let tx = 0; tx < 9; tx++) {
                            const target = this.board[ty][tx];
                            if (target && target.owner !== unit.owner) {
                                const dx = Math.abs(x - tx);
                                const dy = Math.abs(y - ty);
                                if (dx + dy <= 3 && !(dx === 0 && dy === 0)) {
                                    return false; // Archer can fire
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return true; // No unit can move or attack
    }

    getBattleStatus() {
        if (this.phase === 'ended') return { phase: 'ended', message: 'Battle has concluded.' };
        
        let aggressorUnits = {};
        let defenderUnits = {};
        
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (!unit) continue;
                
                const unitCollection = unit.owner === this.aggressorId ? aggressorUnits : defenderUnits;
                unitCollection[unit.type] = (unitCollection[unit.type] || 0) + 1;
            }
        }
        
        return {
            phase: this.phase,
            currentPlayer: this.currentPlayer,
            aggressorUnits,
            defenderUnits,
            totalAggressorUnits: Object.values(aggressorUnits).reduce((a, b) => a + b, 0),
            totalDefenderUnits: Object.values(defenderUnits).reduce((a, b) => a + b, 0)
        };
    }

    startRallyPhase() {
        if (this.phase !== 'battle') return { success: false, message: "Rally phase can only be started from battle phase." };
        
        this.phase = 'rally';
        this.currentPlayer = this.aggressorId;
        
        // Reset hasActed for all units
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (unit) {
                    unit.hasActed = false;
                }
            }
        }
        
        return { success: true, message: "Rally phase has begun! Units can now recover from injuries and reposition." };
    }

    rallyUnit(playerId, x, y) {
        if (this.phase !== 'rally') return { success: false, message: "It is not the rally phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };
        
        const unit = this.board[y][x];
        if (!unit) return { success: false, message: "There is no unit at the specified position." };
        if (unit.owner !== playerId) return { success: false, message: "You do not own that unit." };
        if (unit.hasActed) return { success: false, message: "That unit has already acted this turn." };
        
        if (unit.status === 'injured') {
            unit.status = 'healthy';
            unit.hasActed = true;
            return { success: true, message: `${unit.type} at (${x},${y}) has recovered from injury!` };
        } else {
            return { success: false, message: "This unit is not injured and cannot rally." };
        }
    }

    endRallyTurn(playerId) {
        if (this.phase !== 'rally') return { success: false, message: "It is not the rally phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };
        
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
        
        return { success: true, message: "Rally turn ended. It is now the other player's turn to rally." };
    }

    endRallyPhase(playerId) {
        if (this.phase !== 'rally') return { success: false, message: "It is not the rally phase." };
        if (this.currentPlayer !== playerId) return { success: false, message: "It's not your turn." };
        
        this.phase = 'battle';
        this.currentPlayer = this.aggressorId;
        
        // Reset hasActed for all units
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (unit) {
                    unit.hasActed = false;
                }
            }
        }
        
        return { success: true, message: "Rally phase ended. Battle phase resumes!" };
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

        const orientationArrows = {
            north: '↑',
            east: '→',
            south: '↓',
            west: '←'
        };

        let boardString = '';
        for (let y = 0; y < 9; y++) {
            for (let x = 0; x < 9; x++) {
                const unit = this.board[y][x];
                if (unit) {
                    let icon = unitIcons[unit.type] || '❓';
                    // Add injury indicator
                    if (unit.status === 'injured') {
                        icon = '🩸'; // Blood drop for injured units
                    }
                    // Add orientation for commanders and shock troops
                    if (unit.type === 'commander' || unit.type === 'shock') {
                        icon += orientationArrows[unit.orientation] || '';
                    }
                    boardString += icon;
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
