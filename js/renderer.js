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
        
        const fallbackW = this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientWidth : 420;
        const fallbackH = this.canvas && this.canvas.parentElement ? this.canvas.parentElement.clientHeight : 540;

        const w = (containerWidth && containerWidth > 50) ? containerWidth : (fallbackW > 50 ? fallbackW : 420);
        const h = (containerHeight && containerHeight > 50) ? containerHeight : (fallbackH > 50 ? fallbackH : 540);

        this.width = Math.round(w);
        this.height = Math.round(h);

        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);

        this.computeLayout();
    }

    computeLayout() {
        const isMobile = this.width < 640;
        const aspect = this.width / Math.max(1, this.height);

        // Safety paddings from outer canvas boundaries to guarantee shadow and glow bloom
        const sidePadding = isMobile ? 14 : 22;
        const topPadding = isMobile ? 14 : 20;
        const bottomPadding = isMobile ? 16 : 22;

        // Side Dock Mode: used when the canvas is wide enough (aspect >= 1.08 and width >= 480)
        const isWide = (aspect >= 1.08 && this.width >= 480);

        if (isWide) {
            // ==========================================
            // WIDESCREEN / SIDE DOCK MODE
            // ==========================================
            const maxAvailableHeight = this.height - topPadding - bottomPadding;
            const sideDockWidth = Math.min(220, Math.max(120, Math.round(this.width * 0.23)));
            const maxAvailableWidthForBoard = this.width - sideDockWidth - (sidePadding * 3);

            // Maximum square board size that fits in available width and height
            const maxBoardSize = Math.max(180, Math.min(maxAvailableWidthForBoard, maxAvailableHeight));
            const gap = Math.max(2, Math.min(4, Math.round(maxBoardSize / 130)));
            const outerPadding = Math.round(gap * 1.5);
            const cellSize = Math.floor((maxBoardSize - (outerPadding * 2) - (gap * 7)) / 8);
            const actualBoardSize = cellSize * 8 + gap * 7 + outerPadding * 2;

            const totalUsedWidth = actualBoardSize + sidePadding + sideDockWidth;
            const boardX = Math.max(sidePadding, Math.round((this.width - totalUsedWidth) / 2));
            const boardY = Math.max(topPadding, Math.round((this.height - actualBoardSize) / 2));

            this.boardMetrics = {
                x: boardX,
                y: boardY,
                size: actualBoardSize,
                cellSize,
                gap,
                outerPadding
            };

            const dockX = boardX + actualBoardSize + sidePadding;
            const dockY = boardY;
            const slotGap = Math.max(6, Math.round((actualBoardSize - 30) * 0.035));
            const slotWidth = Math.min(sideDockWidth, this.width - dockX - sidePadding);
            const slotHeight = Math.floor((actualBoardSize - slotGap * 2) / 3);

            this.dockMetrics.slots = [];
            this.dockMetrics.isVertical = true;
            for (let i = 0; i < 3; i++) {
                const sy = dockY + i * (slotHeight + slotGap);
                this.dockMetrics.slots.push({
                    index: i,
                    x: dockX,
                    y: sy,
                    width: slotWidth,
                    height: slotHeight
                });
            }
        } else {
            // ==========================================
            // PORTRAIT / BOTTOM DOCK MODE
            // ==========================================
            const maxAvailableWidth = this.width - sidePadding * 2;
            const dockHeight = Math.min(145, Math.max(80, Math.round(this.height * 0.21)));
            const maxAvailableHeightForBoard = this.height - dockHeight - topPadding - bottomPadding - (isMobile ? 8 : 12);

            const maxBoardSize = Math.max(180, Math.min(maxAvailableWidth, maxAvailableHeightForBoard));
            const gap = Math.max(2, Math.min(4, Math.round(maxBoardSize / 130)));
            const outerPadding = Math.round(gap * 1.5);
            const cellSize = Math.floor((maxBoardSize - (outerPadding * 2) - (gap * 7)) / 8);
            const actualBoardSize = cellSize * 8 + gap * 7 + outerPadding * 2;

            const boardX = Math.round((this.width - actualBoardSize) / 2);
            const boardY = topPadding + Math.max(0, Math.round((maxAvailableHeightForBoard - actualBoardSize) * 0.3));

            this.boardMetrics = {
                x: boardX,
                y: boardY,
                size: actualBoardSize,
                cellSize,
                gap,
                outerPadding
            };

            const dockY = boardY + actualBoardSize + (isMobile ? 8 : 12);
            const dockWidth = actualBoardSize;
            const slotGap = Math.max(6, Math.round(actualBoardSize * 0.022));
            const slotWidth = Math.floor((dockWidth - slotGap * 2) / 3);
            const availableDockHeight = Math.max(60, this.height - dockY - bottomPadding);
            const slotHeight = Math.min(dockHeight, availableDockHeight);

            this.dockMetrics.slots = [];
            this.dockMetrics.isVertical = false;
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
    }

    screenToGrid(x, y) {
        const { x: bx, y: by, cellSize, gap, outerPadding } = this.boardMetrics;
        const gridLeft = bx + outerPadding;
        const gridTop = by + outerPadding;
        const gridWidth = 8 * cellSize + 7 * gap;
        const gridHeight = 8 * cellSize + 7 * gap;

        if (x < gridLeft || x > gridLeft + gridWidth || y < gridTop || y > gridTop + gridHeight) {
            return null;
        }

        const col = Math.floor((x - gridLeft) / (cellSize + gap));
        const row = Math.floor((y - gridTop) / (cellSize + gap));

        if (row >= 0 && row < 8 && col >= 0 && col < 8) {
            return { row, col };
        }
        return null;
    }

    getCellRect(row, col) {
        const { x: bx, y: by, cellSize, gap, outerPadding } = this.boardMetrics;
        const x = Math.round(bx + outerPadding + col * (cellSize + gap));
        const y = Math.round(by + outerPadding + row * (cellSize + gap));
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
        const { x, y, size, cellSize, gap, outerPadding } = this.boardMetrics;
        const ctx = this.ctx;

        // Board outer rounded card
        ctx.save();
        ctx.fillStyle = theme.boardBg;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;

        this.roundRect(x, y, size, size, 16);
        ctx.fill();
        ctx.restore();

        // Draw empty grid slot cells (Crisp 1:1 squares with symmetrical outer padding)
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cellX = Math.round(x + outerPadding + c * (cellSize + gap));
                const cellY = Math.round(y + outerPadding + r * (cellSize + gap));

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
        const r = size * 0.32;
        const pulse = 0.85 + Math.sin(this.pulsePhase * 3) * 0.15;

        ctx.save();

        if (itemType === 'gem') {
            // -- Premium Multi-Facet Diamond Gem --

            // Outer glow aura
            ctx.shadowColor = 'rgba(56, 189, 248, 0.8)';
            ctx.shadowBlur = 14 * pulse;

            // Main diamond silhouette (rotated square)
            const outerR = r * 1.05;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            ctx.lineTo(cx + outerR, cy);
            ctx.lineTo(cx, cy + outerR);
            ctx.lineTo(cx - outerR, cy);
            ctx.closePath();

            // Gradient fill: deep sapphire to sky
            const gemGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
            gemGrad.addColorStop(0, '#E0F2FE');
            gemGrad.addColorStop(0.3, '#7DD3FC');
            gemGrad.addColorStop(0.6, '#38BDF8');
            gemGrad.addColorStop(1, '#0284C7');
            ctx.fillStyle = gemGrad;
            ctx.fill();

            // Crisp diamond border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = Math.max(1, size * 0.025);
            ctx.stroke();

            // Inner facets: top-left bright triangle
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            ctx.lineTo(cx - outerR, cy);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.30)';
            ctx.fill();

            // Inner facets: top-right subtle highlight
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            ctx.lineTo(cx + outerR, cy);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.fill();

            // Bottom-right shadow facet for depth
            ctx.beginPath();
            ctx.moveTo(cx + outerR, cy);
            ctx.lineTo(cx, cy + outerR);
            ctx.lineTo(cx, cy);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0, 40, 80, 0.18)';
            ctx.fill();

            // Center cross-line facet edges
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = Math.max(0.5, size * 0.015);
            ctx.beginPath();
            ctx.moveTo(cx, cy - outerR);
            ctx.lineTo(cx, cy + outerR);
            ctx.moveTo(cx - outerR, cy);
            ctx.lineTo(cx + outerR, cy);
            ctx.stroke();

            // Top-left specular highlight dot
            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(cx - r * 0.28, cy - r * 0.32, r * 0.15, 0, Math.PI * 2);
            ctx.fill();

        } else if (itemType === 'puzzle') {
            // -- Premium Puzzle Piece with Connector Tabs --

            ctx.shadowColor = 'rgba(192, 132, 252, 0.75)';
            ctx.shadowBlur = 12 * pulse;

            const bodyW = r * 1.2;
            const bodyH = r * 1.2;
            const tabR = r * 0.28;
            const notchR = r * 0.24;
            const cornerR = Math.max(2, r * 0.18);

            // Draw body + tab (top) + tab (right) - notch (bottom) - notch (left)
            ctx.beginPath();

            // Start top-left, going clockwise
            // Top edge with outward tab
            ctx.moveTo(cx - bodyW / 2 + cornerR, cy - bodyH / 2);
            ctx.lineTo(cx - tabR, cy - bodyH / 2);
            ctx.arc(cx, cy - bodyH / 2 - tabR * 0.6, tabR, Math.PI * 0.85, Math.PI * 0.15, false);
            ctx.lineTo(cx + bodyW / 2 - cornerR, cy - bodyH / 2);

            // Top-right corner
            ctx.quadraticCurveTo(cx + bodyW / 2, cy - bodyH / 2, cx + bodyW / 2, cy - bodyH / 2 + cornerR);

            // Right edge with outward tab
            ctx.lineTo(cx + bodyW / 2, cy - tabR);
            ctx.arc(cx + bodyW / 2 + tabR * 0.6, cy, tabR, -Math.PI * 0.35, Math.PI * 0.35, false);
            ctx.lineTo(cx + bodyW / 2, cy + bodyH / 2 - cornerR);

            // Bottom-right corner
            ctx.quadraticCurveTo(cx + bodyW / 2, cy + bodyH / 2, cx + bodyW / 2 - cornerR, cy + bodyH / 2);

            // Bottom edge with inward notch
            ctx.lineTo(cx + notchR, cy + bodyH / 2);
            ctx.arc(cx, cy + bodyH / 2 - notchR * 0.3, notchR, Math.PI * 0.15, Math.PI * 0.85, false);
            ctx.lineTo(cx - bodyW / 2 + cornerR, cy + bodyH / 2);

            // Bottom-left corner
            ctx.quadraticCurveTo(cx - bodyW / 2, cy + bodyH / 2, cx - bodyW / 2, cy + bodyH / 2 - cornerR);

            // Left edge with inward notch
            ctx.lineTo(cx - bodyW / 2, cy + notchR);
            ctx.arc(cx - bodyW / 2 + notchR * 0.3, cy, notchR, Math.PI * 0.35, -Math.PI * 0.35, false);
            ctx.lineTo(cx - bodyW / 2, cy - bodyH / 2 + cornerR);

            // Top-left corner
            ctx.quadraticCurveTo(cx - bodyW / 2, cy - bodyH / 2, cx - bodyW / 2 + cornerR, cy - bodyH / 2);

            ctx.closePath();

            // Fill with rich purple gradient
            const puzzleGrad = ctx.createLinearGradient(cx - bodyW, cy - bodyH, cx + bodyW, cy + bodyH);
            puzzleGrad.addColorStop(0, '#E9D5FF');
            puzzleGrad.addColorStop(0.35, '#C084FC');
            puzzleGrad.addColorStop(0.7, '#A855F7');
            puzzleGrad.addColorStop(1, '#7C3AED');
            ctx.fillStyle = puzzleGrad;
            ctx.fill();

            // Crisp border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = Math.max(1, size * 0.022);
            ctx.stroke();

            // Inner body highlight
            ctx.shadowBlur = 0;
            const innerGrad = ctx.createLinearGradient(cx, cy - bodyH / 2, cx, cy + bodyH / 2);
            innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.30)');
            innerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.10)');
            ctx.fillStyle = innerGrad;
            ctx.fill();

            // Specular highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(cx - r * 0.18, cy - r * 0.22, r * 0.12, 0, Math.PI * 2);
            ctx.fill();

        } else if (itemType === 'star') {
            // -- Premium 5-Point Golden Star --

            ctx.shadowColor = 'rgba(234, 179, 8, 0.85)';
            ctx.shadowBlur = 14 * pulse;

            const outerR = r * 1.08;
            const innerR = outerR * 0.42;
            const points = 5;
            const angleOffset = -Math.PI / 2; // Point upward

            // Main star path
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const isOuter = i % 2 === 0;
                const currentR = isOuter ? outerR : innerR;
                const angle = angleOffset + (i * Math.PI) / points;
                const px = cx + Math.cos(angle) * currentR;
                const py = cy + Math.sin(angle) * currentR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();

            // Rich golden gradient
            const starGrad = ctx.createRadialGradient(cx - outerR * 0.2, cy - outerR * 0.2, 0, cx, cy, outerR * 1.1);
            starGrad.addColorStop(0, '#FEF9C3');
            starGrad.addColorStop(0.3, '#FDE047');
            starGrad.addColorStop(0.65, '#FACC15');
            starGrad.addColorStop(1, '#CA8A04');
            ctx.fillStyle = starGrad;
            ctx.fill();

            // Crisp golden border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = Math.max(1, size * 0.02);
            ctx.stroke();

            // Top-left directional highlight for 3D illusion
            ctx.shadowBlur = 0;
            ctx.beginPath();
            for (let i = 0; i < points * 2; i++) {
                const isOuter = i % 2 === 0;
                const currentR = isOuter ? outerR : innerR;
                const angle = angleOffset + (i * Math.PI) / points;
                const px = cx + Math.cos(angle) * currentR;
                const py = cy + Math.sin(angle) * currentR;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            const highlightGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR * 0.5, cy + outerR * 0.5);
            highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.40)');
            highlightGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.08)');
            highlightGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
            ctx.fillStyle = highlightGrad;
            ctx.fill();

            // Bright center core glow
            const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerR * 0.9);
            coreGrad.addColorStop(0, 'rgba(255, 255, 240, 0.65)');
            coreGrad.addColorStop(1, 'rgba(255, 255, 240, 0)');
            ctx.fillStyle = coreGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, innerR * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Specular highlight dot
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(cx - r * 0.15, cy - r * 0.28, r * 0.11, 0, Math.PI * 2);
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
