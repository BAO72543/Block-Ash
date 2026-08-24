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

        // Responsive safety paddings
        const sidePadding = isMobile ? Math.max(8, Math.round(this.width * 0.03)) : 20;
        const topPadding = isMobile ? Math.max(8, Math.round(this.height * 0.02)) : 16;
        const bottomPadding = isMobile ? Math.max(8, Math.round(this.height * 0.025)) : 18;

        // Side Dock Mode: triggered on landscape ratios or low-height wide screens
        const isWide = (aspect >= 1.05 && this.width >= 460) || (aspect >= 1.25 && this.width >= 400) || (this.height <= 520 && this.width >= 480);

        if (isWide) {
            // ==========================================
            // WIDESCREEN / SIDE DOCK MODE
            // ==========================================
            const maxAvailableHeight = Math.max(150, this.height - topPadding - bottomPadding);
            const sideDockWidth = Math.min(260, Math.max(105, Math.round(this.width * 0.24)));
            const maxAvailableWidthForBoard = Math.max(150, this.width - sideDockWidth - (sidePadding * 3));

            // Maximum square board size that fits in available width and height
            const maxBoardSize = Math.max(150, Math.min(maxAvailableWidthForBoard, maxAvailableHeight));
            const gap = Math.max(2, Math.min(5, Math.round(maxBoardSize / 120)));
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
            const slotGap = Math.max(4, Math.min(12, Math.round((actualBoardSize - 20) * 0.03)));
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
            const maxAvailableWidth = Math.max(150, this.width - sidePadding * 2);
            const dockHeight = Math.min(150, Math.max(72, Math.round(this.height * (this.height > 820 ? 0.18 : 0.22))));
            const minGapBetween = isMobile ? 8 : 12;
            const maxAvailableHeightForBoard = Math.max(150, this.height - dockHeight - topPadding - bottomPadding - minGapBetween);

            const maxBoardSize = Math.max(150, Math.min(maxAvailableWidth, maxAvailableHeightForBoard));
            const gap = Math.max(2, Math.min(5, Math.round(maxBoardSize / 120)));
            const outerPadding = Math.round(gap * 1.5);
            const cellSize = Math.floor((maxBoardSize - (outerPadding * 2) - (gap * 7)) / 8);
            const actualBoardSize = cellSize * 8 + gap * 7 + outerPadding * 2;

            const extraVerticalSpace = Math.max(0, this.height - actualBoardSize - dockHeight - topPadding - bottomPadding - minGapBetween);
            const boardX = Math.round((this.width - actualBoardSize) / 2);
            const boardY = topPadding + Math.round(extraVerticalSpace * 0.28);

            this.boardMetrics = {
                x: boardX,
                y: boardY,
                size: actualBoardSize,
                cellSize,
                gap,
                outerPadding
            };

            const dockY = boardY + actualBoardSize + minGapBetween + Math.round(extraVerticalSpace * 0.45);
            const dockWidth = actualBoardSize;
            const slotGap = Math.max(4, Math.min(12, Math.round(actualBoardSize * 0.022)));
            const slotWidth = Math.floor((dockWidth - slotGap * 2) / 3);
            const availableDockHeight = Math.max(54, this.height - dockY - bottomPadding);
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
        
        // Fluid responsive Y-axis lift offset matching grid cell size to prevent thumb occlusion
        const responsiveLift = Math.round(Math.min(68, Math.max(36, this.boardMetrics.cellSize * 1.18)));
        this.dragOffset = { x: 0, y: isTouch ? responsiveLift : Math.round(responsiveLift * 0.55) };
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
                    this.drawBeveledBlock(rect.x, rect.y, rect.size, cell.color, false, cell.item);
                    if (cell.item) {
                        this.drawCollectibleItem(rect.x, rect.y, rect.size, cell.item, cell.color);
                    }
                }
            }
        }
    }

    /**
     * Master Collectible Item Renderer (Gems, Puzzles, Stars)
     */
    drawCollectibleItem(x, y, size, itemType, cellColor = null) {
        const ctx = this.ctx;
        const cx = x + size / 2;
        const cy = y + size / 2;

        if (itemType === 'puzzle') {
            const pulse = 0.88 + Math.sin(this.pulsePhase * 1.5) * 0.12;
            this.drawPuzzleCollectible(ctx, cx, cy, size, pulse);
        } else if (itemType === 'star') {
            const pulse = 0.88 + Math.sin(this.pulsePhase * 1.4) * 0.12;
            this.drawStarCollectible(ctx, cx, cy, size, pulse);
        } else {
            const pulse = 0.88 + Math.sin(this.pulsePhase * 1.3) * 0.12;
            this.drawGemCollectible(ctx, cx, cy, size, pulse, cellColor);
        }
    }

    /**
     * Ultra-Polished Jigsaw Puzzle Relic with Smooth Mathematical Tangent Tabs & 3D Glass Sheen
     * Scaled compactly to fit perfectly inside the block shape without overflowing
     */
    drawPuzzleCollectible(ctx, cx, cy, size, pulse) {
        const r = size * 0.25;
        const bw = r * 1.05; // body half width
        const bh = r * 1.05; // body half height
        const x0 = cx - bw;
        const x1 = cx + bw;
        const y0 = cy - bh;
        const y1 = cy + bh;
        const cr = bw * 0.24; // corner radius
        const tw = bw * 0.30; // tab neck width
        const th = bh * 0.38; // tab depth
        const tbw = bw * 0.44; // tab bulb width

        ctx.save();

        // Helper path function for the jigsaw puzzle piece
        const tracePuzzlePath = () => {
            ctx.beginPath();
            // 1. Top Edge with outward connector tab
            ctx.moveTo(x0 + cr, y0);
            ctx.lineTo(cx - tw, y0);
            ctx.bezierCurveTo(cx - tw, y0 - th * 0.35, cx - tbw, y0 - th, cx, y0 - th);
            ctx.bezierCurveTo(cx + tbw, y0 - th, cx + tw, y0 - th * 0.35, cx + tw, y0);
            ctx.lineTo(x1 - cr, y0);
            ctx.quadraticCurveTo(x1, y0, x1, y0 + cr);

            // 2. Right Edge with outward connector tab
            ctx.lineTo(x1, cy - tw);
            ctx.bezierCurveTo(x1 + th * 0.35, cy - tw, x1 + th, cy - tbw, x1 + th, cy);
            ctx.bezierCurveTo(x1 + th, cy + tbw, x1 + th * 0.35, cy + tw, x1, cy + tw);
            ctx.lineTo(x1, y1 - cr);
            ctx.quadraticCurveTo(x1, y1, x1 - cr, y1);

            // 3. Bottom Edge with inward connector socket (notch)
            ctx.lineTo(cx + tw, y1);
            ctx.bezierCurveTo(cx + tw, y1 - th * 0.35, cx + tbw, y1 - th, cx, y1 - th);
            ctx.bezierCurveTo(cx - tbw, y1 - th, cx - tw, y1 - th * 0.35, cx - tw, y1);
            ctx.lineTo(x0 + cr, y1);
            ctx.quadraticCurveTo(x0, y1, x0, y1 - cr);

            // 4. Left Edge with inward connector socket (notch)
            ctx.lineTo(x0, cy + tw);
            ctx.bezierCurveTo(x0 + th * 0.35, cy + tw, x0 + th, cy + tbw, x0 + th, cy);
            ctx.bezierCurveTo(x0 + th, cy - tbw, x0 + th * 0.35, cy - tw, x0, cy - tw);
            ctx.lineTo(x0, y0 + cr);
            ctx.quadraticCurveTo(x0, y0, x0 + cr, y0);
            ctx.closePath();
        };

        // 1. Ambient Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(15, 3, 30, 0.7)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;
        tracePuzzlePath();
        ctx.fillStyle = '#2E0854';
        ctx.fill();
        ctx.restore();

        // 2. Glowing Mystic Amethyst Aura
        ctx.save();
        ctx.shadowColor = 'rgba(216, 70, 239, 0.85)';
        ctx.shadowBlur = 14 * pulse;
        tracePuzzlePath();

        // 3. Multi-Stop Radiant Crystal Amethyst Gradient Fill
        const puzzleGrad = ctx.createLinearGradient(x0 - th, y0 - th, x1 + th, y1 + th);
        puzzleGrad.addColorStop(0.0, '#FDF4FF'); // Luminous crystal highlight
        puzzleGrad.addColorStop(0.2, '#F0ABFC'); // Soft lilac
        puzzleGrad.addColorStop(0.5, '#C084FC'); // Amethyst purple
        puzzleGrad.addColorStop(0.8, '#9333EA'); // Royal violet
        puzzleGrad.addColorStop(1.0, '#581C87'); // Deep cosmic violet
        ctx.fillStyle = puzzleGrad;
        ctx.fill();
        ctx.restore();

        // 4. Beveled Edge Rim Light & Chiseled Border
        tracePuzzlePath();
        const rimGrad = ctx.createLinearGradient(x0, y0 - th, x1 + th, y1);
        rimGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
        rimGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.65)');
        rimGrad.addColorStop(0.7, 'rgba(168, 85, 247, 0.50)');
        rimGrad.addColorStop(1.0, 'rgba(88, 28, 135, 0.80)');
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = Math.max(1.2, size * 0.028);
        ctx.stroke();

        // 5. Curved Glass Sheen Reflection
        ctx.save();
        tracePuzzlePath();
        ctx.clip();
        const glassGrad = ctx.createLinearGradient(x0, y0 - th, x0 + bw * 1.6, y0 + bh * 1.6);
        glassGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.65)');
        glassGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.18)');
        glassGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = glassGrad;
        ctx.beginPath();
        ctx.ellipse(cx - bw * 0.25, y0 + bh * 0.25, bw * 1.35, bh * 0.85, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 6. Inset Center Rune Core Jewel
        const coreR = bw * 0.30;
        ctx.save();
        ctx.shadowColor = 'rgba(240, 171, 252, 0.9)';
        ctx.shadowBlur = 5;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrad.addColorStop(0.0, '#FFFFFF');
        coreGrad.addColorStop(0.4, '#F5D0FE');
        coreGrad.addColorStop(0.8, '#D946EF');
        coreGrad.addColorStop(1.0, '#7C3AED');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(cx, cy - coreR);
        ctx.lineTo(cx + coreR, cy);
        ctx.lineTo(cx, cy + coreR);
        ctx.lineTo(cx - coreR, cy);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(0.8, size * 0.014);
        ctx.stroke();
        ctx.restore();

        // 7. Dynamic Top-Left Specular Sparkle Glint (Gentle pulse)
        const glintX = cx - bw * 0.45;
        const glintY = y0 + bh * 0.18;
        const glintSize = 3.6 + Math.sin(this.pulsePhase * 1.6) * 1.4;
        this.drawSparkleFlare(ctx, glintX, glintY, glintSize, '#FFFFFF', 'rgba(240, 171, 252, 0.9)');

        ctx.restore();
    }

    /**
     * Super-Polished 3D Chiseled Gold Medal Star with Dual-Tone Diamond Facets
     * Slow, majestic rotation and gentle glimmer
     */
    drawStarCollectible(ctx, cx, cy, size, pulse) {
        const outerR = size * 0.35;
        const innerR = outerR * 0.45;
        const points = 5;

        // Calculate all 5 outer tips and 5 inner valleys
        const outerPts = [];
        const innerPts = [];
        for (let k = 0; k < points; k++) {
            const outAngle = -Math.PI / 2 + (k * 2 * Math.PI) / points;
            const inAngle = -Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / points;
            outerPts.push({ x: cx + Math.cos(outAngle) * outerR, y: cy + Math.sin(outAngle) * outerR });
            innerPts.push({ x: cx + Math.cos(inAngle) * innerR, y: cy + Math.sin(inAngle) * innerR });
        }

        ctx.save();

        // 1. Soft Ambient Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(40, 20, 0, 0.65)';
        ctx.shadowBlur = 9;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        for (let k = 0; k < points; k++) {
            if (k === 0) ctx.moveTo(outerPts[k].x, outerPts[k].y);
            else ctx.lineTo(outerPts[k].x, outerPts[k].y);
            ctx.lineTo(innerPts[k].x, innerPts[k].y);
        }
        ctx.closePath();
        ctx.fillStyle = '#5A2A04';
        ctx.fill();
        ctx.restore();

        // 2. Radiant Golden Corona Aura (Calm pulse)
        ctx.save();
        ctx.shadowColor = 'rgba(250, 204, 21, 0.9)';
        ctx.shadowBlur = 16 * pulse;

        // 3. 3D Faceted Origami Shading: Draw 10 Alternating Light & Shadow Triangles
        for (let k = 0; k < points; k++) {
            const prevValley = innerPts[(k - 1 + points) % points];
            const nextValley = innerPts[k];
            const tip = outerPts[k];

            // 3A. Light Facet (Clockwise half-triangle: Center -> Tip -> NextValley)
            const lightGrad = ctx.createLinearGradient(tip.x, tip.y, cx, cy);
            lightGrad.addColorStop(0.0, '#FFFFFF'); // Diamond tip specular
            lightGrad.addColorStop(0.22, '#FFFBEB'); // Champagne gold
            lightGrad.addColorStop(0.55, '#FDE047'); // Brilliant sunny gold
            lightGrad.addColorStop(1.0, '#EAB308'); // Warm amber gold
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(tip.x, tip.y);
            ctx.lineTo(nextValley.x, nextValley.y);
            ctx.closePath();
            ctx.fill();

            // 3B. Shadow Facet (Counter-clockwise half-triangle: Center -> Tip -> PrevValley)
            const shadowGrad = ctx.createLinearGradient(tip.x, tip.y, cx, cy);
            shadowGrad.addColorStop(0.0, '#FACC15'); // Bright golden tip
            shadowGrad.addColorStop(0.35, '#CA8A04'); // Rich burnished gold
            shadowGrad.addColorStop(0.75, '#A16207'); // Deep golden bronze
            shadowGrad.addColorStop(1.0, '#78350F'); // Dark topaz shadow
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(tip.x, tip.y);
            ctx.lineTo(prevValley.x, prevValley.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // 4. Facet Ridge Highlight Lines
        for (let k = 0; k < points; k++) {
            const tip = outerPts[k];
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.lineWidth = Math.max(0.8, size * 0.016);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();

            const valley = innerPts[k];
            ctx.strokeStyle = 'rgba(120, 53, 15, 0.45)';
            ctx.lineWidth = Math.max(0.8, size * 0.016);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(valley.x, valley.y);
            ctx.stroke();
        }

        // 5. Crisp Perimeter Bevel Stroke
        ctx.beginPath();
        for (let k = 0; k < points; k++) {
            if (k === 0) ctx.moveTo(outerPts[k].x, outerPts[k].y);
            else ctx.lineTo(outerPts[k].x, outerPts[k].y);
            ctx.lineTo(innerPts[k].x, innerPts[k].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = Math.max(1.2, size * 0.024);
        ctx.stroke();

        // 6. Center Solar Core Crown
        const coreR = innerR * 0.58;
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        coreGrad.addColorStop(0.0, '#FFFFFF');
        coreGrad.addColorStop(0.4, '#FEF9C3');
        coreGrad.addColorStop(0.8, '#FACC15');
        coreGrad.addColorStop(1.0, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // 7. Dynamic 4-Point Diamond Sparkle Flare at Top Star Tip (Slow, majestic glint)
        const topTip = outerPts[0];
        const flareSize = 4.6 + Math.sin(this.pulsePhase * 1.6) * 1.8;
        this.drawSparkleFlare(ctx, topTip.x, topTip.y, flareSize, '#FFFFFF', 'rgba(254, 240, 138, 0.95)');

        // 8. Orbiting Golden Micro-Stardust Sparkles (Slow, graceful cosmic orbit)
        const orbitAngle = this.pulsePhase * 0.65;
        const orbDist1 = outerR * 1.15;
        const orbDist2 = outerR * 0.95;
        this.drawMiniSparkleDot(ctx, cx + Math.cos(orbitAngle) * orbDist1, cy + Math.sin(orbitAngle) * orbDist1, 2.0, '#FEF08A');
        this.drawMiniSparkleDot(ctx, cx + Math.cos(orbitAngle + Math.PI) * orbDist2, cy + Math.sin(orbitAngle + Math.PI) * orbDist2, 1.6, '#FFFFFF');

        ctx.restore();
    }

    /**
     * Multi-Faceted Gemstone Renderer (Emerald, Ruby, Sapphire, Topaz, Diamond)
     * Slow, calm breathing radiance
     */
    drawGemCollectible(ctx, cx, cy, size, pulse, cellColor = null) {
        const r = size * 0.32;
        const outerR = r * 1.06;

        ctx.save();

        // Determine jewel color palette
        let glowColor = 'rgba(56, 189, 248, 0.85)';
        let cLight = '#E0F2FE';
        let cMid = '#38BDF8';
        let cDark = '#0284C7';

        if (cellColor && cellColor.hex) {
            const hex = cellColor.hex.toLowerCase();
            if (hex.includes('10b981') || hex.includes('10b') || hex.includes('emerald') || hex.includes('059669')) {
                // Emerald
                glowColor = 'rgba(16, 185, 129, 0.85)';
                cLight = '#D1FAE5';
                cMid = '#34D399';
                cDark = '#059669';
            } else if (hex.includes('ef4444') || hex.includes('dc2626') || hex.includes('ruby')) {
                // Ruby
                glowColor = 'rgba(239, 68, 68, 0.85)';
                cLight = '#FEE2E2';
                cMid = '#F87171';
                cDark = '#DC2626';
            } else if (hex.includes('f97316') || hex.includes('fbbf24') || hex.includes('topaz')) {
                // Topaz / Amber
                glowColor = 'rgba(249, 115, 22, 0.85)';
                cLight = '#FFEDD5';
                cMid = '#FB923C';
                cDark = '#C2410C';
            } else if (hex.includes('8b5cf6') || hex.includes('purple')) {
                // Amethyst
                glowColor = 'rgba(139, 92, 246, 0.85)';
                cLight = '#EDE9FE';
                cMid = '#A78BFA';
                cDark = '#6D28D9';
            }
        }

        // 1. Outer Glow Aura (Slow, gentle pulsation)
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14 * pulse;

        // 2. Main Diamond Silhouette (Rotated 45-degree Square)
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        ctx.lineTo(cx + outerR, cy);
        ctx.lineTo(cx, cy + outerR);
        ctx.lineTo(cx - outerR, cy);
        ctx.closePath();

        // 3. Jewel Gradient Fill
        const gemGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
        gemGrad.addColorStop(0, cLight);
        gemGrad.addColorStop(0.4, cMid);
        gemGrad.addColorStop(1, cDark);
        ctx.fillStyle = gemGrad;
        ctx.fill();

        // 4. Crisp Diamond Border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = Math.max(1, size * 0.026);
        ctx.stroke();

        // 5. Facet Highlight: Top-Left Triangle
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        ctx.lineTo(cx - outerR, cy);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fill();

        // 6. Facet Highlight: Top-Right Triangle
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        ctx.lineTo(cx + outerR, cy);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        ctx.fill();

        // 7. Facet Shadow: Bottom-Right Triangle
        ctx.beginPath();
        ctx.moveTo(cx + outerR, cy);
        ctx.lineTo(cx, cy + outerR);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.fill();

        // 8. Cross-line Facet Edges
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = Math.max(0.5, size * 0.015);
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerR);
        ctx.lineTo(cx, cy + outerR);
        ctx.moveTo(cx - outerR, cy);
        ctx.lineTo(cx + outerR, cy);
        ctx.stroke();

        // 9. Diamond Glint Flare (Slow, calm shimmer)
        const flareSize = 3.8 + Math.sin(this.pulsePhase * 1.5) * 1.5;
        this.drawSparkleFlare(ctx, cx - r * 0.28, cy - r * 0.32, flareSize, '#FFFFFF', glowColor);

        ctx.restore();
    }

    /**
     * High-Precision 4-Point Diamond Sparkle Flare / Specular Glint
     */
    drawSparkleFlare(ctx, x, y, size, coreColor = '#FFFFFF', glowColor = 'rgba(255, 255, 255, 0.8)') {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = size * 2.2;

        ctx.fillStyle = coreColor;
        ctx.beginPath();
        // Top ray
        ctx.moveTo(x, y - size);
        ctx.quadraticCurveTo(x, y, x + size * 0.22, y);
        // Right ray
        ctx.lineTo(x + size, y);
        ctx.quadraticCurveTo(x, y, x, y + size * 0.22);
        // Bottom ray
        ctx.lineTo(x, y + size);
        ctx.quadraticCurveTo(x, y, x - size * 0.22, y);
        // Left ray
        ctx.lineTo(x - size, y);
        ctx.quadraticCurveTo(x, y, x, y - size * 0.22);
        ctx.closePath();
        ctx.fill();

        // Crisp central specular dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, Math.max(1, size * 0.25), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * Orbiting Micro Twinkle Dot
     */
    drawMiniSparkleDot(ctx, x, y, radius, color = '#FFFFFF') {
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = radius * 3.5;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
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
                const pad = Math.max(12, Math.min(24, Math.round(slot.width * 0.12)));
                const miniBlockSize = Math.round(Math.min((slot.width - pad) / maxDim, (slot.height - pad) / maxDim, this.boardMetrics.cellSize * 0.72));
                const pieceGap = Math.max(1, Math.min(3, Math.round(miniBlockSize * 0.08)));
                const shapePixelW = shape.cols * (miniBlockSize + pieceGap) - pieceGap;
                const shapePixelH = shape.rows * (miniBlockSize + pieceGap) - pieceGap;

                const startX = Math.round(slot.x + (slot.width - shapePixelW) / 2);
                const startY = Math.round(slot.y + (slot.height - shapePixelH) / 2 + 1);

                for (let r = 0; r < shape.rows; r++) {
                    for (let c = 0; c < shape.cols; c++) {
                        if (shape.form[r][c]) {
                            const bx = startX + c * (miniBlockSize + pieceGap);
                            const by = startY + r * (miniBlockSize + pieceGap);
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
    drawBeveledBlock(x, y, size, color, isGhost = false, itemType = null, targetCtx = null) {
        const ctx = targetCtx || this.ctx;
        const squareSize = Math.round(size);
        const radius = Math.max(3, Math.round(squareSize * 0.14));

        let hex = color.hex || '#3B82F6';
        let light = color.light || '#93C5FD';
        let dark = color.dark || '#1D4ED8';

        // Thematic base pedestals for Adventure mode collectibles
        if (itemType === 'puzzle') {
            hex = '#2E0854';
            light = '#4C1D95';
            dark = '#17032B';
        } else if (itemType === 'star') {
            hex = '#451A03';
            light = '#78350F';
            dark = '#240B02';
        }

        ctx.save();

        // 1. Base Gradient Fill (True Square)
        const bgGrad = ctx.createLinearGradient(x, y, x, y + squareSize);
        bgGrad.addColorStop(0, light);
        bgGrad.addColorStop(0.7, hex);
        bgGrad.addColorStop(1, dark);

        ctx.fillStyle = bgGrad;
        this.roundRect(x, y, squareSize, squareSize, radius, ctx);
        ctx.fill();

        // 2. Beveled top/left highlight
        const bevelSize = Math.max(2, Math.round(squareSize * 0.12));
        ctx.save();
        ctx.fillStyle = itemType === 'puzzle' ? 'rgba(232, 121, 249, 0.40)' : (itemType === 'star' ? 'rgba(253, 224, 71, 0.40)' : 'rgba(255, 255, 255, 0.35)');
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

        // 3. Inner glossy center sheen or recessed relic cavity
        const innerRadius = Math.max(2, Math.round(radius * 0.6));
        const innerMargin = bevelSize * 0.8;
        const innerSize = Math.max(2, squareSize - innerMargin * 2);

        if (itemType) {
            // Recessed glowing relic bed
            const bedGrad = ctx.createRadialGradient(x + squareSize / 2, y + squareSize / 2, 0, x + squareSize / 2, y + squareSize / 2, innerSize * 0.7);
            if (itemType === 'puzzle') {
                bedGrad.addColorStop(0, 'rgba(88, 28, 135, 0.6)');
                bedGrad.addColorStop(1, 'rgba(18, 2, 36, 0.9)');
            } else if (itemType === 'star') {
                bedGrad.addColorStop(0, 'rgba(120, 53, 15, 0.6)');
                bedGrad.addColorStop(1, 'rgba(28, 8, 2, 0.9)');
            } else {
                bedGrad.addColorStop(0, 'rgba(3, 105, 161, 0.5)');
                bedGrad.addColorStop(1, 'rgba(2, 44, 75, 0.8)');
            }
            ctx.fillStyle = bedGrad;
            this.roundRect(x + innerMargin, y + innerMargin, innerSize, innerSize, innerRadius, ctx);
            ctx.fill();

            // Inlaid rim line
            ctx.strokeStyle = itemType === 'puzzle' ? 'rgba(192, 132, 252, 0.45)' : (itemType === 'star' ? 'rgba(250, 204, 21, 0.45)' : 'rgba(125, 211, 252, 0.45)');
            ctx.lineWidth = 1;
            this.roundRect(x + innerMargin, y + innerMargin, innerSize, innerSize, innerRadius, ctx);
            ctx.stroke();
        } else {
            const innerGrad = ctx.createLinearGradient(x + innerMargin, y + innerMargin, x + innerMargin, y + innerMargin + innerSize);
            innerGrad.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
            innerGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
            innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');

            ctx.fillStyle = innerGrad;
            this.roundRect(x + innerMargin, y + innerMargin, innerSize, innerSize, innerRadius, ctx);
            ctx.fill();
        }

        ctx.restore();
    }



    roundRect(x, y, width, height, radius, targetCtx = null) {
        const ctx = targetCtx || this.ctx;
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
