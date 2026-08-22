/**
 * Block Blast - Canvas Renderer
 * Implements Saturated Color System, Pseudo-3D Bevel Highlights & Shadows,
 * Deep Slate Navy Background (#121826) and 6px-8px tactile rounded corners.
 */

export class GameRenderer {
    constructor(canvas, gameState, particleSystem) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = gameState;
        this.particles = particleSystem;

        // Interaction state
        this.selectedShapeIdx = -1;
        this.draggingShapeIdx = -1;
        this.dragPointer = { x: 0, y: 0 };
        this.dragOffset = { x: 0, y: 0 };
        this.hoverGridCell = null; // { row, col }
        this.aiHint = null; // { shapeIdx, row, col }
        this.aiThinking = false;

        // Visual Design System & Palettes
        this.currentTheme = 'neon-dark';
        this.themes = {
            'neon-dark': {
                name: 'Deep Slate Navy (Default)',
                bg: '#121826',
                boardBg: '#1E293B',
                cellEmpty: '#1E293B',
                cellEmptyBorder: '#0F172A',
                cellEmptyInner: '#182232',
                dockBg: '#1E293B',
                dockBorder: '#334155',
                gridLines: '#0F172A',
                hintGlow: '#FFCC00',
                validGhost: 'rgba(255, 255, 255, 0.45)',
                invalidGhost: 'rgba(255, 59, 48, 0.45)'
            },
            'cyber-midnight': {
                name: 'Cyber Midnight',
                bg: '#0A0E17',
                boardBg: '#111827',
                cellEmpty: '#1A2333',
                cellEmptyBorder: '#0B0F19',
                cellEmptyInner: '#141C2B',
                dockBg: '#111827',
                dockBorder: '#374151',
                gridLines: '#0B0F19',
                hintGlow: '#34C759',
                validGhost: 'rgba(0, 122, 255, 0.45)',
                invalidGhost: 'rgba(255, 59, 48, 0.45)'
            },
            'sunset-blast': {
                name: 'Sunset Blast',
                bg: '#1A1028',
                boardBg: '#2D1B4E',
                cellEmpty: '#3D2564',
                cellEmptyBorder: '#1A1028',
                cellEmptyInner: '#321D53',
                dockBg: '#2D1B4E',
                dockBorder: '#5B3B92',
                gridLines: '#181028',
                hintGlow: '#FFD700',
                validGhost: 'rgba(175, 82, 222, 0.45)',
                invalidGhost: 'rgba(255, 59, 48, 0.45)'
            },
            'classic-pastel': {
                name: 'Light Studio',
                bg: '#F1F5F9',
                boardBg: '#FFFFFF',
                cellEmpty: '#E2E8F0',
                cellEmptyBorder: '#CBD5E1',
                cellEmptyInner: '#E9EEF4',
                dockBg: '#FFFFFF',
                dockBorder: '#E2E8F0',
                gridLines: '#CBD5E1',
                hintGlow: '#FF9500',
                validGhost: 'rgba(0, 122, 255, 0.4)',
                invalidGhost: 'rgba(255, 59, 48, 0.4)'
            }
        };

        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.boardMetrics = {
            x: 0,
            y: 0,
            size: 0,
            cellSize: 0,
            gap: 4
        };
        this.dockMetrics = {
            slots: []
        };

        this.pulsePhase = 0;
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
        }
    }

    getTheme() {
        return this.themes[this.currentTheme] || this.themes['neon-dark'];
    }

    resize(containerWidth, containerHeight) {
        this.dpr = window.devicePixelRatio || 1;
        this.width = containerWidth;
        this.height = containerHeight;

        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.computeLayout();
    }

    computeLayout() {
        const isMobile = this.width < 640;
        const padding = isMobile ? 12 : 24;

        const dockHeight = Math.min(160, Math.max(100, this.height * 0.22));
        const maxBoardWidth = this.width - padding * 2;
        const maxBoardHeight = this.height - dockHeight - padding * 3;

        const boardSize = Math.min(maxBoardWidth, maxBoardHeight, 520);
        const boardX = (this.width - boardSize) / 2;
        const boardY = padding;

        const gap = Math.max(3, Math.round(boardSize / 90));
        const cellSize = (boardSize - (gap * 9)) / 8;

        this.boardMetrics = {
            x: boardX,
            y: boardY,
            size: boardSize,
            cellSize,
            gap
        };

        const dockY = boardY + boardSize + (padding * 0.8);
        const dockWidth = boardSize;
        const slotGap = 12;
        const slotWidth = (dockWidth - slotGap * 2) / 3;
        const slotHeight = Math.min(dockHeight, 140);

        this.dockMetrics.slots = [];
        for (let i = 0; i < 3; i++) {
            const slotX = boardX + i * (slotWidth + slotGap);
            this.dockMetrics.slots.push({
                index: i,
                x: slotX,
                y: dockY,
                width: slotWidth,
                height: slotHeight
            });
        }
    }

    screenToGrid(x, y) {
        const { x: bx, y: by, cellSize, gap } = this.boardMetrics;
        if (x < bx || x > bx + this.boardMetrics.size || y < by || y > by + this.boardMetrics.size) {
            return null;
        }

        const col = Math.floor((x - bx - gap) / (cellSize + gap));
        const row = Math.floor((y - by - gap) / (cellSize + gap));

        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            return { row, col };
        }
        return null;
    }

    getCellRect(row, col) {
        const { x: bx, y: by, cellSize, gap } = this.boardMetrics;
        const x = bx + gap + col * (cellSize + gap);
        const y = by + gap + row * (cellSize + gap);
        return { x, y, size: cellSize };
    }

    getShapeSlotAt(x, y) {
        for (const slot of this.dockMetrics.slots) {
            if (x >= slot.x && x <= slot.x + slot.width && y >= slot.y && y <= slot.y + slot.height) {
                return slot.index;
            }
        }
        return -1;
    }

    render(dt = 16) {
        this.pulsePhase += dt * 0.004;

        this.ctx.save();
        this.ctx.scale(this.dpr, this.dpr);

        const shake = this.particles.getShakeOffset();
        this.ctx.translate(shake.x, shake.y);

        const theme = this.getTheme();

        // Clear canvas with background shade
        this.ctx.clearRect(-20, -20, this.width + 40, this.height + 40);

        // 1. Draw 8x8 Board Container & Empty Grid Cells
        this.drawBoard(theme);

        // 2. Draw Filled Grid Blocks
        this.drawGridBlocks(theme);

        // 3. Draw AI Hint Golden Highlight if active
        this.drawAiHintHighlight(theme);

        // 4. Draw Ghost Placement Preview
        this.drawGhostPreview(theme);

        // 5. Draw Particle Bursts & Floating Texts
        this.particles.render(this.ctx);

        // 6. Draw Shape Dock Slots & Available Pieces
        this.drawDock(theme);

        // 7. Draw Currently Dragged Shape under cursor/touch
        this.drawDraggingShape(theme);

        // 8. Draw AI Thinking Banner if active
        if (this.aiThinking) {
            this.drawAiThinkingBanner(theme);
        }

        this.ctx.restore();
    }

    drawBoard(theme) {
        const { x, y, size, cellSize, gap } = this.boardMetrics;
        const ctx = this.ctx;
        const cornerRadius = Math.max(6, Math.min(8, cellSize * 0.16));

        // Outer board container
        ctx.save();
        ctx.fillStyle = theme.boardBg;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetY = 8;

        this.roundRect(x - gap, y - gap, size + gap * 2, size + gap * 2, 18);
        ctx.fill();
        ctx.restore();

        // Unoccupied Grid Cells (Muted #1E293B with dark border outlines)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cellX = x + gap + c * (cellSize + gap);
                const cellY = y + gap + r * (cellSize + gap);

                ctx.save();
                // Dark outer border
                ctx.fillStyle = theme.cellEmptyBorder || '#0F172A';
                this.roundRect(cellX - 1, cellY - 1, cellSize + 2, cellSize + 2, cornerRadius + 1);
                ctx.fill();

                // Inner slot base
                ctx.fillStyle = theme.cellEmpty;
                this.roundRect(cellX, cellY, cellSize, cellSize, cornerRadius);
                ctx.fill();

                // Subtle inner shadow depth
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                this.roundRect(cellX + 1, cellY + 1, cellSize - 2, cellSize - 2, cornerRadius);
                ctx.fill();

                ctx.fillStyle = theme.cellEmptyInner || '#1A2333';
                this.roundRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, Math.max(3, cornerRadius - 2));
                ctx.fill();

                ctx.restore();
            }
        }
    }

    drawGridBlocks(theme) {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = this.gameState.grid[r][c];
                if (cell && cell.color) {
                    const rect = this.getCellRect(r, c);
                    this.drawBeveledBlock(rect.x, rect.y, rect.size, cell.color);
                }
            }
        }
    }

    drawGhostPreview(theme) {
        const activeIdx = this.draggingShapeIdx !== -1 ? this.draggingShapeIdx : this.selectedShapeIdx;
        if (activeIdx === -1) return;

        const shape = this.gameState.currentShapes[activeIdx];
        if (!shape || !shape.form) return;

        let targetRow = null;
        let targetCol = null;

        if (this.draggingShapeIdx !== -1) {
            const { cellSize, gap, x: bx, y: by } = this.boardMetrics;
            const shapePixelW = shape.cols * (cellSize + gap);
            const shapePixelH = shape.rows * (cellSize + gap);

            const originX = this.dragPointer.x - shapePixelW / 2;
            const originY = this.dragPointer.y - shapePixelH / 2;

            const col = Math.round((originX - bx - gap) / (cellSize + gap));
            const row = Math.round((originY - by - gap) / (cellSize + gap));

            targetRow = Math.max(0, Math.min(8 - shape.rows, row));
            targetCol = Math.max(0, Math.min(8 - shape.cols, col));
        } else if (this.hoverGridCell) {
            targetRow = this.hoverGridCell.row;
            targetCol = this.hoverGridCell.col;
            targetRow = Math.max(0, Math.min(8 - shape.rows, targetRow - Math.floor(shape.rows / 2)));
            targetCol = Math.max(0, Math.min(8 - shape.cols, targetCol - Math.floor(shape.cols / 2)));
        }

        if (targetRow === null || targetCol === null) return;

        const isValid = this.gameState.canPlaceShape(shape, targetRow, targetCol);
        const { cellSize } = this.boardMetrics;

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const rect = this.getCellRect(targetRow + r, targetCol + c);
                    this.ctx.save();
                    this.ctx.globalAlpha = isValid ? 0.7 : 0.45;

                    if (isValid) {
                        this.drawBeveledBlock(rect.x, rect.y, rect.size, shape.color, true);
                    } else {
                        this.ctx.fillStyle = '#FF3B30';
                        this.roundRect(rect.x, rect.y, rect.size, rect.size, 7);
                        this.ctx.fill();
                    }
                    this.ctx.restore();
                }
            }
        }

        if (isValid) {
            this.highlightPotentialLines(shape, targetRow, targetCol);
        }
    }

    highlightPotentialLines(shape, row, col) {
        const temp = this.gameState.grid.map(r => [...r]);
        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) temp[row + r][col + c] = 1;
            }
        }

        const rowsToClear = [];
        const colsToClear = [];
        for (let r = 0; r < 8; r++) {
            if (temp[r].every(c => c !== 0)) rowsToClear.push(r);
        }
        for (let c = 0; c < 8; c++) {
            let full = true;
            for (let r = 0; r < 8; r++) {
                if (temp[r][c] === 0) { full = false; break; }
            }
            if (full) colsToClear.push(c);
        }

        if (rowsToClear.length > 0 || colsToClear.length > 0) {
            const ctx = this.ctx;
            const { x: bx, y: by, size, cellSize, gap } = this.boardMetrics;
            const glowAlpha = 0.35 + Math.sin(this.pulsePhase * 3.5) * 0.15;

            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;

            for (const r of rowsToClear) {
                const y = by + gap + r * (cellSize + gap);
                this.roundRect(bx + gap, y, size - gap * 2, cellSize, 7);
                ctx.fill();
            }
            for (const c of colsToClear) {
                const x = bx + gap + c * (cellSize + gap);
                this.roundRect(x, by + gap, cellSize, size - gap * 2, 7);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    drawAiHintHighlight(theme) {
        if (!this.aiHint) return;
        const { shapeIdx, row, col } = this.aiHint;
        const shape = this.gameState.currentShapes[shapeIdx];
        if (!shape || !shape.form) return;

        const ctx = this.ctx;
        const pulse = 0.6 + Math.sin(this.pulsePhase * 4.5) * 0.35;
        const goldColor = `rgba(255, 204, 0, ${pulse})`;

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const rect = this.getCellRect(row + r, col + c);
                    ctx.save();
                    ctx.strokeStyle = goldColor;
                    ctx.lineWidth = 3.5;
                    ctx.shadowColor = '#FFCC00';
                    ctx.shadowBlur = 12;
                    this.roundRect(rect.x - 1, rect.y - 1, rect.size + 2, rect.size + 2, 7);
                    ctx.stroke();
                    ctx.restore();
                }
            }
        }
    }

    drawDock(theme) {
        const ctx = this.ctx;
        const keys = ['E', 'R', 'T'];

        for (let i = 0; i < 3; i++) {
            const slot = this.dockMetrics.slots[i];
            if (!slot) continue;

            const isSelected = this.selectedShapeIdx === i;
            const isDragging = this.draggingShapeIdx === i;
            const isHinted = this.aiHint && this.aiHint.shapeIdx === i;
            const shape = this.gameState.currentShapes[i];

            // Slot Background Card
            ctx.save();
            ctx.fillStyle = theme.dockBg;
            ctx.strokeStyle = isSelected ? '#007AFF' : (isHinted ? '#FFCC00' : theme.dockBorder);
            ctx.lineWidth = (isSelected || isHinted) ? 3 : 1;

            if (isSelected || isHinted) {
                ctx.shadowColor = isSelected ? 'rgba(0, 122, 255, 0.5)' : 'rgba(255, 204, 0, 0.6)';
                ctx.shadowBlur = 14;
            }

            this.roundRect(slot.x, slot.y, slot.width, slot.height, 14);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Shortcut key label (E, R, T)
            ctx.save();
            ctx.font = '700 11px Outfit, Inter, sans-serif';
            ctx.fillStyle = isSelected ? '#007AFF' : 'rgba(148, 163, 184, 0.7)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(keys[i], slot.x + 8, slot.y + 6);
            ctx.restore();

            // Shape Render in Dock
            if (shape && shape.form && !isDragging) {
                const canFitAnywhere = this.checkShapeCanFit(shape);

                ctx.save();
                if (!canFitAnywhere) {
                    ctx.globalAlpha = 0.45;
                }

                const maxDim = Math.max(shape.rows, shape.cols, 3);
                const miniBlockSize = Math.min((slot.width - 24) / maxDim, (slot.height - 28) / maxDim, 26);
                const shapePixelW = shape.cols * miniBlockSize;
                const shapePixelH = shape.rows * miniBlockSize;

                const startX = slot.x + (slot.width - shapePixelW) / 2;
                const startY = slot.y + (slot.height - shapePixelH) / 2 + 3;

                for (let r = 0; r < shape.rows; r++) {
                    for (let c = 0; c < shape.cols; c++) {
                        if (shape.form[r][c]) {
                            const bx = startX + c * miniBlockSize;
                            const by = startY + r * miniBlockSize;
                            this.drawBeveledBlock(bx, by, miniBlockSize, shape.color);
                        }
                    }
                }

                ctx.restore();
            }
        }
    }

    checkShapeCanFit(shape) {
        for (let r = 0; r <= 8 - shape.rows; r++) {
            for (let c = 0; c <= 8 - shape.cols; c++) {
                if (this.gameState.canPlaceShape(shape, r, c)) return true;
            }
        }
        return false;
    }

    drawDraggingShape(theme) {
        if (this.draggingShapeIdx === -1) return;
        const shape = this.gameState.currentShapes[this.draggingShapeIdx];
        if (!shape || !shape.form) return;

        const { cellSize, gap } = this.boardMetrics;
        const blockSize = cellSize;
        const shapePixelW = shape.cols * (blockSize + gap) - gap;
        const shapePixelH = shape.rows * (blockSize + gap) - gap;

        const startX = this.dragPointer.x - shapePixelW / 2;
        const startY = this.dragPointer.y - shapePixelH / 2 - this.dragOffset.y;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 12;

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const x = startX + c * (blockSize + gap);
                    const y = startY + r * (blockSize + gap);
                    this.drawBeveledBlock(x, y, blockSize, shape.color);
                }
            }
        }
        this.ctx.restore();
    }

    /**
     * Render a gorgeous 3D beveled glossy block tile
     */
    drawBeveledBlock(x, y, size, color, isGhost = false) {
        const ctx = this.ctx;
        const radius = Math.max(4, size * 0.16);
        const hex = color.hex || '#3B82F6';
        const light = color.light || '#93C5FD';
        const dark = color.dark || '#1D4ED8';

        ctx.save();

        // 1. Base Gradient Fill
        const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
        bgGrad.addColorStop(0, light);
        bgGrad.addColorStop(0.65, hex);
        bgGrad.addColorStop(1, dark);

        ctx.fillStyle = bgGrad;
        this.roundRect(x, y, size, size, radius);
        ctx.fill();

        // 2. Beveled top/left highlight
        const bevelSize = Math.max(2, size * 0.12);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size - bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + size - radius);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
        ctx.restore();

        // 3. Inner glossy center sheen
        const innerRadius = Math.max(2, radius * 0.6);
        const innerMargin = bevelSize * 0.8;
        const innerGrad = ctx.createLinearGradient(x + innerMargin, y + innerMargin, x + size - innerMargin, y + size - innerMargin);
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        innerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

        ctx.fillStyle = innerGrad;
        this.roundRect(x + innerMargin, y + innerMargin, size - innerMargin * 2, size - innerMargin * 2, innerRadius);
        ctx.fill();

        ctx.restore();
    }

    drawAiThinkingBanner(theme) {
        const ctx = this.ctx;
        const bannerW = 220;
        const bannerH = 38;
        const x = (this.width - bannerW) / 2;
        const y = 8;

        ctx.save();
        ctx.fillStyle = 'rgba(18, 24, 38, 0.9)';
        ctx.strokeStyle = '#007AFF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(0, 122, 255, 0.5)';
        ctx.shadowBlur = 12;

        this.roundRect(x, y, bannerW, bannerH, 19);
        ctx.fill();
        ctx.stroke();

        ctx.font = '600 13px Outfit, Inter, sans-serif';
        ctx.fillStyle = '#5AC8FA';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const dots = '.'.repeat((Math.floor(this.pulsePhase * 3) % 4));
        ctx.fillText(`🤖 AI Thinking${dots}`, this.width / 2, y + bannerH / 2);
        ctx.restore();
    }

    roundRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        radius = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
