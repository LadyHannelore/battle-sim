const { applySettings } = require('../script');

describe('Settings Menu', () => {
    let originalGameState;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <div id="battlefield"></div>
            <input id="battlefield-size" value="9" />
            <input id="max-units" value="12" />
            <div id="available-units"></div>
        `;

        // Mock gameState
        global.gameState = {
            battlefield: [],
            armyLimits: { maxUnits: 12 },
            reset: jest.fn(),
            currentPlayer: 'red',
            redArmy: [],
            blueArmy: [],
            currentPhase: 'placement',
        };

        // Mock updateUI function
        global.updateUI = jest.fn();

        originalGameState = { ...global.gameState };
    });

    afterEach(() => {
        // Restore original gameState
        global.gameState = originalGameState;
    });
});
