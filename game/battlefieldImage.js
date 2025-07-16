const { createCanvas, loadImage } = require('canvas');

// Unicode emoji to PNG fallback (for better rendering)
const emojiMap = {
    infantry: '🛡️',
    commander: '👑',
    shock: '⚡',
    archer: '🏹',
    cavalry: '🐎',
    chariot: '🏛️',
    injured: '🩸',
};
const orientationArrows = {
    north: '↑',
    east: '→',
    south: '↓',
    west: '←',
};


async function generateBattlefieldImage(board, playerNames = {}) {
    const cellSize = 48;
    const width = 9 * cellSize;
    const height = 9 * cellSize + 40; // Extra space for names
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Draw player names
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(playerNames.aggressor || 'Aggressor', width / 2, 2);
    ctx.fillStyle = '#87CEEB';
    ctx.fillText(playerNames.defender || 'Defender', width / 2, height - 32);

    // Draw grid
    ctx.strokeStyle = '#555';
    for (let i = 0; i <= 9; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 40);
        ctx.lineTo(i * cellSize, height - 40);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 40 + i * cellSize / 9 * 9);
        ctx.lineTo(width, 40 + i * cellSize / 9 * 9);
        ctx.stroke();
    }

    // Draw units
    ctx.font = '32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < 9; y++) {
        for (let x = 0; x < 9; x++) {
            const unit = board[y][x];
            if (unit) {
                let icon = emojiMap[unit.type] || '❓';
                if (unit.status === 'injured') icon = emojiMap.injured;
                let display = icon;
                if (unit.type === 'commander' || unit.type === 'shock') {
                    display += orientationArrows[unit.orientation] || '';
                }
                ctx.fillText(display, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2 + 40);
            }
        }
    }

    return canvas.toBuffer('image/png');
}

module.exports = { generateBattlefieldImage };
