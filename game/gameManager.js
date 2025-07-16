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
        this.battlefield = null; // Will be a 9x9 grid
    }

    addArmy(playerId) {
        const army = {
            id: this.armies[playerId].length + 1,
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

// Singleton instance
const gameManager = new GameManager();
module.exports = { gameManager, GameState };
