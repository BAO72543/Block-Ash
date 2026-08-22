/**
 * Block Blast - Particle and Visual FX System
 * High-performance canvas particle animations, shockwaves, floating text, and confetti.
 * Features:
 * - Color-Matched Block Destroy Particle Bursts
 * - Scaled Dynamic Screen Shake
 * - Bold Gold Typography Score & Combo Pop-Ups ("Great!", "Perfect!", "COMBO x4!")
 * - High-FPS Confetti Fanfare
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.confetti = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
    }

    triggerShake(intensity = 6, duration = 200) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    /**
     * Burst of jewel / neon block particles from a destroyed cell matching its exact color
     */
    addBlockClearBurst(x, y, size, color) {
        const count = 12 + Math.floor(Math.random() * 6);
        const hex = (color && color.hex) ? color.hex : '#3B82F6';
        const light = (color && color.light) ? color.light : '#93C5FD';

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2.5 + Math.random() * 6.5;
            const pSize = (size * 0.16) + Math.random() * (size * 0.22);

            this.particles.push({
                x: x + size / 2,
                y: y + size / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.8,
                gravity: 0.20,
                drag: 0.95,
                size: pSize,
                baseSize: pSize,
                color: Math.random() > 0.4 ? hex : light,
                alpha: 1,
                decay: 0.016 + Math.random() * 0.02,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 0.3,
                shape: Math.random() > 0.3 ? 'square' : 'circle'
            });
        }
    }

    /**
     * Line clear laser/shockwave effect across a row or column
     */
    addLineClearWave(type, index, gridX, gridY, cellSize, gap) {
        if (type === 'row') {
            const y = gridY + index * (cellSize + gap) + cellSize / 2;
            this.shockwaves.push({
                type: 'row',
                x: gridX,
                y,
                width: 8 * (cellSize + gap) - gap,
                height: cellSize * 1.5,
                alpha: 1,
                decay: 0.045,
                color: 'rgba(255, 255, 255, 0.95)'
            });
        } else {
            const x = gridX + index * (cellSize + gap) + cellSize / 2;
            this.shockwaves.push({
                type: 'col',
                x,
                y: gridY,
                width: cellSize * 1.5,
                height: 8 * (cellSize + gap) - gap,
                alpha: 1,
                decay: 0.045,
                color: 'rgba(255, 255, 255, 0.95)'
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

        // 1. Draw Shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.globalAlpha = sw.alpha;
            if (sw.type === 'row') {
                const gradient = ctx.createLinearGradient(sw.x, sw.y - sw.height / 2, sw.x, sw.y + sw.height / 2);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(sw.x, sw.y - sw.height / 2, sw.width, sw.height);
            } else {
                const gradient = ctx.createLinearGradient(sw.x - sw.width / 2, sw.y, sw.x + sw.width / 2, sw.y);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(sw.x - sw.width / 2, sw.y, sw.width, sw.height);
            }
            ctx.restore();
        }

        // 2. Draw Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;

            if (p.shape === 'square') {
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 3. Draw Confetti
        for (const c of this.confetti) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.alpha);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        }

        // 4. Draw Score Pop-Ups & Bold Gold Typography
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
