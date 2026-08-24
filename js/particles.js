/**
 * Block Blast - Particle, Sweeper and Visual FX System
 * High-performance canvas particle animations, sweeping laser line beams, shockwaves, floating text, and confetti.
 * Features:
 * - Ultra-Smooth Eased Sweeping Laser Beams & Domino Cascading Line Clears
 * - Dissolving Pre-Clear Cell Shimmer & Scale Bloom
 * - Multi-Line Cross-Intersection Supernova Detonations
 * - Skin-Tailored Comet Heads (5-Point Star, Laser Diamond, Crystal Square, Plasma Orb)
 * - Color-Matched Particle Explosions with Dynamic Velocity & Gravity
 * - Scaled Screen Shake & Bold Typography Pop-Ups
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

        this.currentEffects = {
            particleShape: 'square',
            headShape: 'square',
            particleColors: ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
            waveColor: 'rgba(254, 240, 138, 0.95)',
            floatingTextColor: '#FDE047',
            glowColor: 'rgba(245, 158, 11, 0.85)'
        };
    }

    setCellTriggerCallback(cb) {
        this.onCellTriggerCallback = cb;
    }

    setSkinEffects(effects) {
        if (effects) {
            this.currentEffects = {
                particleShape: effects.particleShape || 'square',
                headShape: effects.headShape || effects.particleShape || 'square',
                particleColors: effects.particleColors || ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
                waveColor: effects.waveColor || 'rgba(255, 255, 255, 0.95)',
                floatingTextColor: effects.floatingTextColor || '#FDE047',
                glowColor: effects.glowColor || 'rgba(245, 158, 11, 0.85)'
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
     * glowing comet head, cascading block pops, and lateral spark discharge
     */
    addLineClearSweep(type, index, gridX, gridY, cellSize, gap, shapeColor, comboCount = 0) {
        const totalLength = 8 * (cellSize + gap) - gap;
        const isRow = type === 'row';
        const eff = this.currentEffects;
        const comboScale = 1.0 + Math.min(0.6, (comboCount || 0) * 0.12);

        const startX = isRow ? gridX : (gridX + index * (cellSize + gap) + cellSize / 2);
        const startY = isRow ? (gridY + index * (cellSize + gap) + cellSize / 2) : gridY;
        const endX = isRow ? (gridX + totalLength) : startX;
        const endY = isRow ? startY : (gridY + totalLength);

        // Ambient background shockwave
        this.shockwaves.push({
            type,
            x: isRow ? gridX : startX,
            y: isRow ? startY : gridY,
            width: isRow ? totalLength : cellSize * 1.8 * comboScale,
            height: isRow ? cellSize * 1.8 * comboScale : totalLength,
            alpha: 1.0,
            decay: 0.038,
            color: eff.waveColor
        });

        // Register clearing cells along the path for smooth pre-clear glow & scale bloom
        for (let c = 0; c < 8; c++) {
            const cellRow = isRow ? index : c;
            const cellCol = isRow ? c : index;
            const cx = gridX + cellCol * (cellSize + gap);
            const cy = gridY + cellRow * (cellSize + gap);

            this.clearingCells.push({
                row: cellRow,
                col: cellCol,
                x: cx,
                y: cy,
                size: cellSize,
                color: shapeColor || { hex: '#3B82F6', light: '#93C5FD' },
                state: 'blooming', // blooming -> popped -> fading
                scale: 1.0,
                alpha: 1.0,
                glowAlpha: 0.2,
                decay: 0.06
            });
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
            elapsedTime: 0,
            duration: 260, // 260ms smooth cushioned travel time
            progress: 0,
            comboCount: comboCount || 0,
            comboScale,
            triggeredCells: new Array(8).fill(false),
            shapeColor: shapeColor || { hex: '#3B82F6', light: '#93C5FD' },
            particleShape: eff.particleShape || 'square',
            headShape: eff.headShape || eff.particleShape || 'square',
            waveColor: eff.waveColor || 'rgba(255, 255, 255, 0.95)',
            glowColor: eff.glowColor || 'rgba(245, 158, 11, 0.85)',
            particleColors: eff.particleColors || ['#FDE68A', '#F59E0B', '#FFFFFF'],
            headRotation: 0,
            alpha: 1.0
        });
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
                    radius: 10,
                    maxRadius: cellSize * 2.2,
                    alpha: 1.0,
                    decay: 0.04,
                    color: eff.glowColor || 'rgba(251, 191, 36, 0.9)',
                    haloColor: '#FFFFFF',
                    sparksEmitted: false
                });
            }
        }
    }

    /**
     * Lateral micro-sparks shooting perpendicularly away from the sweeping comet head
     */
    addSweepSparks(x, y, isRow, shape, colors, comboScale = 1.0) {
        const count = Math.floor((5 + Math.random() * 4) * comboScale);
        for (let i = 0; i < count; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const vx = isRow ? (Math.random() - 0.5) * 3 : side * (3.5 + Math.random() * 5.5);
            const vy = isRow ? side * (3.5 + Math.random() * 5.5) : (Math.random() - 0.5) * 3;
            const color = colors[Math.floor(Math.random() * colors.length)] || '#FFFFFF';

            this.particles.push({
                x,
                y,
                vx,
                vy,
                gravity: 0.10,
                drag: 0.93,
                size: (4 + Math.random() * 7) * comboScale,
                baseSize: (4 + Math.random() * 7) * comboScale,
                color,
                alpha: 1.0,
                decay: 0.025 + Math.random() * 0.025,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.4,
                shape
            });
        }
    }

    /**
     * Burst of jewel / neon block particles from a destroyed cell matching its exact color & skin effect
     */
    addBlockClearBurst(x, y, size, color, comboScale = 1.0) {
        const count = Math.floor((14 + Math.random() * 8) * comboScale);
        const hex = (color && color.hex) ? color.hex : '#3B82F6';
        const light = (color && color.light) ? color.light : '#93C5FD';
        const effectShape = this.currentEffects.particleShape || 'square';
        const pColors = this.currentEffects.particleColors || [hex, light, '#FFFFFF'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3.0 + Math.random() * 7.5;
            const pSize = ((size * 0.18) + Math.random() * (size * 0.24)) * comboScale;
            const chosenColor = Math.random() > 0.35 
                ? (Math.random() > 0.5 ? hex : light)
                : pColors[Math.floor(Math.random() * pColors.length)];

            this.particles.push({
                x: x + size / 2,
                y: y + size / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2.0,
                gravity: 0.22,
                drag: 0.94,
                size: pSize,
                baseSize: pSize,
                color: chosenColor,
                alpha: 1.0,
                decay: 0.016 + Math.random() * 0.020,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.35,
                shape: Math.random() > 0.15 ? effectShape : 'circle'
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
            // Cosmic Amethyst & Lilac Crystal Shards
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
            // Brilliant Golden Stardust Fanfare
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
            // Crystalline Diamond / Gem Burst
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

        // 3. Update Sweeping Laser Waves with Non-Linear Eased Travel & Domino Pops
        for (let i = this.sweepers.length - 1; i >= 0; i--) {
            const sw = this.sweepers[i];
            sw.elapsedTime += dt;
            const t = Math.min(1.0, sw.elapsedTime / sw.duration);

            // Smooth cubic-out easing curve: rapid energetic surge with cushioned completion
            sw.progress = 1 - Math.pow(1 - t, 2.8);
            sw.headRotation += 0.18;

            // Trigger cells sequentially as the beam passes each one
            for (let c = 0; c < 8; c++) {
                const threshold = (c + 0.15) / 8;
                if (sw.progress >= threshold && !sw.triggeredCells[c]) {
                    sw.triggeredCells[c] = true;

                    const cellRow = sw.isRow ? sw.index : c;
                    const cellCol = sw.isRow ? c : sw.index;
                    const cellX = sw.gridX + cellCol * (sw.cellSize + sw.gap);
                    const cellY = sw.gridY + cellRow * (sw.cellSize + sw.gap);

                    // Notify audio callback for ascending musical note
                    if (this.onCellTriggerCallback) {
                        this.onCellTriggerCallback(c, sw.comboCount);
                    }

                    // Trigger block explosion burst
                    this.addBlockClearBurst(cellX, cellY, sw.cellSize, sw.shapeColor, sw.comboScale);

                    // Trigger lateral beam discharge sparks
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

        // 4. Update Dissolving Clearing Cells (smooth pre-clear scale bloom and fade)
        for (let i = this.clearingCells.length - 1; i >= 0; i--) {
            const cc = this.clearingCells[i];
            if (cc.state === 'blooming') {
                cc.scale = Math.min(1.14, cc.scale + 0.025);
                cc.glowAlpha = Math.min(0.85, cc.glowAlpha + 0.08);
                cc.alpha -= cc.decay;
                if (cc.alpha <= 0.1) {
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

    render(ctx) {
        ctx.save();

        // 1. Draw Dissolving Clearing Cells (Smooth Pre-Clear Scale & Bloom)
        for (const cc of this.clearingCells) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, cc.alpha);
            const cx = cc.x + cc.size / 2;
            const cy = cc.y + cc.size / 2;
            ctx.translate(cx, cy);
            ctx.scale(cc.scale, cc.scale);

            // Shimmering color block
            ctx.fillStyle = cc.color.hex || '#3B82F6';
            ctx.shadowColor = cc.color.light || '#FFFFFF';
            ctx.shadowBlur = 14;
            ctx.fillRect(-cc.size / 2, -cc.size / 2, cc.size, cc.size);

            // White-hot inner bloom core
            ctx.fillStyle = `rgba(255, 255, 255, ${cc.glowAlpha})`;
            ctx.fillRect(-cc.size * 0.4, -cc.size * 0.4, cc.size * 0.8, cc.size * 0.8);
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

            const radial = ctx.createRadialGradient(sn.x, sn.y, 0, sn.x, sn.y, sn.radius);
            radial.addColorStop(0, '#FFFFFF');
            radial.addColorStop(0.4, sn.color || '#F59E0B');
            radial.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = radial;
            ctx.beginPath();
            ctx.arc(sn.x, sn.y, sn.radius, 0, Math.PI * 2);
            ctx.fill();

            // Expanding outer ring
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sn.x, sn.y, sn.radius * 0.9, 0, Math.PI * 2);
            ctx.stroke();

            ctx.restore();
        }

        // 4. Draw Sweeping Laser Beams & Blazing Geometric Comet Heads
        for (const sw of this.sweepers) {
            ctx.save();
            const clampedP = Math.min(1.0, sw.progress);
            const headX = sw.isRow ? (sw.startX + clampedP * sw.totalLength) : sw.startX;
            const headY = sw.isRow ? sw.startY : (sw.startY + clampedP * sw.totalLength);
            const headAlpha = Math.max(0, 1 - Math.max(0, (sw.progress - 0.92) * 4));

            ctx.globalAlpha = headAlpha;

            // 4A. Trailing Energy Laser Beam (Multi-Pass Composite)
            const beamThickness = sw.cellSize * 0.85 * sw.comboScale;
            if (sw.isRow) {
                // Soft Outer Glow
                const beamGrad = ctx.createLinearGradient(sw.startX, headY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.5), sw.glowColor || 'rgba(255, 200, 0, 0.45)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(sw.startX, headY - beamThickness / 2, headX - sw.startX, beamThickness);

                // High-Intensity White Core Laser Blade
                const coreGrad = ctx.createLinearGradient(sw.startX, headY, headX, headY);
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                coreGrad.addColorStop(Math.max(0, clampedP - 0.3), 'rgba(255, 255, 255, 0.8)');
                coreGrad.addColorStop(1, '#FFFFFF');
                ctx.fillStyle = coreGrad;
                ctx.fillRect(sw.startX, headY - 3, headX - sw.startX, 6);
            } else {
                // Soft Outer Glow
                const beamGrad = ctx.createLinearGradient(headX, sw.startY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.5), sw.glowColor || 'rgba(255, 200, 0, 0.45)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(headX - beamThickness / 2, sw.startY, beamThickness, headY - sw.startY);

                // High-Intensity White Core Laser Blade
                const coreGrad = ctx.createLinearGradient(headX, sw.startY, headX, headY);
                coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                coreGrad.addColorStop(Math.max(0, clampedP - 0.3), 'rgba(255, 255, 255, 0.8)');
                coreGrad.addColorStop(1, '#FFFFFF');
                ctx.fillStyle = coreGrad;
                ctx.fillRect(headX - 3, sw.startY, 6, headY - sw.startY);
            }

            // 4B. Blazing Radial Bloom Flare
            const bloomRadius = sw.cellSize * 1.6 * sw.comboScale;
            const radialGlow = ctx.createRadialGradient(headX, headY, 2, headX, headY, bloomRadius);
            radialGlow.addColorStop(0, '#FFFFFF');
            radialGlow.addColorStop(0.35, sw.glowColor || 'rgba(245, 158, 11, 0.9)');
            radialGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(headX, headY, bloomRadius, 0, Math.PI * 2);
            ctx.fill();

            // 4C. Skin-Specific Geometric Comet Head Flare
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(sw.headRotation);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = sw.glowColor || '#FFFFFF';
            ctx.shadowBlur = 16;

            const flareSize = sw.cellSize * 0.60 * sw.comboScale;
            if (sw.headShape === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(0, -flareSize * 1.35);
                ctx.lineTo(flareSize * 0.75, 0);
                ctx.lineTo(0, flareSize * 1.35);
                ctx.lineTo(-flareSize * 0.75, 0);
                ctx.closePath();
                ctx.fill();
            } else if (sw.headShape === 'star') {
                ctx.beginPath();
                for (let s = 0; s < 5; s++) {
                    ctx.lineTo(Math.cos((18 + s * 72) * Math.PI / 180) * flareSize, -Math.sin((18 + s * 72) * Math.PI / 180) * flareSize);
                    ctx.lineTo(Math.cos((54 + s * 72) * Math.PI / 180) * (flareSize * 0.45), -Math.sin((54 + s * 72) * Math.PI / 180) * (flareSize * 0.45));
                }
                ctx.closePath();
                ctx.fill();
            } else if (sw.headShape === 'square') {
                ctx.fillRect(-flareSize / 2, -flareSize / 2, flareSize, flareSize);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, flareSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // 4D. Forward Shockwave Sonic Chevron
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            if (sw.isRow) {
                ctx.moveTo(headX - 12, headY - sw.cellSize * 0.6);
                ctx.lineTo(headX + 8, headY);
                ctx.lineTo(headX - 12, headY + sw.cellSize * 0.6);
            } else {
                ctx.moveTo(headX - sw.cellSize * 0.6, headY - 12);
                ctx.lineTo(headX, headY + 8);
                ctx.lineTo(headX + sw.cellSize * 0.6, headY - 12);
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
