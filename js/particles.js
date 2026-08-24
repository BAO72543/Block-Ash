/**
 * Block Blast - Particle, Sweeper and Visual FX System
 * High-performance canvas particle animations, sweeping laser line beams, shockwaves, floating text, and confetti.
 * Features:
 * - 3D Chiseled Rolling Star Comet Head with Faceted Origami Shading & Blazing Radial Bloom
 * - Multi-Pass High-Intensity Core Laser Blades with Trailing Glow Channels & Sonic Shockwaves
 * - Sequential Domino Block Slicing: blocks remain visible in energized charging state and vaporize into color-matched shards
 * - Perpendicular High-Speed Micro-Spark Jets & Cosmic Stardust Ribbon Trails
 * - Multi-Line Cross-Intersection Hypernova Detonations with Concentric Rings
 * - Synchronized Ascending Musical Solfege Arpeggio Pops
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.sweepers = [];
        this.clearingCells = [];
        this.supernovas = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.onCellTriggerCallback = null;

        // Default effects skin: Golden Rolling Star Laser
        this.currentEffects = {
            particleShape: 'star',
            headShape: 'star',
            particleColors: ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF', '#FEF08A'],
            waveColor: 'rgba(254, 240, 138, 0.95)',
            floatingTextColor: '#FDE047',
            glowColor: 'rgba(245, 158, 11, 0.90)'
        };
    }

    setCellTriggerCallback(cb) {
        this.onCellTriggerCallback = cb;
    }

    setSkinEffects(effects) {
        if (effects) {
            this.currentEffects = {
                particleShape: effects.particleShape || 'star',
                headShape: effects.headShape || effects.particleShape || 'star',
                particleColors: effects.particleColors || ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF', '#FEF08A'],
                waveColor: effects.waveColor || 'rgba(255, 255, 255, 0.95)',
                floatingTextColor: effects.floatingTextColor || '#FDE047',
                glowColor: effects.glowColor || 'rgba(245, 158, 11, 0.90)'
            };
        }
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.sweepers = [];
        this.clearingCells = [];
        this.supernovas = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(intensity = 6, duration = 200) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTime = Math.max(this.shakeTime, duration);
    }

    /**
     * Start a sweeping laser beam across an entire row or column with smooth cubic easing,
     * glowing 3D rolling star comet head, sequential cascading block pops, and lateral spark discharge
     */
    addLineClearSweep(type, index, gridX, gridY, cellSize, gap, shapeColor, comboCount = 0, cellsData = null, lineLength = 8) {
        const totalLength = lineLength * (cellSize + gap) - gap;
        const isRow = type === 'row';
        const eff = this.currentEffects;
        const comboScale = 1.0 + Math.min(0.65, (comboCount || 0) * 0.14);

        const startX = isRow ? gridX : (gridX + index * (cellSize + gap) + cellSize / 2);
        const startY = isRow ? (gridY + index * (cellSize + gap) + cellSize / 2) : gridY;
        const endX = isRow ? (gridX + totalLength) : startX;
        const endY = isRow ? startY : (gridY + totalLength);

        // Ambient background shockwave
        this.shockwaves.push({
            type,
            x: isRow ? gridX : startX,
            y: isRow ? startY : gridY,
            width: isRow ? totalLength : cellSize * 2.0 * comboScale,
            height: isRow ? cellSize * 2.0 * comboScale : totalLength,
            alpha: 1.0,
            decay: 0.034,
            color: eff.waveColor
        });

        // Register clearing cells along the path with full block snapshot colors
        const sweepCells = [];
        for (let c = 0; c < lineLength; c++) {
            const cellRow = isRow ? index : c;
            const cellCol = isRow ? c : index;
            const cx = gridX + cellCol * (cellSize + gap);
            const cy = gridY + cellRow * (cellSize + gap);

            const snapCell = (cellsData && cellsData[c]) ? cellsData[c] : null;
            const specificColor = (snapCell && snapCell.color) ? snapCell.color : (shapeColor || { hex: '#3B82F6', light: '#93C5FD', dark: '#1D4ED8' });

            const cellObj = {
                row: cellRow,
                col: cellCol,
                x: cx,
                y: cy,
                size: cellSize,
                color: specificColor,
                item: snapCell ? snapCell.item : null,
                state: 'charging', // charging (energized on board) -> popping -> fading
                scale: 1.0,
                alpha: 1.0,
                glowAlpha: 0.3,
                shimmer: c * 0.4,
                decay: 0.09
            };
            sweepCells.push(cellObj);
            this.clearingCells.push(cellObj);
        }

        this.sweepers.push({
            type,
            index,
            isRow,
            gridX,
            gridY,
            cellSize,
            gap,
            startX,
            startY,
            endX,
            endY,
            totalLength,
            lineLength,
            elapsedTime: 0,
            duration: lineLength <= 4 ? 230 : 275, // Scaled cushioned travel time
            progress: 0,
            comboCount: comboCount || 0,
            comboScale,
            triggeredCells: new Array(lineLength).fill(false),
            cells: sweepCells,
            shapeColor: shapeColor || { hex: '#3B82F6', light: '#93C5FD', dark: '#1D4ED8' },
            particleShape: eff.particleShape || 'star',
            headShape: eff.headShape || eff.particleShape || 'star',
            waveColor: eff.waveColor || 'rgba(255, 255, 255, 0.95)',
            glowColor: eff.glowColor || 'rgba(245, 158, 11, 0.90)',
            particleColors: eff.particleColors || ['#FDE68A', '#F59E0B', '#FFFFFF'],
            headRotation: 0,
            alpha: 1.0,
            stardustTimer: 0
        });
    }

    addLineClearWave(type, index, gridX, gridY, cellSize, gap, shapeColor = null, comboCount = 0, lineLength = 8) {
        this.addLineClearSweep(type, index, gridX, gridY, cellSize, gap, shapeColor, comboCount, null, lineLength);
    }

    /**
     * Multi-Line Clear Intersections: triggers hypernova detonations where rows and columns cross
     */
    addCrossIntersections(rows, cols, gridX, gridY, cellSize, gap, comboCount = 0) {
        if (!rows || !cols || rows.length === 0 || cols.length === 0) return;

        const eff = this.currentEffects;
        for (const r of rows) {
            for (const c of cols) {
                const cx = gridX + c * (cellSize + gap) + cellSize / 2;
                const cy = gridY + r * (cellSize + gap) + cellSize / 2;

                this.supernovas.push({
                    x: cx,
                    y: cy,
                    radius: 12,
                    maxRadius: cellSize * 2.4,
                    alpha: 1.0,
                    decay: 0.038,
                    color: eff.glowColor || 'rgba(251, 191, 36, 0.9)',
                    haloColor: '#FFFFFF',
                    sparksEmitted: false
                });
            }
        }
    }

    /**
     * Lateral micro-sparks shooting perpendicularly away from the sweeping cutting contact point
     */
    addSweepSparks(x, y, isRow, shape, colors, comboScale = 1.0) {
        const count = Math.floor((6 + Math.random() * 5) * comboScale);
        for (let i = 0; i < count; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const vx = isRow ? (Math.random() - 0.5) * 3.5 : side * (4.0 + Math.random() * 6.5);
            const vy = isRow ? side * (4.0 + Math.random() * 6.5) : (Math.random() - 0.5) * 3.5;
            const color = colors[Math.floor(Math.random() * colors.length)] || '#FFFFFF';

            this.particles.push({
                x,
                y,
                vx,
                vy,
                gravity: 0.12,
                drag: 0.93,
                size: (4 + Math.random() * 8) * comboScale,
                baseSize: (4 + Math.random() * 8) * comboScale,
                color,
                alpha: 1.0,
                decay: 0.024 + Math.random() * 0.026,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.45,
                shape
            });
        }
    }

    /**
     * Trailing stardust sparks drifting behind the rolling star comet head
     */
    addRollingStarTrailSparks(x, y, isRow, colors, comboScale = 1.0) {
        for (let i = 0; i < 2; i++) {
            const side = (Math.random() - 0.5) * 14;
            const vx = isRow ? -1.8 - Math.random() * 2.8 : side * 0.35;
            const vy = isRow ? side * 0.35 : -1.8 - Math.random() * 2.8;
            const color = colors[Math.floor(Math.random() * colors.length)] || '#FFFFFF';

            this.particles.push({
                x: isRow ? x - 6 : x + side,
                y: isRow ? y + side : y - 6,
                vx,
                vy,
                gravity: 0.06,
                drag: 0.94,
                size: (3.5 + Math.random() * 5.5) * comboScale,
                baseSize: (3.5 + Math.random() * 5.5) * comboScale,
                color,
                alpha: 0.95,
                decay: 0.035 + Math.random() * 0.035,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.35,
                shape: Math.random() > 0.4 ? 'star' : 'sparkle'
            });
        }
    }

    /**
     * Burst of jewel / neon block particles from a destroyed cell matching its exact color & skin effect
     */
    addBlockClearBurst(x, y, size, color, comboScale = 1.0) {
        const count = Math.floor((16 + Math.random() * 9) * comboScale);
        const hex = (color && color.hex) ? color.hex : '#3B82F6';
        const light = (color && color.light) ? color.light : '#93C5FD';
        const effectShape = this.currentEffects.particleShape || 'star';
        const pColors = this.currentEffects.particleColors || [hex, light, '#FFFFFF'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3.2 + Math.random() * 8.0;
            const pSize = ((size * 0.18) + Math.random() * (size * 0.25)) * comboScale;
            const chosenColor = Math.random() > 0.30
                ? (Math.random() > 0.5 ? hex : light)
                : pColors[Math.floor(Math.random() * pColors.length)];

            this.particles.push({
                x: x + size / 2,
                y: y + size / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.2,
                gravity: 0.22,
                drag: 0.94,
                size: pSize,
                baseSize: pSize,
                color: chosenColor,
                alpha: 1.0,
                decay: 0.016 + Math.random() * 0.020,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.35,
                shape: Math.random() > 0.15 ? effectShape : 'sparkle'
            });
        }
    }

    /**
     * Specialized particle burst and radiant FX for Adventure Collectibles (Gems, Puzzles, Stars)
     */
    addCollectiblePickupBurst(x, y, size, itemType, cellColor = null) {
        const cx = x + size / 2;
        const cy = y + size / 2;

        if (itemType === 'puzzle') {
            const pColors = ['#FDF4FF', '#F5D0FE', '#E879F9', '#C084FC', '#9333EA', '#FFFFFF'];
            for (let i = 0; i < 26; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3.5 + Math.random() * 8.5;
                const pSize = (size * 0.16) + Math.random() * (size * 0.22);
                this.particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2.5,
                    gravity: 0.20,
                    drag: 0.94,
                    size: pSize,
                    baseSize: pSize,
                    color: pColors[Math.floor(Math.random() * pColors.length)],
                    alpha: 1.0,
                    decay: 0.016 + Math.random() * 0.018,
                    rotation: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.4,
                    shape: Math.random() > 0.4 ? 'diamond' : 'sparkle'
                });
            }
        } else if (itemType === 'star') {
            const pColors = ['#FFFBEB', '#FEF08A', '#FDE047', '#FACC15', '#EAB308', '#FFFFFF'];
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 4.0 + Math.random() * 9.5;
                const pSize = (size * 0.18) + Math.random() * (size * 0.24);
                this.particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 3.0,
                    gravity: 0.22,
                    drag: 0.94,
                    size: pSize,
                    baseSize: pSize,
                    color: pColors[Math.floor(Math.random() * pColors.length)],
                    alpha: 1.0,
                    decay: 0.014 + Math.random() * 0.018,
                    rotation: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.4,
                    shape: Math.random() > 0.35 ? 'star' : 'sparkle'
                });
            }
        } else {
            const baseHex = (cellColor && cellColor.hex) ? cellColor.hex : '#38BDF8';
            const baseLight = (cellColor && cellColor.light) ? cellColor.light : '#E0F2FE';
            const pColors = [baseLight, baseHex, '#FFFFFF', '#BAE6FD'];
            for (let i = 0; i < 24; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 3.5 + Math.random() * 8.0;
                const pSize = (size * 0.16) + Math.random() * (size * 0.22);
                this.particles.push({
                    x: cx,
                    y: cy,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2.5,
                    gravity: 0.20,
                    drag: 0.94,
                    size: pSize,
                    baseSize: pSize,
                    color: pColors[Math.floor(Math.random() * pColors.length)],
                    alpha: 1.0,
                    decay: 0.016 + Math.random() * 0.018,
                    rotation: Math.random() * Math.PI * 2,
                    vRot: (Math.random() - 0.5) * 0.4,
                    shape: Math.random() > 0.4 ? 'diamond' : 'sparkle'
                });
            }
        }
    }

    /**
     * Score Pop-Ups with Bold Gold Typography ("Great!", "Perfect!", "COMBO x4!")
     */
    addFloatingText(text, x, y, options = {}) {
        const isGold = options.isGold !== undefined ? options.isGold : (options.color === '#FFD700' || options.color === '#F59E0B' || options.color === '#FBBF24');
        const color = options.color || (isGold ? '#FFD700' : '#FFFFFF');
        const fontSize = options.fontSize || (isGold ? 32 : 24);
        const font = options.font || `900 ${fontSize}px Outfit, Inter, sans-serif`;
        const shadow = options.shadow || (isGold ? '#78350F' : 'rgba(0, 0, 0, 0.7)');

        const safeY = Math.max(32, y);
        this.floatingTexts.push({
            text,
            x,
            y: safeY,
            vy: options.vy || -2.4,
            alpha: 1.0,
            scale: 0.35,
            targetScale: isGold ? 1.35 : 1.15,
            decay: isGold ? 0.012 : 0.018,
            color,
            fontSize,
            font,
            shadow,
            isGold,
            life: 0
        });
    }

    /**
     * Golden upward arcing sparks that float towards the top score counter
     */
    addScoreAbsorptionSparks(startX, startY, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
            const speed = 4.0 + Math.random() * 5.5;
            this.particles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.0,
                gravity: -0.05,
                drag: 0.96,
                size: 4 + Math.random() * 5,
                baseSize: 4 + Math.random() * 5,
                color: Math.random() > 0.4 ? '#FDE047' : '#BEF264',
                alpha: 1.0,
                decay: 0.025 + Math.random() * 0.02,
                rotation: Math.random() * Math.PI * 2,
                vRot: 0.3,
                shape: 'sparkle'
            });
        }
    }

    /**
     * Confetti celebration for High Score & All Clear
     */
    addConfettiBurst(canvasWidth, canvasHeight, count = 80) {
        const colors = ['#FBBF24', '#F97316', '#EF4444', '#10B981', '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'];
        for (let i = 0; i < count; i++) {
            this.confetti.push({
                x: canvasWidth * 0.1 + Math.random() * (canvasWidth * 0.8),
                y: canvasHeight * 0.2 + Math.random() * (canvasHeight * 0.3),
                vx: (Math.random() - 0.5) * 12,
                vy: -6 - Math.random() * 8,
                gravity: 0.22,
                drag: 0.98,
                w: 8 + Math.random() * 8,
                h: 12 + Math.random() * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.2,
                oscillation: Math.random() * Math.PI * 2,
                vOsc: 0.05 + Math.random() * 0.05,
                alpha: 1.0,
                decay: 0.008 + Math.random() * 0.008
            });
        }
    }

    update(dt) {
        // 1. Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeIntensity = 0;
            }
        }

        // 2. Update Supernova Cross-Intersections
        for (let i = this.supernovas.length - 1; i >= 0; i--) {
            const sn = this.supernovas[i];
            sn.radius += (sn.maxRadius - sn.radius) * 0.16;
            sn.alpha -= sn.decay;

            if (!sn.sparksEmitted && sn.radius > sn.maxRadius * 0.4) {
                sn.sparksEmitted = true;
                this.addBlockClearBurst(sn.x - 20, sn.y - 20, 40, { hex: '#FFFFFF', light: '#FEF08A' }, 1.5);
                this.triggerShake(10, 240);
            }

            if (sn.alpha <= 0) {
                this.supernovas.splice(i, 1);
            }
        }

        // 3. Update Sweeping Laser Waves with 3D Rolling Star Comet Heads & Domino Pops
        for (let i = this.sweepers.length - 1; i >= 0; i--) {
            const sw = this.sweepers[i];
            sw.elapsedTime += dt;
            const t = Math.min(1.0, sw.elapsedTime / sw.duration);

            // Smooth cubic-out easing curve: rapid energetic surge with cushioned completion
            sw.progress = 1 - Math.pow(1 - t, 2.7);

            // True rolling rotation matching distance along the row/column
            const rolledDistance = sw.progress * sw.totalLength;
            sw.headRotation = (rolledDistance / (sw.cellSize * 0.36)) + (sw.elapsedTime * 0.006);

            const clampedP = Math.min(1.0, sw.progress);
            const headX = sw.isRow ? (sw.startX + clampedP * sw.totalLength) : sw.startX;
            const headY = sw.isRow ? sw.startY : (sw.startY + clampedP * sw.totalLength);

            // Trailing cosmic stardust emissions behind the rolling star
            sw.stardustTimer = (sw.stardustTimer || 0) + dt;
            if (sw.stardustTimer >= 22 && t < 0.95) {
                sw.stardustTimer = 0;
                this.addRollingStarTrailSparks(headX, headY, sw.isRow, sw.particleColors, sw.comboScale);
            }

            // Domino sequential vaporization as rolling star passes each cell
            const count = sw.lineLength || 8;
            for (let c = 0; c < count; c++) {
                const threshold = (c + 0.32) / count;
                if (sw.progress >= threshold && !sw.triggeredCells[c]) {
                    sw.triggeredCells[c] = true;

                    const cell = sw.cells ? sw.cells[c] : null;
                    if (cell) {
                        cell.state = 'popping';
                    }

                    const cellRow = sw.isRow ? sw.index : c;
                    const cellCol = sw.isRow ? c : sw.index;
                    const cellX = sw.gridX + cellCol * (sw.cellSize + sw.gap);
                    const cellY = sw.gridY + cellRow * (sw.cellSize + sw.gap);
                    const cellColor = (cell && cell.color) ? cell.color : sw.shapeColor;

                    // Notify audio callback for ascending musical Solfege note
                    if (this.onCellTriggerCallback) {
                        this.onCellTriggerCallback(c, sw.comboCount);
                    }

                    // Explode block into color-matched shards
                    this.addBlockClearBurst(cellX, cellY, sw.cellSize, cellColor, sw.comboScale);

                    // Lateral high-velocity cutting sparks
                    this.addSweepSparks(
                        cellX + sw.cellSize / 2,
                        cellY + sw.cellSize / 2,
                        sw.isRow,
                        sw.particleShape,
                        sw.particleColors,
                        sw.comboScale
                    );
                }
            }

            if (t >= 1.0) {
                this.sweepers.splice(i, 1);
            }
        }

        // 4. Update Dissolving Clearing Cells (Smooth pre-clear charge, scale bloom and vaporization)
        for (let i = this.clearingCells.length - 1; i >= 0; i--) {
            const cc = this.clearingCells[i];
            if (cc.state === 'charging') {
                cc.shimmer = (cc.shimmer || 0) + dt * 0.014;
                cc.glowAlpha = 0.30 + Math.sin(cc.shimmer * 5) * 0.20;
            } else if (cc.state === 'popping' || cc.state === 'blooming') {
                cc.scale = Math.min(1.22, cc.scale + 0.038);
                cc.glowAlpha = Math.min(1.0, cc.glowAlpha + 0.15);
                cc.alpha -= cc.decay;
                if (cc.alpha <= 0.05) {
                    this.clearingCells.splice(i, 1);
                }
            }
        }

        // 5. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.vx *= p.drag;
            p.vy *= p.drag;
            p.rotation += p.vRot;
            p.alpha -= p.decay;
            p.size = p.baseSize * (p.alpha);

            if (p.alpha <= 0 || p.size <= 0.5) {
                this.particles.splice(i, 1);
            }
        }

        // 6. Update Ambient Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.alpha -= sw.decay;
            if (sw.alpha <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // 7. Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life += dt;
            ft.y += ft.vy;
            ft.vy *= 0.95;

            // Elastic spring scale bounce
            if (ft.scale < ft.targetScale) {
                ft.scale = Math.min(ft.targetScale, ft.scale + 0.12);
            }

            if (ft.life > 320) {
                ft.alpha -= ft.decay;
            }

            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // 8. Update Confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx + Math.sin(c.oscillation) * 1.5;
            c.y += c.vy;
            c.vy += c.gravity;
            c.vx *= c.drag;
            c.rotation += c.vRot;
            c.oscillation += c.vOsc;
            c.alpha -= c.decay;

            if (c.alpha <= 0 || c.y > 2000) {
                this.confetti.splice(i, 1);
            }
        }
    }

    getShakeOffset() {
        if (this.shakeIntensity <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() - 0.5) * 2 * this.shakeIntensity,
            y: (Math.random() - 0.5) * 2 * this.shakeIntensity
        };
    }

    roundRect(ctx, x, y, width, height, radius) {
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

    /**
     * Master 3D Chiseled Rolling Star Head Renderer
     * 10 alternating faceted triangles, diamond specular core, and golden rim
     */
    drawRollingStarHead(ctx, flareSize, glowColor, skinColors) {
        const outerR = flareSize;
        const innerR = flareSize * 0.46;
        const points = 5;

        const outerPts = [];
        const innerPts = [];
        for (let k = 0; k < points; k++) {
            const outAngle = -Math.PI / 2 + (k * 2 * Math.PI) / points;
            const inAngle = -Math.PI / 2 + ((k + 0.5) * 2 * Math.PI) / points;
            outerPts.push({ x: Math.cos(outAngle) * outerR, y: Math.sin(outAngle) * outerR });
            innerPts.push({ x: Math.cos(inAngle) * innerR, y: Math.sin(inAngle) * innerR });
        }

        // 1. Soft Ambient Drop Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        for (let k = 0; k < points; k++) {
            if (k === 0) ctx.moveTo(outerPts[k].x, outerPts[k].y);
            else ctx.lineTo(outerPts[k].x, outerPts[k].y);
            ctx.lineTo(innerPts[k].x, innerPts[k].y);
        }
        ctx.closePath();
        ctx.fillStyle = '#3B1A02';
        ctx.fill();
        ctx.restore();

        // 2. 3D Faceted Origami Shading: Draw 10 Alternating Light & Shadow Triangles
        const lightColor1 = (skinColors && skinColors[0]) ? skinColors[0] : '#FDE68A';
        const lightColor2 = (skinColors && skinColors[1]) ? skinColors[1] : '#F59E0B';
        const darkColor1 = (skinColors && skinColors[2]) ? skinColors[2] : '#D97706';

        for (let k = 0; k < points; k++) {
            const prevValley = innerPts[(k - 1 + points) % points];
            const nextValley = innerPts[k];
            const tip = outerPts[k];

            // 2A. Light Facet (Tip -> Center -> NextValley)
            const lightGrad = ctx.createLinearGradient(tip.x, tip.y, 0, 0);
            lightGrad.addColorStop(0.0, '#FFFFFF'); // Specular tip
            lightGrad.addColorStop(0.35, lightColor1);
            lightGrad.addColorStop(1.0, lightColor2);
            ctx.fillStyle = lightGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(tip.x, tip.y);
            ctx.lineTo(nextValley.x, nextValley.y);
            ctx.closePath();
            ctx.fill();

            // 2B. Shadow Facet (Tip -> Center -> PrevValley)
            const shadowGrad = ctx.createLinearGradient(tip.x, tip.y, 0, 0);
            shadowGrad.addColorStop(0.0, lightColor2);
            shadowGrad.addColorStop(0.6, darkColor1);
            shadowGrad.addColorStop(1.0, '#451A03');
            ctx.fillStyle = shadowGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(tip.x, tip.y);
            ctx.lineTo(prevValley.x, prevValley.y);
            ctx.closePath();
            ctx.fill();
        }

        // 3. Facet Ridge Highlight Lines
        for (let k = 0; k < points; k++) {
            const tip = outerPts[k];
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
            ctx.lineWidth = Math.max(1.0, flareSize * 0.05);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();
        }

        // 4. Perimeter Bevel Stroke
        ctx.beginPath();
        for (let k = 0; k < points; k++) {
            if (k === 0) ctx.moveTo(outerPts[k].x, outerPts[k].y);
            else ctx.lineTo(outerPts[k].x, outerPts[k].y);
            ctx.lineTo(innerPts[k].x, innerPts[k].y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = Math.max(1.2, flareSize * 0.06);
        ctx.stroke();

        // 5. Inset Center Specular Diamond Core
        const coreR = outerR * 0.28;
        ctx.save();
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, -coreR);
        ctx.lineTo(coreR, 0);
        ctx.lineTo(0, coreR);
        ctx.lineTo(-coreR, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * 3D Faceted Diamond Comet Head for Cyber skin
     */
    drawRollingDiamondHead(ctx, flareSize, glowColor, skinColors) {
        const dw = flareSize * 0.85;
        const dh = flareSize * 1.40;

        ctx.save();
        ctx.shadowColor = glowColor || '#00F0FF';
        ctx.shadowBlur = 16;

        // Top Light Facet
        const gradTop = ctx.createLinearGradient(0, -dh, 0, 0);
        gradTop.addColorStop(0, '#FFFFFF');
        gradTop.addColorStop(1, (skinColors && skinColors[0]) || '#00F0FF');
        ctx.fillStyle = gradTop;
        ctx.beginPath();
        ctx.moveTo(0, -dh);
        ctx.lineTo(dw, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(-dw, 0);
        ctx.closePath();
        ctx.fill();

        // Bottom Shadow Facet
        const gradBot = ctx.createLinearGradient(0, 0, 0, dh);
        gradBot.addColorStop(0, (skinColors && skinColors[1]) || '#0891B2');
        gradBot.addColorStop(1, '#082F49');
        ctx.fillStyle = gradBot;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dw, 0);
        ctx.lineTo(0, dh);
        ctx.lineTo(-dw, 0);
        ctx.closePath();
        ctx.fill();

        // Outline & Core
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -dh);
        ctx.lineTo(dw, 0);
        ctx.lineTo(0, dh);
        ctx.lineTo(-dw, 0);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }

    render(ctx) {
        ctx.save();

        // 1. Draw Dissolving Clearing Cells (Smooth Pre-Clear Electric Charge, Scale & Bloom)
        for (const cc of this.clearingCells) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, cc.alpha);
            const cx = cc.x + cc.size / 2;
            const cy = cc.y + cc.size / 2;
            ctx.translate(cx, cy);
            ctx.scale(cc.scale, cc.scale);

            const s = cc.size;
            const radius = Math.max(3, s * 0.15);
            const hex = cc.color.hex || '#3B82F6';
            const light = cc.color.light || '#93C5FD';
            const dark = cc.color.dark || '#1D4ED8';

            // 1A. Base 3D block fill
            const bgGrad = ctx.createLinearGradient(-s / 2, -s / 2, -s / 2, s / 2);
            bgGrad.addColorStop(0, light);
            bgGrad.addColorStop(0.7, hex);
            bgGrad.addColorStop(1, dark);
            ctx.fillStyle = bgGrad;
            this.roundRect(ctx, -s / 2, -s / 2, s, s, radius);
            ctx.fill();

            // 1B. Beveled top/left highlight
            const bevelSize = Math.max(2, s * 0.12);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
            ctx.beginPath();
            ctx.moveTo(-s / 2 + radius, -s / 2);
            ctx.lineTo(s / 2 - radius, -s / 2);
            ctx.quadraticCurveTo(s / 2, -s / 2, s / 2 - bevelSize, -s / 2 + bevelSize);
            ctx.lineTo(-s / 2 + bevelSize, -s / 2 + bevelSize);
            ctx.lineTo(-s / 2 + bevelSize, s / 2 - radius);
            ctx.quadraticCurveTo(-s / 2, s / 2, -s / 2, s / 2 - radius);
            ctx.lineTo(-s / 2, -s / 2 + radius);
            ctx.quadraticCurveTo(-s / 2, -s / 2, -s / 2 + radius, -s / 2);
            ctx.fill();

            // 1C. Pre-clear electric shimmer / white-hot aura
            if (cc.glowAlpha > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${cc.glowAlpha * 0.65})`;
                ctx.shadowColor = light;
                ctx.shadowBlur = 14;
                ctx.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);

                // High-voltage rim
                ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1.0, cc.glowAlpha * 1.4)})`;
                ctx.lineWidth = 2;
                this.roundRect(ctx, -s / 2, -s / 2, s, s, radius);
                ctx.stroke();
            }

            ctx.restore();
        }

        // 2. Draw Ambient Background Shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, sw.alpha);
            if (sw.type === 'row') {
                const gradient = ctx.createLinearGradient(sw.x, sw.y - sw.height / 2, sw.x, sw.y + sw.height / 2);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, sw.color || 'rgba(255, 255, 255, 0.95)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(sw.x, sw.y - sw.height / 2, sw.width, sw.height);
            } else {
                const gradient = ctx.createLinearGradient(sw.x - sw.width / 2, sw.y, sw.x + sw.width / 2, sw.y);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, sw.color || 'rgba(255, 255, 255, 0.95)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(sw.x - sw.width / 2, sw.y, sw.width, sw.height);
            }
            ctx.restore();
        }

        // 3. Draw Supernova Cross-Intersections
        for (const sn of this.supernovas) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, sn.alpha);

            // Inner radial flash
            const radial = ctx.createRadialGradient(sn.x, sn.y, 0, sn.x, sn.y, sn.radius);
            radial.addColorStop(0, '#FFFFFF');
            radial.addColorStop(0.35, sn.color || '#F59E0B');
            radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(sn.x, sn.y, sn.radius, 0, Math.PI * 2);
            ctx.fill();

            // Concentric shockwave rings
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(sn.x, sn.y, sn.radius * 0.92, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = sn.color || '#F59E0B';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(sn.x, sn.y, sn.radius * 0.65, 0, Math.PI * 2);
            ctx.stroke();

            // 4-point cross burst rays
            const rayLen = sn.radius * 1.3;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(sn.x - rayLen, sn.y);
            ctx.lineTo(sn.x + rayLen, sn.y);
            ctx.moveTo(sn.x, sn.y - rayLen);
            ctx.lineTo(sn.x, sn.y + rayLen);
            ctx.stroke();

            ctx.restore();
        }

        // 4. Draw Sweeping Multi-Pass Laser Beams & 3D Rolling Star Comet Heads
        for (const sw of this.sweepers) {
            ctx.save();
            const clampedP = Math.min(1.0, sw.progress);
            const headX = sw.isRow ? (sw.startX + clampedP * sw.totalLength) : sw.startX;
            const headY = sw.isRow ? sw.startY : (sw.startY + clampedP * sw.totalLength);
            const headAlpha = Math.max(0, 1 - Math.max(0, (sw.progress - 0.92) * 4));

            ctx.globalAlpha = headAlpha;

            // 4A. Trailing Energy Laser Beam (Multi-Pass Composite)
            const beamThickness = sw.cellSize * 0.90 * sw.comboScale;
            if (sw.isRow) {
                // Soft Outer Neon Glow
                const beamGrad = ctx.createLinearGradient(sw.startX, headY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.55), sw.glowColor || 'rgba(255, 200, 0, 0.45)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(sw.startX, headY - beamThickness / 2, headX - sw.startX, beamThickness);

                // Mid-Energy Core Ribbon
                const midGrad = ctx.createLinearGradient(sw.startX, headY, headX, headY);
                midGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                midGrad.addColorStop(Math.max(0, clampedP - 0.4), 'rgba(255, 255, 255, 0.7)');
                midGrad.addColorStop(1, '#FFFFFF');
                ctx.fillStyle = midGrad;
                ctx.fillRect(sw.startX, headY - beamThickness * 0.25, headX - sw.startX, beamThickness * 0.5);

                // High-Intensity White Core Laser Blade
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = sw.glowColor || '#F59E0B';
                ctx.shadowBlur = 10;
                ctx.fillRect(sw.startX, headY - 3, headX - sw.startX, 6);
            } else {
                // Soft Outer Neon Glow
                const beamGrad = ctx.createLinearGradient(headX, sw.startY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.55), sw.glowColor || 'rgba(255, 200, 0, 0.45)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(headX - beamThickness / 2, sw.startY, beamThickness, headY - sw.startY);

                // Mid-Energy Core Ribbon
                const midGrad = ctx.createLinearGradient(headX, sw.startY, headX, headY);
                midGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                midGrad.addColorStop(Math.max(0, clampedP - 0.4), 'rgba(255, 255, 255, 0.7)');
                midGrad.addColorStop(1, '#FFFFFF');
                ctx.fillStyle = midGrad;
                ctx.fillRect(headX - beamThickness * 0.25, sw.startY, beamThickness * 0.5, headY - sw.startY);

                // High-Intensity White Core Laser Blade
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = sw.glowColor || '#F59E0B';
                ctx.shadowBlur = 10;
                ctx.fillRect(headX - 3, sw.startY, 6, headY - sw.startY);
            }

            // 4B. Blazing Multi-Stop Radial Corona Bloom Flare
            const bloomRadius = sw.cellSize * 1.8 * sw.comboScale;
            const radialGlow = ctx.createRadialGradient(headX, headY, 2, headX, headY, bloomRadius);
            radialGlow.addColorStop(0, '#FFFFFF');
            radialGlow.addColorStop(0.25, sw.waveColor || 'rgba(254, 240, 138, 0.95)');
            radialGlow.addColorStop(0.55, sw.glowColor || 'rgba(245, 158, 11, 0.90)');
            radialGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(headX, headY, bloomRadius, 0, Math.PI * 2);
            ctx.fill();

            // 4C. 4-Point Specular Cross Flare
            const crossSpan = sw.cellSize * 1.3 * sw.comboScale;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(headX - crossSpan, headY);
            ctx.lineTo(headX + crossSpan, headY);
            ctx.moveTo(headX, headY - crossSpan);
            ctx.lineTo(headX, headY + crossSpan);
            ctx.stroke();

            // 4D. 3D Faceted Rolling Star Comet Head
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(sw.headRotation);

            const flareSize = sw.cellSize * 0.70 * sw.comboScale;
            if (sw.headShape === 'star') {
                this.drawRollingStarHead(ctx, flareSize, sw.glowColor, sw.particleColors);
            } else if (sw.headShape === 'diamond') {
                this.drawRollingDiamondHead(ctx, flareSize, sw.glowColor, sw.particleColors);
            } else if (sw.headShape === 'square') {
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = sw.glowColor || '#FFFFFF';
                ctx.shadowBlur = 14;
                ctx.fillRect(-flareSize / 2, -flareSize / 2, flareSize, flareSize);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-flareSize / 2, -flareSize / 2, flareSize, flareSize);
            } else {
                // Circle / Plasma orb
                ctx.fillStyle = '#FFFFFF';
                ctx.shadowColor = sw.glowColor || '#FFFFFF';
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(0, 0, flareSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // 4E. Forward Sonic Shockwave Chevron Slicing Through Space
            ctx.strokeStyle = '#FFFFFF';
            ctx.shadowColor = sw.glowColor || '#FFFFFF';
            ctx.shadowBlur = 10;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            if (sw.isRow) {
                ctx.moveTo(headX - 14, headY - sw.cellSize * 0.65);
                ctx.lineTo(headX + 10, headY);
                ctx.lineTo(headX - 14, headY + sw.cellSize * 0.65);
            } else {
                ctx.moveTo(headX - sw.cellSize * 0.65, headY - 14);
                ctx.lineTo(headX, headY + 10);
                ctx.lineTo(headX + sw.cellSize * 0.65, headY - 14);
            }
            ctx.stroke();

            ctx.restore();
        }

        // 5. Draw Particles (Custom Geometric Shapes with Glow & Rotation)
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;

            if (p.shape === 'square') {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else if (p.shape === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(0, -p.size / 2);
                ctx.lineTo(p.size / 2, 0);
                ctx.lineTo(0, p.size / 2);
                ctx.lineTo(-p.size / 2, 0);
                ctx.closePath();
                ctx.fill();
            } else if (p.shape === 'star') {
                ctx.beginPath();
                const r = p.size / 2;
                for (let s = 0; s < 5; s++) {
                    ctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * r, -Math.sin((18 + s * 72) * Math.PI / 180) * r);
                    ctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * (r * 0.45), -Math.sin((54 + s * 72) * Math.PI / 180) * (r * 0.45));
                }
                ctx.closePath();
                ctx.fill();
            } else if (p.shape === 'sparkle') {
                const r = p.size / 2;
                ctx.beginPath();
                ctx.moveTo(0, -r);
                ctx.quadraticCurveTo(0, 0, r * 0.22, 0);
                ctx.lineTo(r, 0);
                ctx.quadraticCurveTo(0, 0, 0, r * 0.22);
                ctx.lineTo(0, r);
                ctx.quadraticCurveTo(0, 0, -r * 0.22, 0);
                ctx.lineTo(-r, 0);
                ctx.quadraticCurveTo(0, 0, 0, -r * 0.22);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 6. Draw Confetti Fanfare
        for (const c of this.confetti) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.alpha);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        }

        // 7. Draw Score Pop-Ups & Bold Gold Typography
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.translate(ft.x, ft.y);
            ctx.scale(ft.scale, ft.scale);
            ctx.font = ft.font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (ft.isGold) {
                // Gold outer glow
                ctx.shadowColor = 'rgba(245, 158, 11, 0.85)';
                ctx.shadowBlur = 16;
                ctx.strokeStyle = ft.shadow;
                ctx.lineWidth = 5;
                ctx.strokeText(ft.text, 0, 0);

                ctx.fillStyle = ft.color;
                ctx.fillText(ft.text, 0, 0);
            } else {
                // Standard text outline
                ctx.strokeStyle = ft.shadow;
                ctx.lineWidth = 4;
                ctx.strokeText(ft.text, 0, 0);

                ctx.fillStyle = ft.color;
                ctx.fillText(ft.text, 0, 0);
            }

            ctx.restore();
        }

        ctx.restore();
    }
}
