/**
 * Block Blast - Canvas Renderer & UX Micro-Interaction Pipeline
 * Features:
 * - True 1:1 Square block geometry with classic glossy bevels
 * - Vertical Y-axis Drag Offset (y_offset ≈ 54px) to solve finger occlusion
 * - Strict grid boundary check: dragging back to dock or outside grid CANCELS drop
 * - Elastic Return Snap-Back Animation on cancel / invalid drop locations
 */

import { SkinManager } from './skins.js';

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
        this.dragOffset = { x: 0, y: 54 }; // Y-axis lift (54px)
        this.isTouchDrag = false;
        this.hoverGridCell = null; // { row, col }
        this.aiHint = null; // { shapeIdx, row, col }
        this.aiThinking = false;

        // Animation State
        this.snapBack = null; // { shapeIdx, shape, startX, startY, targetX, targetY, startTime, duration }

        // Background Skin configuration
        const config = SkinManager.loadConfig();
        this.currentBgSkin = SkinManager.getBackground(config.bg);

        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.boardMetrics = {
            x: 0,
            y: 0,
            size: 0,
            cellSize: 0,
            gap: 3
        };
        this.dockMetrics = {
            slots: []
        };

        this.pulsePhase = 0;
    }

    applyBackgroundSkin(bgSkin) {
        if (typeof bgSkin === 'string') {
            bgSkin = SkinManager.getBackground(bgSkin);
        }
        if (bgSkin) {
            this.currentBgSkin = bgSkin;
        }
    }

    setTheme(themeName) {
        this.applyBackgroundSkin(themeName);
    }

    getTheme() {
        const bgSkin = this.currentBgSkin || SkinManager.getBackground(SkinManager.DEFAULT_BG);
        return {
            name: bgSkin.name,
            bg: bgSkin.bg,
            boardBg: bgSkin.boardBg,
            cellEmpty: bgSkin.cellEmpty,
            dockBg: bgSkin.dockBg,
            dockBorder: bgSkin.dockBorder,
            gridLines: bgSkin.boardBg,
            hintGlow: bgSkin.diamondColor || '#F59E0B',
            validGhost: 'rgba(255, 255, 255, 0.45)',
            invalidGhost: 'rgba(239, 68, 68, 0.45)'
        };
    }

    resize(containerWidth, containerHeight) {
        this.dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
        
        const fallbackW = this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 500;
        const fallbackH = this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 640;

        const w = (containerWidth && containerWidth > 50) ? containerWidth : (fallbackW > 50 ? fallbackW : 500);
        const h = (containerHeight && containerHeight > 50) ? containerHeight : (fallbackH > 50 ? fallbackH : 640);

        this.width = Math.max(320, w);
        this.height = Math.max(520, h);

        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;

        this.computeLayout();
    }

    computeLayout() {
        const isMobile = this.width < 640;
        const sidePadding = isMobile ? 10 : 14;
        const topPadding = isMobile ? 20 : 26;

        const dockHeight = Math.min(145, Math.max(100, this.height * 0.22));
        const maxBoardWidth = this.width - sidePadding * 2;
        const maxBoardHeight = this.height - dockHeight - topPadding - (isMobile ? 10 : 14);

        // Scale board with comfortable dimensions that fit cleanly above persistent ads
        const boardSize = Math.max(250, Math.min(maxBoardWidth, maxBoardHeight, 430));
        const boardX = Math.round((this.width - boardSize) / 2);
        const boardY = topPadding;

        const gap = Math.max(2, Math.min(3, Math.round(boardSize / 145)));
        const cellSize = Math.floor((boardSize - (gap * 9)) / 8);

        this.boardMetrics = {
            x: boardX,
            y: boardY,
            size: boardSize,
            cellSize,
            gap
        };

        const dockY = boardY + boardSize + (sidePadding * 0.7);
        const dockWidth = boardSize;
        const slotGap = Math.max(7, Math.round(boardSize * 0.022));
        const slotWidth = (dockWidth - slotGap * 2) / 3;
        const slotHeight = Math.min(dockHeight, 125);

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
        const x = Math.round(bx + gap + col * (cellSize + gap));
        const y = Math.round(by + gap + row * (cellSize + gap));
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

    getSlotCenter(slotIdx) {
        const slot = this.dockMetrics.slots[slotIdx];
        if (!slot) return { x: this.width / 2, y: this.height - 80 };
        return {
            x: slot.x + slot.width / 2,
            y: slot.y + slot.height / 2
        };
    }

    startDrag(shapeIdx, pointer, isTouch = false) {
        this.draggingShapeIdx = shapeIdx;
        this.selectedShapeIdx = shapeIdx;
        this.dragPointer = pointer;
        this.isTouchDrag = isTouch;
        // Y-axis drag offset (54px for touch, 36px for mouse) to prevent thumb/finger occlusion
        this.dragOffset = { x: 0, y: isTouch ? 54 : 36 };
        this.snapBack = null;
    }

    updateDrag(pointer) {
        this.dragPointer = pointer;
    }

    startSnapBack(shapeIdx, currentPointer, dragOffset) {
        const shape = this.gameState.currentShapes[shapeIdx];
        if (!shape) {
            this.draggingShapeIdx = -1;
            return;
        }

        const slotCenter = this.getSlotCenter(shapeIdx);
        const currentY = currentPointer.y - (dragOffset ? dragOffset.y : 0);

        this.snapBack = {
            shapeIdx,
            shape: shape.clone(),
            startX: currentPointer.x,
            startY: currentY,
            targetX: slotCenter.x,
            targetY: slotCenter.y,
            startTime: performance.now(),
            duration: 220 // 220ms smooth elastic return curve
        };

        this.draggingShapeIdx = -1;
    }

    cancelSnapBack() {
        this.snapBack = null;
        this.draggingShapeIdx = -1;
    }

    render(dt = 16) {
        this.pulsePhase += dt * 0.004;

        this.ctx.save();
        this.ctx.scale(this.dpr, this.dpr);

        const shake = this.particles.getShakeOffset();
        this.ctx.translate(shake.x, shake.y);

        const theme = this.getTheme();

        // Clear canvas
        this.ctx.clearRect(-20, -20, this.width + 40, this.height + 40);

        // 1. Draw 8x8 Board Container & Empty Grid Cells
        this.drawBoard(theme);

        // 2. Draw Filled Grid Cells
        this.drawGridBlocks(theme);

        // 3. Draw AI Hint Highlight on Grid if active
        this.drawAiHintHighlight(theme);

        // 4. Draw Ghost Placement Preview (Only when within grid boundaries)
        this.drawGhostPreview(theme);

        // 5. Draw Particles, Shockwaves, and Floating Texts
        this.particles.render(this.ctx);

        // 6. Draw Shape Dock Slots and Available Shapes
        this.drawDock(theme);

        // 7. Draw Currently Dragged Shape with Y-offset lift at true 1:1 square size
        this.drawDraggingShape(theme);

        // 8. Draw Elastic Snap-Back Return Animation if active
        this.drawSnapBackShape(theme);

        // 9. Draw AI Thinking Overlay if active
        if (this.aiThinking) {
            this.drawAiThinkingBanner(theme);
        }

        this.ctx.restore();
    }

    drawBoard(theme) {
        const { x, y, size, cellSize, gap } = this.boardMetrics;
        const ctx = this.ctx;

        // Board outer rounded card
        ctx.save();
        ctx.fillStyle = theme.boardBg;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        this.roundRect(x - gap, y - gap, size + gap * 2, size + gap * 2, 16);
        ctx.fill();
        ctx.restore();

        // Draw empty grid slot cells (Crisp 1:1 squares)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cellX = Math.round(x + gap + c * (cellSize + gap));
                const cellY = Math.round(y + gap + r * (cellSize + gap));

                ctx.save();
                ctx.fillStyle = theme.cellEmpty;
                this.roundRect(cellX, cellY, cellSize, cellSize, Math.max(3, Math.round(cellSize * 0.14)));
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
                    if (cell.item) {
                        this.drawCollectibleItem(rect.x, rect.y, rect.size, cell.item);
                    }
                }
            }
        }
    }

    drawCollectibleItem(x, y, size, itemType) {
        const ctx = this.ctx;
        const cx = x + size / 2;
        const cy = y + size / 2;
        const r = size * 0.3;

        ctx.save();
        if (itemType === 'gem') {
            // Shiny Diamond / Gem
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#38BDF8';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(cx, cy - r);
            ctx.lineTo(cx + r, cy);
            ctx.lineTo(cx, cy + r);
            ctx.lineTo(cx - r, cy);
            ctx.closePath();
            ctx.fill();

            // Inner facet
            ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
            ctx.beginPath();
            ctx.moveTo(cx, cy - r * 0.5);
            ctx.lineTo(cx + r * 0.5, cy);
            ctx.lineTo(cx, cy + r * 0.5);
            ctx.lineTo(cx - r * 0.5, cy);
            ctx.closePath();
            ctx.fill();
        } else if (itemType === 'puzzle') {
            // Puzzle Piece
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = '#C084FC';
            ctx.shadowBlur = 8;
            ctx.fillRect(cx - r * 0.65, cy - r * 0.65, r * 1.3, r * 1.3);
            ctx.beginPath();
            ctx.arc(cx, cy - r * 0.65, r * 0.35, 0, Math.PI * 2);
            ctx.arc(cx + r * 0.65, cy, r * 0.35, 0, Math.PI * 2);
            ctx.fill();
        } else if (itemType === 'star') {
            // 5-Point Star
            ctx.fillStyle = '#FDE047';
            ctx.shadowColor = '#EAB308';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * r + cx, -Math.sin((18 + i * 72) * Math.PI / 180) * r + cy);
                ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (r * 0.5) + cx, -Math.sin((54 + i * 72) * Math.PI / 180) * (r * 0.5) + cy);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
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

            // Shape origin in canvas space taking into account the Y-axis lift offset (y_offset = 54px)
            const originX = this.dragPointer.x - shapePixelW / 2;
            const originY = this.dragPointer.y - shapePixelH / 2 - this.dragOffset.y;

            const col = Math.round((originX - bx - gap) / (cellSize + gap));
            const row = Math.round((originY - by - gap) / (cellSize + gap));

            // If dragged outside board boundary or back to tray, DO NOT show ghost preview
            if (row < 0 || col < 0 || row > 8 - shape.rows || col > 8 - shape.cols) {
                return;
            }

            targetRow = row;
            targetCol = col;
        } else if (this.hoverGridCell) {
            targetRow = this.hoverGridCell.row;
            targetCol = this.hoverGridCell.col;
            targetRow = targetRow - Math.floor(shape.rows / 2);
            targetCol = targetCol - Math.floor(shape.cols / 2);

            if (targetRow < 0 || targetCol < 0 || targetRow > 8 - shape.rows || targetCol > 8 - shape.cols) {
                return;
            }
        }

        if (targetRow === null || targetCol === null) return;

        const isValid = this.gameState.canPlaceShape(shape, targetRow, targetCol);

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const rect = this.getCellRect(targetRow + r, targetCol + c);
                    this.ctx.save();
                    this.ctx.globalAlpha = isValid ? 0.65 : 0.40;

                    if (isValid) {
                        this.drawBeveledBlock(rect.x, rect.y, rect.size, shape.color, true);
                    } else {
                        this.ctx.fillStyle = '#EF4444';
                        this.roundRect(rect.x, rect.y, rect.size, rect.size, Math.round(rect.size * 0.14));
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
            const glowAlpha = 0.38 + Math.sin(this.pulsePhase * 4) * 0.18;

            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;
            ctx.strokeStyle = `rgba(251, 191, 36, ${Math.min(1, glowAlpha + 0.3)})`;
            ctx.lineWidth = 2;
            ctx.shadowColor = 'rgba(251, 191, 36, 0.6)';
            ctx.shadowBlur = 12;

            for (const r of rowsToClear) {
                const y = by + gap + r * (cellSize + gap);
                this.roundRect(bx + gap, y, size - gap * 2, cellSize, Math.round(cellSize * 0.14));
                ctx.fill();
                ctx.stroke();
            }
            for (const c of colsToClear) {
                const x = bx + gap + c * (cellSize + gap);
                this.roundRect(x, by + gap, cellSize, size - gap * 2, Math.round(cellSize * 0.14));
                ctx.fill();
                ctx.stroke();
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
        const pulse = 0.5 + Math.sin(this.pulsePhase * 4) * 0.4;
        const goldColor = `rgba(245, 158, 11, ${pulse})`;

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const rect = this.getCellRect(row + r, col + c);
                    ctx.save();
                    ctx.strokeStyle = goldColor;
                    ctx.lineWidth = 3;
                    ctx.shadowColor = '#F59E0B';
                    ctx.shadowBlur = 10;
                    this.roundRect(rect.x - 1, rect.y - 1, rect.size + 2, rect.size + 2, Math.round(rect.size * 0.14));
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
            const isSnappingBack = this.snapBack && this.snapBack.shapeIdx === i;
            const isHinted = this.aiHint && this.aiHint.shapeIdx === i;
            const shape = this.gameState.currentShapes[i];

            // Slot Background Card
            ctx.save();
            ctx.fillStyle = theme.dockBg;
            ctx.strokeStyle = isSelected ? '#3B82F6' : (isHinted ? '#F59E0B' : theme.dockBorder);
            ctx.lineWidth = (isSelected || isHinted) ? 3 : 1;

            if (isSelected || isHinted) {
                ctx.shadowColor = isSelected ? 'rgba(59, 130, 246, 0.5)' : 'rgba(245, 158, 11, 0.6)';
                ctx.shadowBlur = 12;
            }

            this.roundRect(slot.x, slot.y, slot.width, slot.height, 14);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // Key shortcut label
            ctx.save();
            ctx.font = '700 11px Outfit, Inter, sans-serif';
            ctx.fillStyle = isSelected ? '#3B82F6' : 'rgba(148, 163, 184, 0.7)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(keys[i], slot.x + 8, slot.y + 6);
            ctx.restore();

            // Unplaced piece sitting cleanly in the tray (Crisp 1:1 squares)
            if (shape && shape.form && !isDragging && !isSnappingBack) {
                const canFitAnywhere = this.checkShapeCanFit(shape);

                ctx.save();
                if (!canFitAnywhere) {
                    ctx.globalAlpha = 0.45;
                }

                const maxDim = Math.max(shape.rows, shape.cols, 3);
                const miniBlockSize = Math.round(Math.min((slot.width - 24) / maxDim, (slot.height - 24) / maxDim, this.boardMetrics.cellSize * 0.60));
                const shapePixelW = shape.cols * (miniBlockSize + 2) - 2;
                const shapePixelH = shape.rows * (miniBlockSize + 2) - 2;

                const startX = Math.round(slot.x + (slot.width - shapePixelW) / 2);
                const startY = Math.round(slot.y + (slot.height - shapePixelH) / 2 + 2);

                for (let r = 0; r < shape.rows; r++) {
                    for (let c = 0; c < shape.cols; c++) {
                        if (shape.form[r][c]) {
                            const bx = startX + c * (miniBlockSize + 2);
                            const by = startY + r * (miniBlockSize + 2);
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

    /**
     * Render the active dragged piece at exact 1:1 square grid block size with Y-axis lift
     */
    drawDraggingShape(theme) {
        if (this.draggingShapeIdx === -1) return;
        const shape = this.gameState.currentShapes[this.draggingShapeIdx];
        if (!shape || !shape.form) return;

        const { cellSize, gap } = this.boardMetrics;
        const blockSize = cellSize;
        const shapePixelW = shape.cols * (blockSize + gap) - gap;
        const shapePixelH = shape.rows * (blockSize + gap) - gap;

        // Position lifted above the touch point
        const startX = Math.round(this.dragPointer.x - shapePixelW / 2);
        const startY = Math.round(this.dragPointer.y - shapePixelH / 2 - this.dragOffset.y);

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        this.ctx.shadowBlur = 18;
        this.ctx.shadowOffsetY = 10;

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
     * Render elastic snap-back return animation if dropped on invalid grid locations or canceled
     */
    drawSnapBackShape(theme) {
        if (!this.snapBack) return;

        const now = performance.now();
        const elapsed = now - this.snapBack.startTime;
        const t = Math.min(1, elapsed / this.snapBack.duration);

        if (t >= 1) {
            this.snapBack = null;
            return;
        }

        // Smooth ease-out cubic curve
        const ease = 1 - Math.pow(1 - t, 3);

        const currentX = this.snapBack.startX + (this.snapBack.targetX - this.snapBack.startX) * ease;
        const currentY = this.snapBack.startY + (this.snapBack.targetY - this.snapBack.startY) * ease;

        const { cellSize } = this.boardMetrics;
        const maxDim = Math.max(this.snapBack.shape.rows, this.snapBack.shape.cols, 3);
        const dockBlockSize = Math.round(Math.min(30, cellSize * 0.65));

        // Interpolate block size from full cellSize down to dockBlockSize
        const blockSize = Math.round(cellSize - (cellSize - dockBlockSize) * ease);
        const blockGap = 2;

        const shape = this.snapBack.shape;
        const shapePixelW = shape.cols * (blockSize + blockGap) - blockGap;
        const shapePixelH = shape.rows * (blockSize + blockGap) - blockGap;

        const startX = Math.round(currentX - shapePixelW / 2);
        const startY = Math.round(currentY - shapePixelH / 2);

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = Math.round(12 * (1 - t));

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const x = startX + c * (blockSize + blockGap);
                    const y = startY + r * (blockSize + blockGap);
                    this.drawBeveledBlock(x, y, blockSize, shape.color);
                }
            }
        }
        this.ctx.restore();
    }

    /**
     * Classic 3D Beveled Glossy Block Tile (Guaranteed 1:1 True Square)
     */
    drawBeveledBlock(x, y, size, color, isGhost = false) {
        const ctx = this.ctx;
        const squareSize = Math.round(size);
        const radius = Math.max(3, Math.round(squareSize * 0.14));
        const hex = color.hex || '#3B82F6';
        const light = color.light || '#93C5FD';
        const dark = color.dark || '#1D4ED8';

        ctx.save();

        // 1. Base Gradient Fill (True Square)
        const bgGrad = ctx.createLinearGradient(x, y, x, y + squareSize);
        bgGrad.addColorStop(0, light);
        bgGrad.addColorStop(0.7, hex);
        bgGrad.addColorStop(1, dark);

        ctx.fillStyle = bgGrad;
        this.roundRect(x, y, squareSize, squareSize, radius);
        ctx.fill();

        // 2. Beveled top/left highlight
        const bevelSize = Math.max(2, Math.round(squareSize * 0.12));
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + squareSize - radius, y);
        ctx.quadraticCurveTo(x + squareSize, y, x + squareSize - bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + bevelSize);
        ctx.lineTo(x + bevelSize, y + squareSize - radius);
        ctx.quadraticCurveTo(x, y + squareSize, x, y + squareSize - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.fill();
        ctx.restore();

        // 3. Inner glossy center sheen
        const innerRadius = Math.max(2, Math.round(radius * 0.6));
        const innerMargin = bevelSize * 0.8;
        const innerSize = Math.max(2, squareSize - innerMargin * 2);
        const innerGrad = ctx.createLinearGradient(x + innerMargin, y + innerMargin, x + innerMargin, y + innerMargin + innerSize);
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        innerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
        innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

        ctx.fillStyle = innerGrad;
        this.roundRect(x + innerMargin, y + innerMargin, innerSize, innerSize, innerRadius);
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
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        ctx.shadowBlur = 10;

        this.roundRect(x, y, bannerW, bannerH, 19);
        ctx.fill();
        ctx.stroke();

        ctx.font = '600 13px Outfit, Inter, sans-serif';
        ctx.fillStyle = '#60A5FA';
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
