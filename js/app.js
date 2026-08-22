/**
 * Block Blast - Main Application Controller
 * Coordinates Engine, High-DPI Renderer, Particles, Sound Synthesizer,
 * Autoplay AI, Minimalist UI and Monetization Loops (Bottom Banner, Interstitial Break, Rewarded Revive).
 */

import { BlockGameState } from './game.js';
import { GameRenderer } from './renderer.js';
import { ParticleSystem } from './particles.js';
import { SoundFX } from './audio.js';
import { InputHandler } from './input.js';
import { BlockBlastAI } from './ai.js';

export class BlockBlastApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.gameState = new BlockGameState();
        this.particles = new ParticleSystem();
        this.audio = new SoundFX();
        this.renderer = new GameRenderer(this.canvas, this.gameState, this.particles);
        this.ai = new BlockBlastAI();

        // Autoplay controller
        this.isAutoplayActive = false;
        this.autoplayTimer = null;
        this.autoplaySpeed = 'normal'; // slow: 600ms, normal: 300ms, fast: 120ms, turbo: 30ms
        this.celebratedNewRecord = false;
        this.gamesSinceLastInterstitial = 0;

        // Cache DOM Elements with robust fallbacks
        this.dom = {
            scoreCurrent: document.getElementById('current-score') || document.getElementById('score-current'),
            scoreHighest: document.getElementById('high-score') || document.getElementById('score-highest'),
            comboCurrent: document.getElementById('combo-count') || document.getElementById('combo-current'),
            comboFlame: document.getElementById('combo-flame'),
            comboFeed: document.getElementById('combo-feed'),
            btnHint: document.getElementById('btn-hint'),
            btnAutoplay: document.getElementById('btn-autoplay'),
            btnSound: document.getElementById('btn-sound'),
            btnRestart: document.getElementById('btn-restart'),
            btnStats: document.getElementById('btn-stats'),
            btnForceLose: document.getElementById('btn-force-lose'),
            gameOverModal: document.getElementById('game-over-modal'),
            modalFinalScore: document.getElementById('modal-final-score'),
            modalHighScore: document.getElementById('modal-high-score'),
            modalRecordBadge: document.getElementById('modal-record-badge'),
            btnModalRestart: document.getElementById('btn-modal-restart'),
            btnModalRevive: document.getElementById('btn-modal-revive'),
            rewardedAdModal: document.getElementById('rewarded-ad-modal'),
            rewardedProgress: document.getElementById('rewarded-progress'),
            rewardedTimerText: document.getElementById('rewarded-timer-text'),
            btnClaimReward: document.getElementById('btn-claim-reward'),
            interstitialAdModal: document.getElementById('interstitial-ad-modal'),
            btnSkipInterstitial: document.getElementById('btn-skip-interstitial'),
            statsModal: document.getElementById('stats-modal'),
            btnCloseStats: document.getElementById('btn-close-stats'),
            statGames: document.getElementById('stat-games'),
            statHighScore: document.getElementById('stat-high-score'),
            statMaxCombo: document.getElementById('stat-max-combo'),
            statLines: document.getElementById('stat-lines'),
            statAllClears: document.getElementById('stat-all-clears'),
            themeSelector: document.getElementById('theme-selector'),
            autoplaySpeedSelect: document.getElementById('autoplay-speed-select')
        };

        this.input = new InputHandler(
            this.canvas,
            this.renderer,
            this.gameState,
            this.handlePlaceAction.bind(this),
            this.toggleHint.bind(this),
            this.toggleAutoplay.bind(this),
            this.toggleAudio.bind(this),
            this.restartGame.bind(this),
            this.forceGameOver.bind(this)
        );

        this.lastTime = performance.now();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAudioButtonState();
        this.updateScoreDisplays();
        this.updateComboFeed();

        // Handle resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Start animation loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    setupEventListeners() {
        // Audio Toggle
        this.dom.btnSound.addEventListener('click', () => {
            this.toggleAudio();
        });

        // Hint Button
        this.dom.btnHint.addEventListener('click', () => {
            this.audio.playButton();
            this.toggleHint();
        });

        // Autoplay Button
        this.dom.btnAutoplay.addEventListener('click', () => {
            this.audio.playButton();
            this.toggleAutoplay();
        });

        // Restart Button
        this.dom.btnRestart.addEventListener('click', () => {
            this.audio.playButton();
            this.restartGame();
        });

        // Modal Restart Button
        this.dom.btnModalRestart.addEventListener('click', () => {
            this.audio.playButton();
            this.restartGame();
        });

        // Debug Force Lose Button
        if (this.dom.btnForceLose) {
            this.dom.btnForceLose.addEventListener('click', () => {
                this.forceGameOver();
            });
        }

        // Rewarded Video Revive Button (10% Ad Revenue, 1 use per run)
        if (this.dom.btnModalRevive) {
            this.dom.btnModalRevive.addEventListener('click', () => {
                this.audio.playButton();
                this.startRewardedReviveFlow();
            });
        }

        // Claim Rewarded Revive Button
        if (this.dom.btnClaimReward) {
            this.dom.btnClaimReward.addEventListener('click', () => {
                this.audio.playButton();
                this.completeRewardedRevive();
            });
        }

        // Skip / Close Interstitial Ad Button
        if (this.dom.btnSkipInterstitial) {
            this.dom.btnSkipInterstitial.addEventListener('click', () => {
                this.closeInterstitialAd();
            });
        }

        // Stats Modal
        this.dom.btnStats.addEventListener('click', () => {
            this.audio.playButton();
            this.openStatsModal();
        });

        this.dom.btnCloseStats.addEventListener('click', () => {
            this.audio.playButton();
            this.closeStatsModal();
        });

        // Theme Selection
        if (this.dom.themeSelector) {
            this.dom.themeSelector.addEventListener('change', (e) => {
                this.audio.playButton();
                this.changeTheme(e.target.value);
            });
        }

        // Autoplay Speed Selection
        if (this.dom.autoplaySpeedSelect) {
            this.dom.autoplaySpeedSelect.addEventListener('change', (e) => {
                this.autoplaySpeed = e.target.value;
            });
        }

        // Close modals on clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.dom.statsModal) {
                this.closeStatsModal();
            }
        });
    }

    handleResize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        const rect = container ? container.getBoundingClientRect() : null;
        const w = (rect && rect.width > 50) ? rect.width : (container && container.clientWidth > 50 ? container.clientWidth : 500);
        const h = (rect && rect.height > 50) ? rect.height : (container && container.clientHeight > 50 ? container.clientHeight : 640);
        this.renderer.resize(w, h);
    }

    triggerHaptic(type = 'snap') {
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;
        try {
            switch (type) {
                case 'click':
                    navigator.vibrate(10); // Light haptic click on touch selection
                    break;
                case 'snap':
                    navigator.vibrate(22); // Crisp medium pulse on grid snap
                    break;
                case 'clear-1':
                    navigator.vibrate([35, 25, 35]); // Single line clear
                    break;
                case 'clear-multi':
                    navigator.vibrate([55, 30, 75]); // Multi-line clear
                    break;
                case 'all-clear':
                    navigator.vibrate([80, 30, 80, 30, 120]); // All clear celebration
                    break;
            }
        } catch (e) {}
    }

    handlePlaceAction(shapeIdx, row, col) {
        if (this.gameState.gameOver) return false;

        const result = this.gameState.placeShape(shapeIdx, row, col);
        if (!result.isValid) {
            this.audio.playInvalid();
            return false;
        }

        // Clear active hint
        this.renderer.aiHint = null;

        // 1. Auditory & Haptic Feedback Engine
        if (result.allClear) {
            this.audio.playAllClear();
            this.triggerHaptic('all-clear');
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 95);
            this.particles.triggerShake(16, 420);
        } else if (result.linesCleared >= 2) {
            this.audio.playMultiClear(result.linesCleared);
            this.audio.playClear(result.comboCount);
            this.triggerHaptic('clear-multi');
            this.particles.triggerShake(result.linesCleared >= 3 ? 12 : 7, result.linesCleared >= 3 ? 320 : 220);
        } else if (result.linesCleared === 1) {
            this.audio.playClear(result.comboCount);
            this.triggerHaptic('clear-1');
            this.particles.triggerShake(3.5, 160);
        } else {
            this.audio.playPlace();
            this.triggerHaptic('snap');
        }

        // 2. Visual Effects: Color-Matched Particle Bursts & Shockwaves
        const { cellSize, gap } = this.renderer.boardMetrics;
        const shapeColor = result.shapePlaced.color;

        for (const r of result.rowsCleared) {
            this.particles.addLineClearWave('row', r, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap);
            for (let c = 0; c < 8; c++) {
                const rect = this.renderer.getCellRect(r, c);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, shapeColor);
            }
        }
        for (const c of result.colsCleared) {
            this.particles.addLineClearWave('col', c, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap);
            for (let r = 0; r < 8; r++) {
                const rect = this.renderer.getCellRect(r, c);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, shapeColor);
            }
        }

        // 3. Score Pop-Up at Placement Center
        const centerPlaced = result.placedCells[Math.floor(result.placedCells.length / 2)];
        if (centerPlaced) {
            const rect = this.renderer.getCellRect(centerPlaced.row, centerPlaced.col);
            this.particles.addFloatingText(`+${result.scoreGained}`, rect.x + cellSize / 2, rect.y + cellSize / 2, {
                color: result.linesCleared > 0 ? '#FDE047' : '#FFFFFF',
                fontSize: result.linesCleared > 0 ? 28 : 22
            });
        }

        // 4. Bold Gold Typography Overlays ("Great!", "Superb!", "Perfect!", "COMBO x4!")
        const centerX = this.renderer.boardMetrics.x + this.renderer.boardMetrics.size / 2;
        const centerY = this.renderer.boardMetrics.y + this.renderer.boardMetrics.size / 2;

        if (result.allClear) {
            this.particles.addFloatingText('ALL CLEAR!', centerX, centerY - 20, {
                isGold: true,
                fontSize: 38,
                color: '#FFD700'
            });
        } else if (result.linesCleared >= 4) {
            this.particles.addFloatingText('PERFECT!', centerX, centerY - 20, {
                isGold: true,
                fontSize: 36,
                color: '#FFD700'
            });
        } else if (result.linesCleared === 3) {
            this.particles.addFloatingText('SUPERB!', centerX, centerY - 20, {
                isGold: true,
                fontSize: 34,
                color: '#FFD700'
            });
        } else if (result.linesCleared === 2) {
            this.particles.addFloatingText('GREAT!', centerX, centerY - 20, {
                isGold: true,
                fontSize: 32,
                color: '#FFD700'
            });
        }

        if (result.linesCleared > 0 && result.comboCount >= 2) {
            const offsetY = (result.linesCleared >= 2 || result.allClear) ? 28 : -10;
            this.particles.addFloatingText(`COMBO x${result.comboCount}!`, centerX, centerY + offsetY, {
                isGold: true,
                fontSize: 32,
                color: '#F59E0B'
            });
        }

        // High Score celebration
        if (result.isNewRecord && !this.celebratedNewRecord) {
            this.celebratedNewRecord = true;
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 70);
        }

        // Update UI Displays
        this.updateScoreDisplays();
        this.updateComboFeed();

        // Game Over Check
        if (result.gameOver) {
            this.handleGameOver();
        }

        return true;
    }

    forceGameOver() {
        if (this.isAutoplayActive) {
            this.stopAutoplay();
        }

        // If board is empty during debug testing, fill sample pattern so 4x4 center sweep is clearly visible
        let filledCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.gameState.grid[r][c] !== 0) filledCount++;
            }
        }

        if (filledCount < 12) {
            // Fill an interesting pattern across the board including the 4x4 center
            const testColors = [
                { hex: '#EF4444', light: '#FCA5A5' },
                { hex: '#3B82F6', light: '#93C5FD' },
                { hex: '#10B981', light: '#6EE7B7' },
                { hex: '#F59E0B', light: '#FDE68A' },
                { hex: '#8B5CF6', light: '#C4B5FD' }
            ];
            for (let r = 1; r <= 6; r++) {
                for (let c = 1; c <= 6; c++) {
                    if ((r + c) % 2 === 0 || (r >= 2 && r <= 5 && c >= 2 && c <= 5)) {
                        this.gameState.grid[r][c] = {
                            color: testColors[(r * 3 + c) % testColors.length],
                            placedAt: Date.now()
                        };
                    }
                }
            }
        }

        this.gameState.gameOver = true;
        this.audio.playGameOver();
        this.showGameOverModal();
    }

    handleGameOver() {
        this.audio.playGameOver();
        if (this.isAutoplayActive) {
            this.stopAutoplay();
        }

        this.gamesSinceLastInterstitial++;

        // Trigger Interstitial Break Ad (35% Ad Revenue) periodically (e.g. every 2 game overs)
        if (this.gamesSinceLastInterstitial >= 2 && this.dom.interstitialAdModal) {
            this.gamesSinceLastInterstitial = 0;
            this.showInterstitialAd(() => {
                this.showGameOverModal();
            });
        } else {
            this.showGameOverModal();
        }
    }

    showGameOverModal() {
        this.dom.modalFinalScore.textContent = this.gameState.score.toLocaleString();
        this.dom.modalHighScore.textContent = this.gameState.highestScore.toLocaleString();

        const isNewRecord = this.gameState.score >= this.gameState.highestScore && this.gameState.score > 0;
        this.dom.modalRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';

        // Update Rewarded Revive button state (limited to 1 per run)
        if (this.dom.btnModalRevive) {
            if (this.gameState.hasUsedRevive) {
                this.dom.btnModalRevive.disabled = true;
                this.dom.btnModalRevive.innerHTML = '<span>🚫 Revive Used (1/session limit)</span>';
            } else {
                this.dom.btnModalRevive.disabled = false;
                this.dom.btnModalRevive.innerHTML = '<span>📺 Watch Ad to Revive (Clear 4×4 Center)</span>';
            }
        }

        if (isNewRecord) {
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 80);
        }

        this.dom.gameOverModal.classList.add('active');
    }

    /* ==========================================================================
       Monetization: Rewarded Video Revive (4x4 Center Grid Sweep)
       ========================================================================== */

    startRewardedReviveFlow() {
        if (this.gameState.hasUsedRevive) return;

        // Close Game Over Modal and Open Rewarded Video Modal with active state
        this.dom.gameOverModal.classList.remove('active');
        this.dom.rewardedAdModal.style.display = 'flex';
        this.dom.rewardedAdModal.classList.add('active');
        this.dom.rewardedProgress.style.width = '0%';
        this.dom.btnClaimReward.style.display = 'none';

        let secondsLeft = 3;
        this.dom.rewardedTimerText.textContent = `Reward unlocking in ${secondsLeft}s...`;

        let progress = 0;
        const totalDuration = 3000;
        const interval = 60;
        const step = 100 / (totalDuration / interval);

        const timer = setInterval(() => {
            progress += step;
            this.dom.rewardedProgress.style.width = `${Math.min(100, progress)}%`;

            const currentSec = Math.max(0, Math.ceil((100 - progress) / (100 / 3)));
            if (currentSec > 0) {
                this.dom.rewardedTimerText.textContent = `Reward unlocking in ${currentSec}s...`;
            } else {
                clearInterval(timer);
                this.dom.rewardedTimerText.textContent = '🎉 Video Complete! Reward Ready.';
                this.dom.btnClaimReward.style.display = 'inline-block';
            }
        }, interval);
    }

    completeRewardedRevive() {
        // Dismiss rewarded modal
        this.dom.rewardedAdModal.classList.remove('active');
        this.dom.rewardedAdModal.style.display = 'none';

        // Perform 4x4 center sweep on matrix B[2..5][2..5]
        const sweepResult = this.gameState.reviveWithCenterSweep();

        // Laser shockwave and particle burst on revived cells
        const { cellSize, gap } = this.renderer.boardMetrics;
        const bx = this.renderer.boardMetrics.x;
        const by = this.renderer.boardMetrics.y;
        this.particles.triggerShake(15, 400);

        // Animate all 16 center cells (rows 2-5, cols 2-5)
        for (let r = 2; r <= 5; r++) {
            this.particles.addLineClearWave('row', r, bx, by, cellSize, gap);
            for (let c = 2; c <= 5; c++) {
                const rect = this.renderer.getCellRect(r, c);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, { hex: '#38BDF8', light: '#BAE6FD' });
            }
        }

        // Floating revive banner
        const cx = this.renderer.boardMetrics.x + this.renderer.boardMetrics.size / 2;
        const cy = this.renderer.boardMetrics.y + this.renderer.boardMetrics.size / 2;
        this.particles.addFloatingText('REVIVED! 4×4 CENTER SWEEP', cx, cy, {
            isGold: true,
            fontSize: 30,
            color: '#38BDF8',
            shadow: 'rgba(14, 165, 233, 0.85)'
        });

        this.audio.playAllClear();
        this.triggerHaptic('all-clear');
        this.updateScoreDisplays();
        this.updateComboFeed();
    }

    /* ==========================================================================
       Monetization: Interstitial Break Ad (35% Ad Revenue)
       ========================================================================== */

    showInterstitialAd(onCompleteCallback) {
        this.interstitialCallback = onCompleteCallback;
        this.dom.interstitialAdModal.style.display = 'flex';
        this.dom.interstitialAdModal.classList.add('active');
        this.dom.btnSkipInterstitial.disabled = true;

        let countdown = 3;
        this.dom.btnSkipInterstitial.textContent = `Close in ${countdown}s`;

        const timer = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                this.dom.btnSkipInterstitial.textContent = `Close in ${countdown}s`;
            } else {
                clearInterval(timer);
                this.dom.btnSkipInterstitial.disabled = false;
                this.dom.btnSkipInterstitial.textContent = '✕ Close Ad';
            }
        }, 1000);
    }

    closeInterstitialAd() {
        this.dom.interstitialAdModal.classList.remove('active');
        this.dom.interstitialAdModal.style.display = 'none';
        if (this.interstitialCallback) {
            this.interstitialCallback();
            this.interstitialCallback = null;
        }
    }

    restartGame() {
        this.audio.playButton();
        this.triggerHaptic('snap');
        this.celebratedNewRecord = false;
        this.gameState.reset();
        this.particles.reset();
        this.renderer.selectedShapeIdx = -1;
        this.renderer.draggingShapeIdx = -1;
        this.renderer.aiHint = null;
        this.renderer.cancelSnapBack();

        // Dismiss all modals immediately
        this.dom.gameOverModal.classList.remove('active');
        if (this.dom.rewardedAdModal) this.dom.rewardedAdModal.style.display = 'none';
        if (this.dom.interstitialAdModal) this.dom.interstitialAdModal.style.display = 'none';

        this.updateScoreDisplays();
        this.updateComboFeed();

        if (this.isAutoplayActive) {
            this.scheduleNextAutoplayStep();
        }
    }

    toggleAudio() {
        const isMuted = this.audio.toggleMute();
        this.updateAudioButtonState();
        return isMuted;
    }

    updateAudioButtonState() {
        if (this.audio.isMuted) {
            this.dom.btnSound.innerHTML = '<span class="icon">🔇</span><span class="btn-text">Muted</span>';
            this.dom.btnSound.classList.add('muted');
        } else {
            this.dom.btnSound.innerHTML = '<span class="icon">🔊</span><span class="btn-text">Sound</span>';
            this.dom.btnSound.classList.remove('muted');
        }
    }

    toggleHint() {
        if (this.gameState.gameOver) return;

        if (this.renderer.aiHint) {
            this.renderer.aiHint = null;
        } else {
            const bestMove = this.ai.findBestMove(this.gameState);
            if (bestMove) {
                this.renderer.aiHint = {
                    shapeIdx: bestMove.shapeIdx,
                    row: bestMove.row,
                    col: bestMove.col
                };
                this.renderer.selectedShapeIdx = bestMove.shapeIdx;
            }
        }
    }

    toggleAutoplay() {
        if (this.isAutoplayActive) {
            this.stopAutoplay();
        } else {
            this.startAutoplay();
        }
    }

    startAutoplay() {
        if (this.gameState.gameOver) {
            this.restartGame();
        }
        this.isAutoplayActive = true;
        this.renderer.aiThinking = true;
        this.dom.btnAutoplay.classList.add('active');
        this.dom.btnAutoplay.innerHTML = '<span class="icon">⏹️</span><span class="btn-text">Stop AI</span>';
        this.scheduleNextAutoplayStep();
    }

    stopAutoplay() {
        this.isAutoplayActive = false;
        this.renderer.aiThinking = false;
        if (this.autoplayTimer) {
            clearTimeout(this.autoplayTimer);
            this.autoplayTimer = null;
        }
        this.dom.btnAutoplay.classList.remove('active');
        this.dom.btnAutoplay.innerHTML = '<span class="icon">🤖</span><span class="btn-text">AI Autoplay</span>';
    }

    scheduleNextAutoplayStep() {
        if (!this.isAutoplayActive || this.gameState.gameOver) return;

        const speedMap = {
            slow: 650,
            normal: 320,
            fast: 130,
            turbo: 30
        };
        const delay = speedMap[this.autoplaySpeed] || 320;

        this.autoplayTimer = setTimeout(() => {
            this.executeAutoplayStep();
        }, delay);
    }

    executeAutoplayStep() {
        if (!this.isAutoplayActive || this.gameState.gameOver) return;

        const bestMove = this.ai.findBestMove(this.gameState);
        if (!bestMove) {
            this.stopAutoplay();
            return;
        }

        this.handlePlaceAction(bestMove.shapeIdx, bestMove.row, bestMove.col);

        if (!this.gameState.gameOver && this.isAutoplayActive) {
            this.scheduleNextAutoplayStep();
        } else {
            this.stopAutoplay();
        }
    }

    changeTheme(themeKey) {
        this.renderer.setTheme(themeKey);
        document.documentElement.setAttribute('data-theme', themeKey);
    }

    openStatsModal() {
        const stats = this.gameState.stats;
        this.dom.statGames.textContent = stats.gamesPlayed || 0;
        this.dom.statHighScore.textContent = (this.gameState.highestScore || 0).toLocaleString();
        this.dom.statMaxCombo.textContent = stats.maxComboStreak || 0;
        this.dom.statLines.textContent = stats.totalLinesCleared || 0;
        this.dom.statAllClears.textContent = stats.allClearsCount || 0;

        this.dom.statsModal.classList.add('active');
    }

    closeStatsModal() {
        this.dom.statsModal.classList.remove('active');
    }

    updateScoreDisplays() {
        if (this.dom.scoreCurrent) this.dom.scoreCurrent.textContent = this.gameState.score.toLocaleString();
        if (this.dom.scoreHighest) this.dom.scoreHighest.textContent = this.gameState.highestScore.toLocaleString();
        if (this.dom.comboCurrent) this.dom.comboCurrent.textContent = this.gameState.comboCount;
        if (this.dom.comboFlame) {
            this.dom.comboFlame.style.display = this.gameState.comboCount >= 2 ? 'inline' : 'none';
        }
    }

    updateComboFeed() {
        const history = this.gameState.comboHistory;
        this.dom.comboFeed.innerHTML = '';

        for (let i = history.length - 1; i >= 0; i--) {
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.textContent = history[i];
            if (i === history.length - 1) {
                item.style.fontWeight = '700';
                item.style.color = '#F97316';
            }
            this.dom.comboFeed.appendChild(item);
        }
    }

    gameLoop(timestamp) {
        const dt = Math.min(timestamp - this.lastTime, 100);
        this.lastTime = timestamp;

        // Auto-correct if canvas had uninitialized dimensions
        if (this.renderer.width < 100 || this.renderer.height < 100) {
            this.handleResize();
        }

        this.particles.update(dt);
        this.renderer.render(dt);

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new BlockBlastApp();
});
