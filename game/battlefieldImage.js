
const { createCanvas } = require('canvas');

/**
 * Unicode emoji for each unit type (for rendering on the battlefield image)
 * @type {Record<string, string>}
 */
const EMOJI_MAP = {
    infantry: '🛡️',
    commander: '👑',
    shock: '⚡',
    archer: '🏹',
    cavalry: '🐎',
    chariot: '🏛️',
    injured: '🩸',
};

/**
 * Arrow symbols for unit orientation
 * @type {Record<string, string>}
 */
const ORIENTATION_ARROWS = {
    north: '↑',
    east: '→',
    south: '↓',
    west: '←',
};

/**
 * Generate a PNG buffer of the battlefield, including player names and unit icons.
 * @param {Array<Array<Object|null>>} board - 2D array representing the battlefield grid.
 * @param {{aggressor?: string, defender?: string}} [playerNames={}] - Player names to display.
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateBattlefieldImage(board, playerNames = {}) {
    const CELL_SIZE = 48;
    const GRID_SIZE = 9;
    const NAME_BANNER_HEIGHT = 40;
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE + NAME_BANNER_HEIGHT;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Draw player names (top: aggressor, bottom: defender)
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(playerNames.aggressor || 'Aggressor', width / 2, 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fillText(playerNames.defender || 'Defender', width / 2, height - 32);

    // Draw grid lines
    ctx.strokeStyle = '#555';
    for (let i = 0; i <= GRID_SIZE; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, NAME_BANNER_HEIGHT);
        ctx.lineTo(i * CELL_SIZE, height - NAME_BANNER_HEIGHT);
        ctx.stroke();
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, NAME_BANNER_HEIGHT + i * CELL_SIZE);
        ctx.lineTo(width, NAME_BANNER_HEIGHT + i * CELL_SIZE);
        ctx.stroke();
    }

    // Draw units
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const unit = board[y][x];
            if (unit) {
                let icon = EMOJI_MAP[unit.type] || '❓';
                if (unit.status === 'injured') icon = EMOJI_MAP.injured;
                let display = icon;
                if (unit.type === 'commander' || unit.type === 'shock') {
                    display += ORIENTATION_ARROWS[unit.orientation] || '';
                }
                ctx.fillText(
                    display,
                    x * CELL_SIZE + CELL_SIZE / 2,
                    y * CELL_SIZE + CELL_SIZE / 2 + NAME_BANNER_HEIGHT
                );
            }
        }
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateBattlefieldImage };
