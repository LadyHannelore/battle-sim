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
