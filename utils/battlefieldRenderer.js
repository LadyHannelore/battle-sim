const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class BattlefieldRenderer {
    constructor() {
        this.tileSize = 64;
        this.boardSize = 9;
        this.canvasWidth = this.boardSize * this.tileSize;
        this.canvasHeight = this.boardSize * this.tileSize;
        
        // Unit colors
        this.unitColors = {
            infantry: '#4A90E2',    // Blue
            commander: '#F5A623',   // Gold
            shock: '#BD10E0',       // Purple
            archer: '#50E3C2',      // Teal
            cavalry: '#B8E986',     // Light Green
            chariot: '#D0021B'      // Red
        };
        
        // Orientation arrows
        this.orientationArrows = {
            north: '↑',
            east: '→',
            south: '↓',
            west: '←'
        };
    }

    async generateBattlefieldImage(battle, turn = 0) {
        const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
        const ctx = canvas.getContext('2d');
        
        // Clear canvas with background
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
        
        // Draw grid
        this.drawGrid(ctx);
        
        // Draw deployment zones
        this.drawDeploymentZones(ctx);
        
        // Draw units
        this.drawUnits(ctx, battle.board);
        
        // Draw battle info
        this.drawBattleInfo(ctx, battle, turn);
        
        // Convert to buffer
        const buffer = canvas.toBuffer('image/png');
        
        // Save to temporary file
        const fileName = `battlefield_${Date.now()}.png`;
        const filePath = path.join(__dirname, '..', 'temp', fileName);
        
        // Ensure temp directory exists
        const tempDir = path.dirname(filePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, buffer);
        
        return {
            buffer: buffer,
            filePath: filePath,
            fileName: fileName
        };
    }

    drawGrid(ctx) {
        ctx.strokeStyle = '#34495E';
        ctx.lineWidth = 2;
        
        // Draw vertical lines
        for (let x = 0; x <= this.boardSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileSize, 0);
            ctx.lineTo(x * this.tileSize, this.canvasHeight);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= this.boardSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileSize);
            ctx.lineTo(this.canvasWidth, y * this.tileSize);
            ctx.stroke();
        }
    }

    drawDeploymentZones(ctx) {
        // Defender zone (top - y: 0-1)
        ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
        ctx.fillRect(0, 0, this.canvasWidth, 2 * this.tileSize);
        
        // Aggressor zone (bottom - y: 7-8)
        ctx.fillStyle = 'rgba(231, 76, 60, 0.2)';
        ctx.fillRect(0, 7 * this.tileSize, this.canvasWidth, 2 * this.tileSize);
        
        // Zone labels
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        
        ctx.fillText('DEFENDER ZONE', this.canvasWidth / 2, 20);
        ctx.fillText('AGGRESSOR ZONE', this.canvasWidth / 2, this.canvasHeight - 10);
    }

    drawUnits(ctx, board) {
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const unit = board[y][x];
                if (unit) {
                    this.drawUnit(ctx, unit, x, y);
                }
            }
        }
    }

    drawUnit(ctx, unit, x, y) {
        const centerX = x * this.tileSize + this.tileSize / 2;
        const centerY = y * this.tileSize + this.tileSize / 2;
        
        // Draw unit circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.tileSize / 3, 0, 2 * Math.PI);
        
        // Color based on unit type
        ctx.fillStyle = this.unitColors[unit.type] || '#95A5A6';
        ctx.fill();
        
        // Border color based on owner
        ctx.strokeStyle = unit.owner ? '#E74C3C' : '#3498DB'; // Red for aggressor, Blue for defender
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw unit type icon/text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Unit type abbreviation
        const unitAbbrev = {
            infantry: 'INF',
            commander: 'CMD',
            shock: 'SHK',
            archer: 'ARC',
            cavalry: 'CAV',
            chariot: 'CHR'
        };
        
        ctx.fillText(unitAbbrev[unit.type] || unit.type.substring(0, 3).toUpperCase(), centerX, centerY - 5);
        
        // Draw orientation arrow
        if (unit.orientation) {
            ctx.font = 'bold 16px Arial';
            ctx.fillText(this.orientationArrows[unit.orientation], centerX, centerY + 10);
        }
        
        // Draw injury indicator
        if (unit.status === 'injured') {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.arc(centerX + this.tileSize / 4, centerY - this.tileSize / 4, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 10px Arial';
            ctx.fillText('!', centerX + this.tileSize / 4, centerY - this.tileSize / 4);
        }
        
        // Draw "has acted" indicator
        if (unit.hasActed) {
            ctx.fillStyle = 'rgba(149, 165, 166, 0.7)';
            ctx.beginPath();
            ctx.arc(centerX, centerY, this.tileSize / 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    drawBattleInfo(ctx, battle, turn) {
        // Semi-transparent background for info
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, this.canvasHeight - 80, this.canvasWidth, 80);
        
        // Battle info text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        
        let infoText = `Turn: ${turn} | Phase: ${battle.phase.toUpperCase()}`;
        if (battle.phase === 'battle') {
            infoText += ` | Current Player: ${battle.currentPlayer}`;
        }
        
        ctx.fillText(infoText, 10, this.canvasHeight - 50);
        
        // Unit counts
        const status = battle.getBattleStatus();
        const aggressorCount = status.totalAggressorUnits || 0;
        const defenderCount = status.totalDefenderUnits || 0;
        
        ctx.font = '14px Arial';
        ctx.fillStyle = '#E74C3C';
        ctx.fillText(`Aggressor: ${aggressorCount} units`, 10, this.canvasHeight - 30);
        
        ctx.fillStyle = '#3498DB';
        ctx.fillText(`Defender: ${defenderCount} units`, 200, this.canvasHeight - 30);
        
        // Legend
        ctx.fillStyle = '#ECF0F1';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('🔴 Aggressor | 🔵 Defender | ⚠️ Injured | 🔒 Acted', this.canvasWidth - 10, this.canvasHeight - 10);
    }
}

module.exports = BattlefieldRenderer;
