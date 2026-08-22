/**
 * Block Blast - Canvas Renderer & UX Micro-Interaction Pipeline
 * Features:
 * - Vertical Y-axis Drag Offset (y_offset ≈ 48px - 60px) to solve finger occlusion
 * - Smooth Elastic Spring Scale-Up (60% Tray Scale -> 100% Full Grid Size)
 * - Elastic Return Snap-Back Animation on invalid drop locations
 * - Gorgeous 3D Beveled Glossy Block Tiles & Ghost Previews
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
        this.dragOffset = { x: 0, y: 54 }; // Y-axis lift (48px - 60px)
        this.isTouchDrag = false;
        this.hoverGridCell = null; // { row, col }
        this.aiHint = null; // { shapeIdx, row, col }
        this.aiThinking = false;

        // Spring & Animation State
        this.dragScaleProgress = 0; // 0 (at tray 60%) to 1 (at grid 100%)
        this.currentDragScale = 0.60;
        this.snapBack = null; // { shapeIdx, shape, startX, startY, targetX, targetY, startTime, duration }

        // Theme configuration
        this.currentTheme = 'neon-dark';
        this.themes = {
            'neon-dark': {
                name: 'Dark Classic (Default)',
                bg: '#0F172A',
                boardBg: '#1E293B',
                cellEmpty: '#334155',
                dockBg: '#1E293B',
                dockBorder: '#334155',
                gridLines: '#0F172A',
                hintGlow: '#F59E0B',
                validGhost: 'rgba(255, 255, 255, 0.45)',
                invalidGhost: 'rgba(239, 68, 68, 0.45)'
            },
            'cyber-midnight': {
                name: 'Cyber Midnight',
                bg: '#090D16',
                boardBg: '#111827',
                cellEmpty: '#1F2937',
                dockBg: '#111827',
                dockBorder: '#374151',
                gridLines: '#0B0F19',
                hintGlow: '#10B981',
                validGhost: 'rgba(59, 130, 246, 0.45)',
                invalidGhost: 'rgba(244, 63, 94, 0.45)'
            },
            'classic-pastel': {
                name: 'Classic Light',
                bg: '#F1F5F9',
                boardBg: '#FFFFFF',
                cellEmpty: '#E2E8F0',
                dockBg: '#FFFFFF',
                dockBorder: '#E2E8F0',
                gridLines: '#CBD5E1',
                hintGlow: '#D97706',
                validGhost: 'rgba(59, 130, 246, 0.4)',
                invalidGhost: 'rgba(239, 68, 68, 0.4)'
            },
            'sunset-blast': {
                name: 'Sunset Blast',
                bg: '#181028',
                boardBg: '#2D1B4E',
                cellEmpty: '#442C6F',
                dockBg: '#2D1B4E',
                dockBorder: '#5B3B92',
                gridLines: '#181028',
                hintGlow: '#EC4899',
                validGhost: 'rgba(236, 72, 153, 0.45)',
                invalidGhost: 'rgba(239, 68, 68, 0.45)'
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
            gap: 3
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
        const padding = isMobile ? 12 : 20;

        const dockHeight = Math.min(160, Math.max(110, this.height * 0.22));
        const maxBoardWidth = this.width - padding * 2;
        const maxBoardHeight = this.height - dockHeight - padding * 2.5;

        const boardSize = Math.max(260, Math.min(maxBoardWidth, maxBoardHeight, 480));
        const boardX = (this.width - boardSize) / 2;
        const boardY = padding;

        const gap = Math.max(2, Math.min(3, Math.round(boardSize / 150)));
        const cellSize = (boardSize - (gap * 9)) / 8;

        this.boardMetrics = {
            x: boardX,
            y: boardY,
            size: boardSize,
            cellSize,
            gap
        };

        const dockY = boardY + boardSize + (padding * 0.7);
        const dockWidth = boardSize;
        const slotGap = 10;
        const slotWidth = (dockWidth - slotGap * 2) / 3;
        const slotHeight = Math.min(dockHeight, 130);

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
        this.dragScaleProgress = 0;
        this.currentDragScale = 0.60;
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
            duration: 260 // 260ms smooth elastic return curve
        };

        this.draggingShapeIdx = -1;
    }

    cancelSnapBack() {
        this.snapBack = null;
        this.draggingShapeIdx = -1;
    }

    render(dt = 16) {
        this.pulsePhase += dt * 0.004;

        // Animate Drag Elastic Spring Scale-Up (60% -> 100% with spring overshoot)
        if (this.draggingShapeIdx !== -1) {
            this.dragScaleProgress = Math.min(1, this.dragScaleProgress + dt / 140);
            const p = this.dragScaleProgress;
            // Elastic spring overshoot equation
            const springBonus = 0.12 * Math.sin(p * Math.PI);
            this.currentDragScale = 0.60 + (1.0 - 0.60) * Math.sin(p * Math.PI * 0.5) + springBonus;
        } else {
            this.dragScaleProgress = 0;
            this.currentDragScale = 0.60;
        }

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

        // 4. Draw Ghost Placement Preview (Lift-offset aware)
        this.drawGhostPreview(theme);

        // 5. Draw Particles, Shockwaves, and Floating Texts
        this.particles.render(this.ctx);

        // 6. Draw Shape Dock Slots and Available Shapes (at ~60% size)
        this.drawDock(theme);

        // 7. Draw Currently Dragged Shape with Y-offset lift & Spring Scale
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

        // Draw empty grid slot cells
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cellX = x + gap + c * (cellSize + gap);
                const cellY = y + gap + r * (cellSize + gap);

                ctx.save();
                ctx.fillStyle = theme.cellEmpty;
                this.roundRect(cellX, cellY, cellSize, cellSize, Math.max(3, cellSize * 0.14));
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

            // Shape origin in canvas space taking into account the Y-axis lift offset (y_offset = 48px - 60px)
            const originX = this.dragPointer.x - shapePixelW / 2;
            const originY = this.dragPointer.y - shapePixelH / 2 - this.dragOffset.y;

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

        for (let r = 0; r < shape.rows; r++) {
            for (let c = 0; c < shape.cols; c++) {
                if (shape.form[r][c]) {
                    const rect = this.getCellRect(targetRow + r, targetCol + c);
                    this.ctx.save();
                    this.ctx.globalAlpha = isValid ? 0.65 : 0.45;

                    if (isValid) {
                        this.drawBeveledBlock(rect.x, rect.y, rect.size, shape.color, true);
                    } else {
                        this.ctx.fillStyle = '#EF4444';
                        this.roundRect(rect.x, rect.y, rect.size, rect.size, rect.size * 0.15);
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
            const glowAlpha = 0.35 + Math.sin(this.pulsePhase * 3) * 0.15;

            ctx.save();
            ctx.fillStyle = `rgba(255, 255, 255, ${glowAlpha})`;

            for (const r of rowsToClear) {
                const y = by + gap + r * (cellSize + gap);
                this.roundRect(bx + gap, y, size - gap * 2, cellSize, cellSize * 0.15);
                ctx.fill();
            }
            for (const c of colsToClear) {
                const x = bx + gap + c * (cellSize + gap);
                this.roundRect(x, by + gap, cellSize, size - gap * 2, cellSize * 0.15);
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
                    this.roundRect(rect.x - 1, rect.y - 1, rect.size + 2, rect.size + 2, rect.size * 0.15);
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

            // Unplaced piece sitting in the tray scaled down to ~60% size
            if (shape && shape.form && !isDragging && !isSnappingBack) {
                const canFitAnywhere = this.checkShapeCanFit(shape);

                ctx.save();
                if (!canFitAnywhere) {
                    ctx.globalAlpha = 0.45;
                }

                const maxDim = Math.max(shape.rows, shape.cols, 3);
                // 60% relative scale in the tray
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

    /**
     * Render the active dragged piece with:
     * 1. Y-axis lift offset (y_offset = 48px - 60px) to solve finger occlusion
     * 2. Smooth Spring Scale-Up (60% -> 100% Full Grid Size)
     */
    drawDraggingShape(theme) {
        if (this.draggingShapeIdx === -1) return;
        const shape = this.gameState.currentShapes[this.draggingShapeIdx];
        if (!shape || !shape.form) return;

        const { cellSize, gap } = this.boardMetrics;
        // Spring scaled block size
        const blockSize = cellSize * this.currentDragScale;
        const blockGap = gap * this.currentDragScale;
        const shapePixelW = shape.cols * (blockSize + blockGap) - blockGap;
        const shapePixelH = shape.rows * (blockSize + blockGap) - blockGap;

        // Position lifted above the touch point
        const startX = this.dragPointer.x - shapePixelW / 2;
        const startY = this.dragPointer.y - shapePixelH / 2 - this.dragOffset.y;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        this.ctx.shadowBlur = 20;
        this.ctx.shadowOffsetY = 12;

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
     * Render elastic snap-back return animation if dropped on invalid grid locations
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

        // Elastic return curve (easeOutBack)
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const ease = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

        // Interpolate position
        const currentX = this.snapBack.startX + (this.snapBack.targetX - this.snapBack.startX) * ease;
        const currentY = this.snapBack.startY + (this.snapBack.targetY - this.snapBack.startY) * ease;

        // Interpolate scale from 100% down to 60% tray size
        const scale = 1.0 - (1.0 - 0.60) * Math.min(1, ease);
        const { cellSize, gap } = this.boardMetrics;
        const blockSize = cellSize * scale;
        const blockGap = gap * scale;

        const shape = this.snapBack.shape;
        const shapePixelW = shape.cols * (blockSize + blockGap) - blockGap;
        const shapePixelH = shape.rows * (blockSize + blockGap) - blockGap;

        const startX = currentX - shapePixelW / 2;
        const startY = currentY - shapePixelH / 2;

        this.ctx.save();
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 12 * (1 - t);

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
     * Classic 3D Beveled Glossy Block Tile
     */
    drawBeveledBlock(x, y, size, color, isGhost = false) {
        const ctx = this.ctx;
        const radius = Math.max(3, size * 0.15);
        const hex = color.hex || '#3B82F6';
        const light = color.light || '#93C5FD';
        const dark = color.dark || '#1D4ED8';

        ctx.save();

        // 1. Base Gradient Fill
        const bgGrad = ctx.createLinearGradient(x, y, x, y + size);
        bgGrad.addColorStop(0, light);
        bgGrad.addColorStop(0.7, hex);
        bgGrad.addColorStop(1, dark);

        ctx.fillStyle = bgGrad;
        this.roundRect(x, y, size, size, radius);
        ctx.fill();

        // 2. Beveled top/left highlight
        const bevelSize = Math.max(2, size * 0.12);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
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
        innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
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
        ctx.lineTo(x + radius, y);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
