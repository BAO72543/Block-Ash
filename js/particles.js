/**
 * Block Blast - Particle, Sweeper and Visual FX System
 * High-performance canvas particle animations, sweeping line beams, shockwaves, floating text, and confetti.
 * Features:
 * - Dynamic Sweeping Laser Beams & Domino Ripple Line Clears
 * - Skin-Tailored Comet Heads (Star, Diamond, Crystal Square, Plasma Orb)
 * - Color-Matched Cascading Block Destroy Particle Bursts
 * - Scaled Dynamic Screen Shake
 * - Bold Gold Typography Score & Combo Pop-Ups ("Great!", "Perfect!", "COMBO x4!")
 * - High-FPS Confetti Fanfare
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.sweepers = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.currentEffects = {
            particleShape: 'square',
            particleColors: ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
            waveColor: 'rgba(254, 240, 138, 0.95)',
            floatingTextColor: '#FDE047',
            glowColor: 'rgba(245, 158, 11, 0.65)',
            headShape: 'square'
        };
    }

    setSkinEffects(effects) {
        if (effects) {
            this.currentEffects = {
                particleShape: effects.particleShape || 'square',
                particleColors: effects.particleColors || ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
                waveColor: effects.waveColor || 'rgba(255, 255, 255, 0.95)',
                floatingTextColor: effects.floatingTextColor || '#FDE047',
                glowColor: effects.glowColor || 'rgba(245, 158, 11, 0.65)',
                headShape: effects.headShape || effects.particleShape || 'square'
            };
        }
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.sweepers = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(intensity = 6, duration = 200) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    /**
     * Trigger a sweeping laser beam across an entire row or column with cascading domino block pops
     */
    addLineClearSweep(type, index, gridX, gridY, cellSize, gap, shapeColor) {
        const totalLength = 8 * (cellSize + gap) - gap;
        const isRow = type === 'row';
        const eff = this.currentEffects;

        const startX = isRow ? gridX : (gridX + index * (cellSize + gap) + cellSize / 2);
        const startY = isRow ? (gridY + index * (cellSize + gap) + cellSize / 2) : gridY;
        const endX = isRow ? (gridX + totalLength) : startX;
        const endY = isRow ? startY : (gridY + totalLength);

        // Also add ambient background shockwave
        this.shockwaves.push({
            type,
            x: isRow ? gridX : startX,
            y: isRow ? startY : gridY,
            width: isRow ? totalLength : cellSize * 1.6,
            height: isRow ? cellSize * 1.6 : totalLength,
            alpha: 0.9,
            decay: 0.035,
            color: eff.waveColor
        });

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
            progress: 0,
            speed: 0.065, // completes in ~15-18 frames (~280ms)
            triggeredCells: new Array(8).fill(false),
            shapeColor: shapeColor || { hex: '#3B82F6', light: '#93C5FD' },
            particleShape: eff.particleShape || 'square',
            headShape: eff.headShape || eff.particleShape || 'square',
            waveColor: eff.waveColor || 'rgba(255, 255, 255, 0.95)',
            glowColor: eff.glowColor || 'rgba(245, 158, 11, 0.65)',
            particleColors: eff.particleColors || ['#FDE68A', '#F59E0B', '#FFFFFF'],
            headRotation: 0
        });
    }

    /**
     * Micro-sparks shooting perpendicularly away from the sweeping comet head
     */
    addSweepSparks(x, y, isRow, shape, colors) {
        const count = 4 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const side = Math.random() > 0.5 ? 1 : -1;
            const vx = isRow ? (Math.random() - 0.5) * 2 : side * (3 + Math.random() * 4);
            const vy = isRow ? side * (3 + Math.random() * 4) : (Math.random() - 0.5) * 2;
            const color = colors[Math.floor(Math.random() * colors.length)] || '#FFFFFF';

            this.particles.push({
                x,
                y,
                vx,
                vy,
                gravity: 0.12,
                drag: 0.92,
                size: 4 + Math.random() * 6,
                baseSize: 4 + Math.random() * 6,
                color,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.03,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.4,
                shape
            });
        }
    }

    /**
     * Burst of jewel / neon block particles from a destroyed cell matching its exact color & skin effect
     */
    addBlockClearBurst(x, y, size, color) {
        const count = 12 + Math.floor(Math.random() * 6);
        const hex = (color && color.hex) ? color.hex : '#3B82F6';
        const light = (color && color.light) ? color.light : '#93C5FD';
        const effectShape = this.currentEffects.particleShape || 'square';
        const pColors = this.currentEffects.particleColors || [hex, light, '#FFFFFF'];

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 6.5;
            const pSize = (size * 0.16) + Math.random() * (size * 0.22);
            const chosenColor = Math.random() > 0.35 
                ? (Math.random() > 0.5 ? hex : light)
                : pColors[Math.floor(Math.random() * pColors.length)];

            this.particles.push({
                x: x + size / 2,
                y: y + size / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.8,
                gravity: 0.20,
                drag: 0.95,
                size: pSize,
                baseSize: pSize,
                color: chosenColor,
                alpha: 1,
                decay: 0.018 + Math.random() * 0.022,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.3,
                shape: Math.random() > 0.2 ? effectShape : 'circle'
            });
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

        this.floatingTexts.push({
            text,
            x,
            y,
            vy: options.vy || -2.8,
            alpha: 1,
            scale: 0.4,
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
                alpha: 1,
                decay: 0.008 + Math.random() * 0.008
            });
        }
    }

    update(dt) {
        // Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeIntensity = 0;
            }
        }

        // Update sweeping laser waves & trigger cascading domino block explosions
        for (let i = this.sweepers.length - 1; i >= 0; i--) {
            const sw = this.sweepers[i];
            sw.progress += sw.speed;
            sw.headRotation += 0.15;

            // Trigger cells sequentially as the beam passes each one
            for (let c = 0; c < 8; c++) {
                const threshold = (c + 0.3) / 8;
                if (sw.progress >= threshold && !sw.triggeredCells[c]) {
                    sw.triggeredCells[c] = true;

                    const cellRow = sw.isRow ? sw.index : c;
                    const cellCol = sw.isRow ? c : sw.index;
                    const cellX = sw.gridX + cellCol * (sw.cellSize + sw.gap);
                    const cellY = sw.gridY + cellRow * (sw.cellSize + sw.gap);

                    // Explode block particles with domino timing
                    this.addBlockClearBurst(cellX, cellY, sw.cellSize, sw.shapeColor);

                    // Add lateral laser beam discharge sparks
                    this.addSweepSparks(
                        cellX + sw.cellSize / 2,
                        cellY + sw.cellSize / 2,
                        sw.isRow,
                        sw.particleShape,
                        sw.particleColors
                    );
                }
            }

            if (sw.progress >= 1.25) {
                this.sweepers.splice(i, 1);
            }
        }

        // Update particles
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

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.alpha -= sw.decay;
            if (sw.alpha <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update floating texts
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

        // Update confetti
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

        // 1. Draw Ambient Background Shockwaves
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

        // 2. Draw Sweeping Laser Beams & Blazing Comet Heads
        for (const sw of this.sweepers) {
            ctx.save();
            const clampedP = Math.min(1.0, sw.progress);
            const headX = sw.isRow ? (sw.startX + clampedP * sw.totalLength) : sw.startX;
            const headY = sw.isRow ? sw.startY : (sw.startY + clampedP * sw.totalLength);
            const headAlpha = Math.max(0, 1 - Math.max(0, (sw.progress - 0.9) * 3));

            ctx.globalAlpha = headAlpha;

            // 2A. Trailing Energy Laser Beam
            const beamThickness = sw.cellSize * 0.75;
            if (sw.isRow) {
                const beamGrad = ctx.createLinearGradient(sw.startX, headY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.4), sw.glowColor || 'rgba(255, 200, 0, 0.4)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(sw.startX, headY - beamThickness / 2, headX - sw.startX, beamThickness);

                // Core White Centerline
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(sw.startX, headY - 2, headX - sw.startX, 4);
            } else {
                const beamGrad = ctx.createLinearGradient(headX, sw.startY, headX, headY);
                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                beamGrad.addColorStop(Math.max(0, clampedP - 0.4), sw.glowColor || 'rgba(255, 200, 0, 0.4)');
                beamGrad.addColorStop(1, '#FFFFFF');

                ctx.fillStyle = beamGrad;
                ctx.fillRect(headX - beamThickness / 2, sw.startY, beamThickness, headY - sw.startY);

                // Core White Centerline
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.fillRect(headX - 2, sw.startY, 4, headY - sw.startY);
            }

            // 2B. Blazing Radial Bloom Comet Head
            const radialGlow = ctx.createRadialGradient(headX, headY, 2, headX, headY, sw.cellSize * 1.4);
            radialGlow.addColorStop(0, '#FFFFFF');
            radialGlow.addColorStop(0.3, sw.glowColor || 'rgba(245, 158, 11, 0.85)');
            radialGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = radialGlow;
            ctx.beginPath();
            ctx.arc(headX, headY, sw.cellSize * 1.4, 0, Math.PI * 2);
            ctx.fill();

            // 2C. Skin-Specific Geometric Comet Head Flare
            ctx.save();
            ctx.translate(headX, headY);
            ctx.rotate(sw.headRotation);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowColor = sw.glowColor || '#FFFFFF';
            ctx.shadowBlur = 12;

            const flareSize = sw.cellSize * 0.55;
            if (sw.headShape === 'diamond') {
                ctx.beginPath();
                ctx.moveTo(0, -flareSize * 1.3);
                ctx.lineTo(flareSize * 0.7, 0);
                ctx.lineTo(0, flareSize * 1.3);
                ctx.lineTo(-flareSize * 0.7, 0);
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

            // 2D. Lateral Cross-Laser Spike Flares
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(headX - sw.cellSize * 0.8, headY);
            ctx.lineTo(headX + sw.cellSize * 0.8, headY);
            ctx.moveTo(headX, headY - sw.cellSize * 0.8);
            ctx.lineTo(headX, headY + sw.cellSize * 0.8);
            ctx.stroke();

            ctx.restore();
        }

        // 3. Draw Particles (Custom Geometric Shapes with Glow & Rotation)
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
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 4. Draw Confetti Fanfare
        for (const c of this.confetti) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.alpha);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        }

        // 5. Draw Score Pop-Ups & Bold Gold Typography
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
