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
            this.restartGame.bind(this)
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

    handlePlaceAction(shapeIdx, row, col) {
        if (this.gameState.gameOver) return false;

        const result = this.gameState.placeShape(shapeIdx, row, col);
        if (!result.isValid) {
            this.audio.playInvalid();
            return false;
        }

        // Clear active hint
        this.renderer.aiHint = null;

        // Sound effects
        if (result.allClear) {
            this.audio.playAllClear();
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 90);
        } else if (result.linesCleared >= 2) {
            this.audio.playMultiClear(result.linesCleared);
            this.audio.playClear(result.comboCount);
        } else if (result.linesCleared === 1) {
            this.audio.playClear(result.comboCount);
        } else {
            this.audio.playPlace();
        }

        // Screen Shake on multi-clears
        if (result.linesCleared >= 3) {
            this.particles.triggerShake(10, 320);
        } else if (result.linesCleared === 2) {
            this.particles.triggerShake(5, 200);
        }

        // Particles for placed blocks & cleared lines
        const { cellSize, gap } = this.renderer.boardMetrics;

        // Line clear laser waves
        for (const r of result.rowsCleared) {
            this.particles.addLineClearWave('row', r, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap);
            for (let c = 0; c < 8; c++) {
                const rect = this.renderer.getCellRect(r, c);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, result.shapePlaced.color);
            }
        }
        for (const c of result.colsCleared) {
            this.particles.addLineClearWave('col', c, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap);
            for (let r = 0; r < 8; r++) {
                const rect = this.renderer.getCellRect(r, c);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, result.shapePlaced.color);
            }
        }

        // Floating score popup
        const centerPlaced = result.placedCells[Math.floor(result.placedCells.length / 2)];
        if (centerPlaced) {
            const rect = this.renderer.getCellRect(centerPlaced.row, centerPlaced.col);
            this.particles.addFloatingText(`+${result.scoreGained}`, rect.x + cellSize / 2, rect.y + cellSize / 2, {
                color: result.linesCleared > 0 ? '#FDE047' : '#FFFFFF',
                fontSize: result.linesCleared > 0 ? 28 : 22
            });
        }

        // Floating combo text
        if (result.comboMessage) {
            const bx = this.renderer.boardMetrics.x + this.renderer.boardMetrics.size / 2;
            const by = this.renderer.boardMetrics.y + this.renderer.boardMetrics.size / 2;
            this.particles.addFloatingText(result.comboMessage, bx, by - 30, {
                color: '#F97316',
                fontSize: 32,
                font: '900 32px Outfit, sans-serif'
            });
        }

        // High Score celebration
        if (result.isNewRecord && !this.celebratedNewRecord) {
            this.celebratedNewRecord = true;
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 60);
        }

        // Update UI
        this.updateScoreDisplays();
        this.updateComboFeed();

        // Game Over Check
        if (result.gameOver) {
            this.handleGameOver();
        }

        return true;
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

        // Open Rewarded Video Modal
        this.dom.gameOverModal.classList.remove('active');
        this.dom.rewardedAdModal.style.display = 'flex';
        this.dom.rewardedProgress.style.width = '0%';
        this.dom.btnClaimReward.style.display = 'none';

        let secondsLeft = 5;
        this.dom.rewardedTimerText.textContent = `Reward unlocking in ${secondsLeft}s...`;

        const startTime = Date.now();
        const duration = 5000;

        const adInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(100, (elapsed / duration) * 100);
            this.dom.rewardedProgress.style.width = `${progress}%`;

            const currentSec = Math.max(0, Math.ceil((duration - elapsed) / 1000));
            if (currentSec > 0) {
                this.dom.rewardedTimerText.textContent = `Reward unlocking in ${currentSec}s...`;
            } else {
                clearInterval(adInterval);
                this.dom.rewardedTimerText.textContent = '✅ Video complete! Reward ready.';
                this.dom.btnClaimReward.style.display = 'inline-block';
            }
        }, 100);
    }

    completeRewardedRevive() {
        this.dom.rewardedAdModal.style.display = 'none';
        const res = this.gameState.reviveWithCenterSweep();

        if (res.success) {
            const { cellSize, gap } = this.renderer.boardMetrics;
            const bx = this.renderer.boardMetrics.x;
            const by = this.renderer.boardMetrics.y;

            // Trigger visual 4x4 center sweep shockwave and particle explosions
            for (let r = 2; r <= 5; r++) {
                this.particles.addLineClearWave('row', r, bx, by, cellSize, gap);
                for (let c = 2; c <= 5; c++) {
                    const rect = this.renderer.getCellRect(r, c);
                    this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, { hex: '#10B981', light: '#6EE7B7', dark: '#059669' });
                }
            }

            this.audio.playAllClear();
            this.particles.triggerShake(8, 250);
            this.particles.addFloatingText('✨ 4×4 CENTER GRID SWEEP!', bx + this.renderer.boardMetrics.size / 2, by + this.renderer.boardMetrics.size / 2, {
                color: '#10B981',
                fontSize: 28,
                font: '900 28px Outfit, sans-serif'
            });

            this.updateScoreDisplays();
            this.updateComboFeed();
        }
    }

    /* ==========================================================================
       Monetization: Interstitial Break Ad (35% Ad Revenue)
       ========================================================================== */

    showInterstitialAd(onCompleteCallback) {
        this.interstitialCallback = onCompleteCallback;
        this.dom.interstitialAdModal.style.display = 'flex';
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
        this.dom.interstitialAdModal.style.display = 'none';
        if (this.interstitialCallback) {
            this.interstitialCallback();
            this.interstitialCallback = null;
        }
    }

    restartGame() {
        this.celebratedNewRecord = false;
        this.gameState.reset();
        this.particles.reset();
        this.renderer.selectedShapeIdx = -1;
        this.renderer.draggingShapeIdx = -1;
        this.renderer.aiHint = null;
        this.dom.gameOverModal.classList.remove('active');

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
