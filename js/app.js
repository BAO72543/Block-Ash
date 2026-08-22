/**
 * Block Blast - Main Application Coordinator
 * Connects Game Engine, Renderer, Audio, AI Solver, Input, and DOM UI.
 */

import { BlockGameState } from './game.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { GameRenderer } from './renderer.js';
import { BlockBlastAI } from './ai.js';
import { InputHandler } from './input.js';

class BlockBlastApp {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.gameState = new BlockGameState();
        this.particles = new ParticleSystem();
        this.audio = new AudioManager();
        this.renderer = new GameRenderer(this.canvas, this.gameState, this.particles);
        this.ai = new BlockBlastAI();

        // AI Autoplay state
        this.isAutoplayActive = false;
        this.autoplayTimer = null;
        this.autoplaySpeeds = {
            'slow': 800,
            'normal': 450,
            'fast': 220,
            'turbo': 80
        };
        this.currentAutoplaySpeed = 'normal';

        // DOM Elements
        this.dom = {
            score: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            comboBadge: document.getElementById('combo-badge'),
            comboCount: document.getElementById('combo-count'),
            comboFlame: document.getElementById('combo-flame'),
            comboFeed: document.getElementById('combo-feed'),
            btnHint: document.getElementById('btn-hint'),
            btnAutoplay: document.getElementById('btn-autoplay'),
            btnSound: document.getElementById('btn-sound'),
            btnStats: document.getElementById('btn-stats'),
            btnTheme: document.getElementById('btn-theme'),
            btnRestart: document.getElementById('btn-restart'),
            gameOverModal: document.getElementById('game-over-modal'),
            modalFinalScore: document.getElementById('modal-final-score'),
            modalHighScore: document.getElementById('modal-high-score'),
            modalRecordBadge: document.getElementById('modal-record-badge'),
            btnModalRestart: document.getElementById('btn-modal-restart'),
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
                this.currentAutoplaySpeed = e.target.value;
                if (this.isAutoplayActive) {
                    this.scheduleNextAutoplayStep();
                }
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
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.renderer.resize(rect.width, rect.height);
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
            const text = result.linesCleared > 0 ? `+${result.scoreGained}` : `+${result.scoreGained}`;
            this.particles.addFloatingText(text, rect.x + cellSize / 2, rect.y + cellSize / 2, {
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

        this.dom.modalFinalScore.textContent = this.gameState.score.toLocaleString();
        this.dom.modalHighScore.textContent = this.gameState.highestScore.toLocaleString();

        const isNewRecord = this.gameState.score >= this.gameState.highestScore && this.gameState.score > 0;
        this.dom.modalRecordBadge.style.display = isNewRecord ? 'inline-block' : 'none';

        if (isNewRecord) {
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 80);
        }

        this.dom.gameOverModal.classList.add('active');
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

        if (this.autoplayTimer) clearTimeout(this.autoplayTimer);

        const delay = this.autoplaySpeeds[this.currentAutoplaySpeed] || 450;
        this.autoplayTimer = setTimeout(() => {
            if (!this.isAutoplayActive || this.gameState.gameOver) return;

            const bestMove = this.ai.findBestMove(this.gameState);
            if (bestMove) {
                this.handlePlaceAction(bestMove.shapeIdx, bestMove.row, bestMove.col);
                if (this.isAutoplayActive && !this.gameState.gameOver) {
                    this.scheduleNextAutoplayStep();
                }
            } else {
                this.stopAutoplay();
            }
        }, delay);
    }

    changeTheme(themeKey) {
        this.renderer.setTheme(themeKey);
        document.body.setAttribute('data-theme', themeKey);
    }

    openStatsModal() {
        const stats = this.gameState.stats;
        this.dom.statGames.textContent = (stats.gamesPlayed || 0).toLocaleString();
        this.dom.statHighScore.textContent = (stats.highScore || 0).toLocaleString();
        this.dom.statMaxCombo.textContent = (stats.maxComboStreak || 0).toString();
        this.dom.statLines.textContent = (stats.totalLinesCleared || 0).toLocaleString();
        this.dom.statAllClears.textContent = (stats.allClearsCount || 0).toLocaleString();
        this.dom.statsModal.classList.add('active');
    }

    closeStatsModal() {
        this.dom.statsModal.classList.remove('active');
    }

    updateScoreDisplays() {
        this.dom.score.textContent = this.gameState.score.toLocaleString();
        this.dom.highScore.textContent = this.gameState.highestScore.toLocaleString();

        const combo = this.gameState.combos[1];
        this.dom.comboCount.textContent = combo.toString();

        if (combo > 0) {
            this.dom.comboBadge.classList.add('active');
            this.dom.comboFlame.style.display = 'inline-block';
        } else {
            this.dom.comboBadge.classList.remove('active');
            this.dom.comboFlame.style.display = 'none';
        }
    }

    updateComboFeed() {
        if (!this.dom.comboFeed) return;
        const messages = this.gameState.combos[0];
        this.dom.comboFeed.innerHTML = messages.map(msg => {
            const isHighlight = msg.includes('CLEAR') || msg.includes('ALL');
            return `<div class="feed-item ${isHighlight ? 'highlight' : ''}">${msg}</div>`;
        }).join('');
        this.dom.comboFeed.scrollTop = this.dom.comboFeed.scrollHeight;
    }

    gameLoop(now) {
        const dt = Math.min(now - this.lastTime, 50);
        this.lastTime = now;

        // Update particle physics & animations
        this.particles.update(dt);

        // Render Canvas
        this.renderer.render(dt);

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.blockBlastApp = new BlockBlastApp();
});
