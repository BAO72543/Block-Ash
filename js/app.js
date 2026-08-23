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
import { GAME_MODES, ModeManager, DailyChallengeManager, ADVENTURE_STAGES } from './modes.js';
import { SkinManager, SKINS } from './skins.js';

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
        this.autoplaySpeed = 'normal'; // slow (650ms), normal (320ms), fast (130ms), turbo (30ms)

        // Monetization loops
        this.gamesSinceLastInterstitial = 0;
        this.rewardReviveTimer = null;

        // Cache DOM Elements with robust fallbacks
        this.dom = {
            appWrapper: document.querySelector('.app-wrapper'),
            homeScreen: document.getElementById('home-screen'),
            gameplayView: document.getElementById('gameplay-view'),
            btnToggleSidebar: document.getElementById('btn-toggle-sidebar'),
            sidebar: document.getElementById('game-sidebar'),
            btnPlayClassic: document.getElementById('btn-play-classic'),
            btnPlayAdventure: document.getElementById('btn-play-adventure'),
            btnPlayDrop: document.getElementById('btn-play-drop'),
            btnPlayDaily: document.getElementById('btn-play-daily'),
            btnReturnHome: document.getElementById('btn-return-home'),
            homeClassicScore: document.getElementById('home-classic-score'),
            homeAdventureStage: document.getElementById('home-adventure-stage'),
            homeDailyStreak: document.getElementById('home-daily-streak'),
            milestoneBarFill: document.getElementById('milestone-bar-fill'),
            milestoneTargetText: document.getElementById('milestone-target-text'),
            homeBtnStats: document.getElementById('home-btn-stats'),
            homeBtnSound: document.getElementById('home-btn-sound'),
            scoreCurrent: document.getElementById('current-score') || document.getElementById('score-current'),
            scoreHighest: document.getElementById('high-score') || document.getElementById('score-highest'),
            wingHighScore: document.getElementById('wing-high-score'),
            wingMaxCombo: document.getElementById('wing-max-combo'),
            comboCurrent: document.getElementById('combo-count') || document.getElementById('combo-current'),
            comboFlame: document.getElementById('combo-flame'),
            comboFeed: document.getElementById('combo-feed'),
            tabModeClassic: document.getElementById('tab-mode-classic'),
            tabModeAdventure: document.getElementById('tab-mode-adventure'),
            tabModeDrop: document.getElementById('tab-mode-drop'),
            modeStatusBar: document.getElementById('mode-status-bar'),
            modeStageBadge: document.getElementById('mode-stage-badge'),
            modeGoalText: document.getElementById('mode-goal-text'),
            modeMovesText: document.getElementById('mode-moves-text'),
            btnOpenStageMap: document.getElementById('btn-open-stage-map'),
            adventureMapModal: document.getElementById('adventure-map-modal'),
            stageMapContainer: document.getElementById('stage-map-container'),
            btnCloseStageMap: document.getElementById('btn-close-stage-map'),
            stageClearModal: document.getElementById('stage-clear-modal'),
            stageClearTitle: document.getElementById('stage-clear-title'),
            stageClearStars: document.getElementById('stage-clear-stars'),
            stageClearScore: document.getElementById('stage-clear-score'),
            stageClearMovesLeft: document.getElementById('stage-clear-moves-left'),
            btnStageMapAfterWin: document.getElementById('btn-stage-map-after-win'),
            btnNextStage: document.getElementById('btn-next-stage'),
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
            autoplaySpeedSelect: document.getElementById('autoplay-speed-select'),
            homeBtnSkins: document.getElementById('home-btn-skins'),
            homeActiveSkinName: document.getElementById('home-active-skin-name'),
            homeActiveSwatch: document.getElementById('home-active-swatch'),
            btnSkins: document.getElementById('btn-skins'),
            skinsModal: document.getElementById('skins-modal'),
            btnCloseSkins: document.getElementById('btn-close-skins'),
            tabSkinBg: document.getElementById('tab-skin-bg'),
            tabSkinPuzzle: document.getElementById('tab-skin-puzzle'),
            tabSkinEffect: document.getElementById('tab-skin-effect'),
            panelSkinBg: document.getElementById('panel-skin-bg'),
            panelSkinPuzzle: document.getElementById('panel-skin-puzzle'),
            panelSkinEffect: document.getElementById('panel-skin-effect'),
            gridSkinBg: document.getElementById('grid-skin-bg'),
            gridSkinPuzzle: document.getElementById('grid-skin-puzzle'),
            gridSkinEffect: document.getElementById('grid-skin-effect'),
            summaryBgName: document.getElementById('summary-bg-name'),
            summaryPuzzleName: document.getElementById('summary-puzzle-name'),
            summaryEffectName: document.getElementById('summary-effect-name')
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
        this.initSkinsGallery();
        this.showHomeScreen();

        // Handle resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Start animation loop
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    showHomeScreen() {
        if (this.isAutoplayActive) {
            this.stopAutoplay();
        }

        if (this.dom.appWrapper) this.dom.appWrapper.classList.remove('in-game');
        if (this.dom.homeScreen) this.dom.homeScreen.style.display = 'flex';
        if (this.dom.gameplayView) this.dom.gameplayView.style.display = 'none';

        // Update home screen metadata
        const highestScore = this.gameState.highestScore || 0;
        if (this.dom.homeClassicScore) {
            this.dom.homeClassicScore.textContent = highestScore.toLocaleString();
        }
        if (this.dom.homeAdventureStage) {
            const progress = ModeManager.loadAdventureProgress();
            this.dom.homeAdventureStage.textContent = `Stage ${progress.unlockedStage || 1}`;
        }

        // Milestone Progress Track Calculation
        const TIERS = [1000, 2500, 5000, 10000, 20000, 50000, 100000];
        const nextTier = TIERS.find(t => t > highestScore) || (highestScore + 5000);
        const prevTier = TIERS[TIERS.indexOf(nextTier) - 1] || 0;
        const pct = Math.min(100, Math.max(8, Math.round(((highestScore - prevTier) / (nextTier - prevTier)) * 100)));
        if (this.dom.milestoneTargetText) this.dom.milestoneTargetText.textContent = `${nextTier.toLocaleString()} PTS`;
        if (this.dom.milestoneBarFill) this.dom.milestoneBarFill.style.width = `${pct}%`;

        // Update Daily Challenge Streak
        const dailyData = DailyChallengeManager.loadDailyData();
        if (this.dom.homeDailyStreak) {
            this.dom.homeDailyStreak.textContent = `Streak: ${dailyData.streakDays || 1}`;
        }
    }

    enterGameWithMode(mode) {
        this.audio.playPop();
        this.triggerHaptic('snap');
        if (this.dom.appWrapper) this.dom.appWrapper.classList.add('in-game');
        if (this.dom.homeScreen) this.dom.homeScreen.style.display = 'none';
        if (this.dom.gameplayView) this.dom.gameplayView.style.display = 'block';

        this.handleResize();
        setTimeout(() => this.handleResize(), 60);
        this.switchMode(mode);
    }

    setupEventListeners() {
        // Tactile Hover Audio for 3D Arcade Cards and Buttons
        const hoverElements = document.querySelectorAll('.hero-mode-card, .secondary-mode-card, .daily-challenge-card, .btn-3d-circle, .btn-3d, .theme-pill, .btn-hud-icon');
        hoverElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.audio.playHover();
            });
        });

        // Sidebar Toggle Button
        if (this.dom.btnToggleSidebar) {
            this.dom.btnToggleSidebar.addEventListener('click', () => {
                this.audio.playPop();
                if (this.dom.sidebar) {
                    this.dom.sidebar.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Home Screen Mode Buttons
        if (this.dom.btnPlayClassic) {
            this.dom.btnPlayClassic.addEventListener('click', () => this.enterGameWithMode(GAME_MODES.CLASSIC));
        }
        if (this.dom.btnPlayAdventure) {
            this.dom.btnPlayAdventure.addEventListener('click', () => this.enterGameWithMode(GAME_MODES.ADVENTURE));
        }
        if (this.dom.btnPlayDrop) {
            this.dom.btnPlayDrop.addEventListener('click', () => this.enterGameWithMode(GAME_MODES.DROP));
        }
        if (this.dom.btnPlayDaily) {
            this.dom.btnPlayDaily.addEventListener('click', () => this.enterGameWithMode(GAME_MODES.DAILY));
        }
        if (this.dom.btnReturnHome) {
            this.dom.btnReturnHome.addEventListener('click', () => {
                this.audio.playPop();
                this.showHomeScreen();
            });
        }
        if (this.dom.homeBtnStats) {
            this.dom.homeBtnStats.addEventListener('click', () => {
                this.audio.playPop();
                this.openStatsModal();
            });
        }
        if (this.dom.homeBtnSound) {
            this.dom.homeBtnSound.addEventListener('click', () => {
                this.toggleAudio();
            });
        }

        if (this.dom.homeBtnSkins) {
            this.dom.homeBtnSkins.addEventListener('click', () => {
                this.audio.playPop();
                this.openSkinsModal();
            });
        }
        if (this.dom.btnSkins) {
            this.dom.btnSkins.addEventListener('click', () => {
                this.audio.playButton();
                this.openSkinsModal();
            });
        }
        if (this.dom.btnCloseSkins) {
            this.dom.btnCloseSkins.addEventListener('click', () => {
                this.audio.playButton();
                this.closeSkinsModal();
            });
        }
        if (this.dom.tabSkinBg) this.dom.tabSkinBg.addEventListener('click', () => this.switchSkinsTab('bg'));
        if (this.dom.tabSkinPuzzle) this.dom.tabSkinPuzzle.addEventListener('click', () => this.switchSkinsTab('puzzle'));
        if (this.dom.tabSkinEffect) this.dom.tabSkinEffect.addEventListener('click', () => this.switchSkinsTab('effect'));

        // Mode Tabs
        if (this.dom.tabModeClassic) {
            this.dom.tabModeClassic.addEventListener('click', () => this.switchMode(GAME_MODES.CLASSIC));
        }
        if (this.dom.tabModeAdventure) {
            this.dom.tabModeAdventure.addEventListener('click', () => this.switchMode(GAME_MODES.ADVENTURE));
        }
        if (this.dom.tabModeDrop) {
            this.dom.tabModeDrop.addEventListener('click', () => this.switchMode(GAME_MODES.DROP));
        }

        // Stage Map Buttons
        if (this.dom.btnOpenStageMap) {
            this.dom.btnOpenStageMap.addEventListener('click', () => this.openAdventureMap());
        }
        if (this.dom.btnCloseStageMap) {
            this.dom.btnCloseStageMap.addEventListener('click', () => this.closeAdventureMap());
        }
        if (this.dom.btnStageMapAfterWin) {
            this.dom.btnStageMapAfterWin.addEventListener('click', () => {
                this.dom.stageClearModal.style.display = 'none';
                this.openAdventureMap();
            });
        }
        if (this.dom.btnNextStage) {
            this.dom.btnNextStage.addEventListener('click', () => this.nextAdventureStage());
        }

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

        // Item collection effects in Adventure Mode
        if (result.collectedItems && result.collectedItems.length > 0) {
            this.audio.playClear(result.comboCount + 2);
            for (const it of result.collectedItems) {
                const rect = this.renderer.getCellRect(it.row, it.col);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size, { hex: '#FDE047', light: '#FEF08A' });
                this.particles.addFloatingText('COLLECTED!', rect.x + cellSize / 2, rect.y + cellSize / 2, {
                    isGold: true,
                    fontSize: 24,
                    color: '#FBBF24'
                });
            }
        }

        // Drop Mode Rising Stack effect
        if (result.rowPushed) {
            this.particles.triggerShake(8, 260);
            this.audio.playMultiClear(2);
            this.particles.addFloatingText('STACK RISE!', centerX, centerY + 60, {
                fontSize: 26,
                color: '#EF4444'
            });
        }

        // Adventure Mode Victory
        if (result.isAdventureWin) {
            if (this.isAutoplayActive) {
                this.stopAutoplay();
            }
            this.gameState.gameOver = true;
            this.updateScoreDisplays();
            this.updateComboFeed();
            this.updateModeStatusBar();
            this.audio.playAllClear();
            this.triggerHaptic('all-clear');
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 100);
            this.showStageClearModal(result);
            return true;
        }

        // High Score celebration
        if (result.isNewRecord && !this.celebratedNewRecord) {
            this.celebratedNewRecord = true;
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 70);
        }

        // Update UI Displays
        this.updateScoreDisplays();
        this.updateComboFeed();
        this.updateModeStatusBar();

        // Game Over Check
        if (result.gameOver) {
            this.handleGameOver();
        }

        return true;
    }

    /* ==========================================================================
       Mode Switching & Progression Handlers
       ========================================================================== */

    switchMode(mode) {
        if (this.isAutoplayActive) {
            this.stopAutoplay();
        }

        // Update Tab Active States
        [this.dom.tabModeClassic, this.dom.tabModeAdventure, this.dom.tabModeDrop].forEach(tab => {
            if (tab) tab.classList.remove('active');
        });

        if (mode === GAME_MODES.CLASSIC && this.dom.tabModeClassic) this.dom.tabModeClassic.classList.add('active');
        if (mode === GAME_MODES.ADVENTURE && this.dom.tabModeAdventure) this.dom.tabModeAdventure.classList.add('active');
        if (mode === GAME_MODES.DROP && this.dom.tabModeDrop) this.dom.tabModeDrop.classList.add('active');

        this.gameState.mode = mode;

        if (mode === GAME_MODES.ADVENTURE) {
            const progress = ModeManager.loadAdventureProgress();
            this.initAdventureStage(progress.unlockedStage || 1);
        } else if (mode === GAME_MODES.DROP) {
            this.gameState.initDropMode();
        } else if (mode === GAME_MODES.DAILY) {
            this.gameState.initDailyChallenge();
        } else {
            this.gameState.reset();
        }

        this.particles.reset();
        this.renderer.selectedShapeIdx = -1;
        this.renderer.draggingShapeIdx = -1;
        this.renderer.aiHint = null;
        this.dom.gameOverModal.classList.remove('active');
        if (this.dom.stageClearModal) this.dom.stageClearModal.style.display = 'none';

        this.updateScoreDisplays();
        this.updateComboFeed();
        this.updateModeStatusBar();
    }

    initAdventureStage(stageId) {
        this.gameState.initAdventureStage(stageId);
        this.particles.reset();
        this.renderer.selectedShapeIdx = -1;
        this.renderer.draggingShapeIdx = -1;
        this.renderer.aiHint = null;
        this.dom.gameOverModal.classList.remove('active');
        if (this.dom.stageClearModal) this.dom.stageClearModal.style.display = 'none';
        if (this.dom.adventureMapModal) this.dom.adventureMapModal.style.display = 'none';

        this.updateScoreDisplays();
        this.updateComboFeed();
        this.updateModeStatusBar();
    }

    updateModeStatusBar() {
        if (!this.dom.modeStatusBar) return;

        if (this.gameState.mode === GAME_MODES.ADVENTURE) {
            this.dom.modeStatusBar.style.display = 'flex';
            if (this.dom.modeStageBadge) this.dom.modeStageBadge.textContent = `Stage ${this.gameState.stageId}`;
            if (this.dom.modeGoalText) {
                const g = this.gameState.stageGoals;
                this.dom.modeGoalText.textContent = `Goal: ${g.collected}/${g.target} ${g.type.toUpperCase()}`;
            }
            if (this.dom.modeMovesText) {
                this.dom.modeMovesText.textContent = `Moves Left: ${this.gameState.movesRemaining}`;
            }
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'inline-block';
        } else if (this.gameState.mode === GAME_MODES.DROP) {
            this.dom.modeStatusBar.style.display = 'flex';
            if (this.dom.modeStageBadge) this.dom.modeStageBadge.textContent = 'DROP MODE';
            if (this.dom.modeGoalText) {
                this.dom.modeGoalText.textContent = `Survive Rising Stacks`;
            }
            if (this.dom.modeMovesText) {
                this.dom.modeMovesText.textContent = `Next Rise in: ${this.gameState.movesUntilDrop} moves`;
            }
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'none';
        } else if (this.gameState.mode === GAME_MODES.DAILY) {
            this.dom.modeStatusBar.style.display = 'flex';
            if (this.dom.modeStageBadge) this.dom.modeStageBadge.textContent = 'DAILY PUZZLE';
            if (this.dom.modeGoalText) {
                const g = this.gameState.stageGoals;
                this.dom.modeGoalText.textContent = `Goal: ${g.collected}/${g.target} GEMS`;
            }
            if (this.dom.modeMovesText) {
                this.dom.modeMovesText.textContent = `Moves Left: ${this.gameState.movesRemaining}`;
            }
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'none';
        } else {
            this.dom.modeStatusBar.style.display = 'none';
        }
    }

    openAdventureMap() {
        if (!this.dom.adventureMapModal || !this.dom.stageMapContainer) return;

        const progress = ModeManager.loadAdventureProgress();
        this.dom.stageMapContainer.innerHTML = '';

        for (let i = 1; i <= 12; i++) {
            const isUnlocked = i <= progress.unlockedStage;
            const isCurrent = i === this.gameState.stageId && this.gameState.mode === GAME_MODES.ADVENTURE;
            const stageScoreInfo = progress.stageScores[i] || { stars: 0, highScore: 0 };

            const node = document.createElement('div');
            node.className = `stage-node ${isUnlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''}`;
            
            const starsText = isUnlocked && stageScoreInfo.stars > 0 
                ? '★'.repeat(stageScoreInfo.stars) + '☆'.repeat(3 - stageScoreInfo.stars)
                : (isUnlocked ? '☆☆☆' : '🔒 Locked');

            node.innerHTML = `
                <div class="stage-node-title">Stage ${i}</div>
                <div class="stage-node-stars">${starsText}</div>
                ${isUnlocked && stageScoreInfo.highScore > 0 ? `<div class="stage-node-score">Score: ${stageScoreInfo.highScore}</div>` : ''}
            `;

            if (isUnlocked) {
                node.addEventListener('click', () => {
                    this.closeAdventureMap();
                    this.switchMode(GAME_MODES.ADVENTURE);
                    this.initAdventureStage(i);
                });
            }

            this.dom.stageMapContainer.appendChild(node);
        }

        this.dom.adventureMapModal.style.display = 'flex';
        this.dom.adventureMapModal.classList.add('active');
    }

    closeAdventureMap() {
        if (this.dom.adventureMapModal) {
            this.dom.adventureMapModal.classList.remove('active');
            this.dom.adventureMapModal.style.display = 'none';
        }
    }

    showStageClearModal(result) {
        if (!this.dom.stageClearModal) return;

        if (this.dom.stageClearTitle) this.dom.stageClearTitle.textContent = `Stage ${this.gameState.stageId} Cleared!`;
        if (this.dom.stageClearStars) {
            const stars = result.starsEarned || 1;
            this.dom.stageClearStars.textContent = '★'.repeat(stars) + '☆'.repeat(3 - stars);
        }
        if (this.dom.stageClearScore) this.dom.stageClearScore.textContent = this.gameState.score.toLocaleString();
        if (this.dom.stageClearMovesLeft) this.dom.stageClearMovesLeft.textContent = this.gameState.movesRemaining;

        this.dom.stageClearModal.style.display = 'flex';
        this.dom.stageClearModal.classList.add('active');

        // Interstitial Ad trigger on stage clear
        this.gamesSinceLastInterstitial++;
        if (this.gamesSinceLastInterstitial >= 2 && this.dom.interstitialAdModal) {
            this.gamesSinceLastInterstitial = 0;
            this.showInterstitialAd(() => {});
        }
    }

    nextAdventureStage() {
        if (this.dom.stageClearModal) {
            this.dom.stageClearModal.classList.remove('active');
            this.dom.stageClearModal.style.display = 'none';
        }
        const nextId = (this.gameState.stageId || 1) + 1;
        this.initAdventureStage(nextId);
    }

    forceGameOver() {
        if (this.isAutoplayActive) {
            this.stopAutoplay();
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
        this.particles.addFloatingText('Cleared', cx, cy, {
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

    initSkinsGallery() {
        const config = SkinManager.loadConfig();
        this.selectBackgroundSkin(config.bg, false);
        this.selectPuzzleSkin(config.puzzle, false);
        this.selectEffectSkin(config.effect, false);
        this.renderSkinsGallery();
    }

    switchSkinsTab(tabKey) {
        this.audio.playHover();
        const tabs = [
            { key: 'bg', btn: this.dom.tabSkinBg, panel: this.dom.panelSkinBg },
            { key: 'puzzle', btn: this.dom.tabSkinPuzzle, panel: this.dom.panelSkinPuzzle },
            { key: 'effect', btn: this.dom.tabSkinEffect, panel: this.dom.panelSkinEffect }
        ];

        tabs.forEach(t => {
            if (t.btn) t.btn.classList.toggle('active', t.key === tabKey);
            if (t.panel) {
                t.panel.style.display = t.key === tabKey ? 'block' : 'none';
                t.panel.classList.toggle('active', t.key === tabKey);
            }
        });
    }

    renderSkinsGallery() {
        this.renderBackgroundTab();
        this.renderPuzzleTab();
        this.renderEffectTab();
        this.updateSkinsSummary();
    }

    renderBackgroundTab() {
        if (!this.dom.gridSkinBg) return;
        const config = SkinManager.loadConfig();
        const backgrounds = SkinManager.getAllBackgrounds();

        this.dom.gridSkinBg.innerHTML = '';
        backgrounds.forEach(bg => {
            const isEquipped = bg.id === config.bg;
            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'active' : ''}`;
            card.setAttribute('data-bg-id', bg.id);

            card.innerHTML = `
                <div class="skin-card-header">
                    <div class="skin-preview-chip" style="background: ${bg.bg}; border: 1.5px solid ${bg.dockBorder};">
                        <div class="skin-mini-shape" style="background: ${bg.boardBg}; border: 1px solid rgba(255,255,255,0.2);"></div>
                    </div>
                    <div class="skin-card-info">
                        <div class="skin-card-name">${bg.name}</div>
                        <div class="skin-card-desc">${bg.desc}</div>
                    </div>
                </div>
                <div class="skin-card-footer">
                    <span class="skin-chip-tag" style="background: ${bg.bg}; color: #FFFFFF;">${bg.bg}</span>
                    <button class="btn-skin-action ${isEquipped ? 'equipped' : ''}">
                        ${isEquipped ? 'EQUIPPED' : 'SELECT'}
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                this.audio.playPop();
                this.selectBackgroundSkin(bg.id);
            });

            this.dom.gridSkinBg.appendChild(card);
        });
    }

    renderPuzzleTab() {
        if (!this.dom.gridSkinPuzzle) return;
        const config = SkinManager.loadConfig();
        const puzzles = SkinManager.getAllPuzzles();

        this.dom.gridSkinPuzzle.innerHTML = '';
        puzzles.forEach(p => {
            const isEquipped = p.id === config.puzzle;
            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'active' : ''}`;
            card.setAttribute('data-puzzle-id', p.id);

            const swatchesHtml = p.palette.slice(0, 5).map(c => 
                `<span class="skin-dot" style="background: ${c.hex}; box-shadow: 0 0 6px ${c.hex}88;"></span>`
            ).join('');

            card.innerHTML = `
                <div class="skin-card-header">
                    <div class="skin-preview-chip" style="background: #111827; border: 1.5px solid rgba(255,255,255,0.15);">
                        <div class="skin-mini-shape" style="background: ${p.palette[0].hex}; box-shadow: inset 1px 1px 0 rgba(255,255,255,0.4);"></div>
                    </div>
                    <div class="skin-card-info">
                        <div class="skin-card-name">${p.name}</div>
                        <div class="skin-card-desc">${p.desc}</div>
                    </div>
                </div>
                <div class="skin-card-footer">
                    <div class="skin-swatches-row">
                        ${swatchesHtml}
                    </div>
                    <button class="btn-skin-action ${isEquipped ? 'equipped' : ''}">
                        ${isEquipped ? 'EQUIPPED' : 'SELECT'}
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                this.audio.playPop();
                this.selectPuzzleSkin(p.id);
            });

            this.dom.gridSkinPuzzle.appendChild(card);
        });
    }

    renderEffectTab() {
        if (!this.dom.gridSkinEffect) return;
        const config = SkinManager.loadConfig();
        const effects = SkinManager.getAllEffects();

        this.dom.gridSkinEffect.innerHTML = '';
        effects.forEach(eff => {
            const isEquipped = eff.id === config.effect;
            const card = document.createElement('div');
            card.className = `skin-card ${isEquipped ? 'active' : ''}`;
            card.setAttribute('data-effect-id', eff.id);

            const shapeIcon = eff.particleShape === 'star' ? '⭐' :
                              eff.particleShape === 'diamond' ? '🔷' :
                              eff.particleShape === 'circle' ? '⚪' : '◼️';

            const swatchesHtml = eff.particleColors.slice(0, 4).map(c => 
                `<span class="skin-dot" style="background: ${c}; box-shadow: 0 0 6px ${c}88;"></span>`
            ).join('');

            card.innerHTML = `
                <div class="skin-card-header">
                    <div class="skin-preview-chip" style="background: #111827; border: 1.5px solid rgba(255,255,255,0.15);">
                        <span style="font-size: 16px;">${shapeIcon}</span>
                    </div>
                    <div class="skin-card-info">
                        <div class="skin-card-name">${eff.name}</div>
                        <div class="skin-card-desc">${eff.desc}</div>
                    </div>
                </div>
                <div class="skin-card-footer">
                    <div class="skin-swatches-row">
                        ${swatchesHtml}
                    </div>
                    <button class="btn-skin-action ${isEquipped ? 'equipped' : ''}">
                        ${isEquipped ? 'EQUIPPED' : 'SELECT'}
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                this.audio.playPop();
                this.selectEffectSkin(eff.id);
            });

            this.dom.gridSkinEffect.appendChild(card);
        });
    }

    selectBackgroundSkin(bgId, save = true) {
        const bg = SkinManager.getBackground(bgId);
        if (!bg) return;

        if (save) SkinManager.saveConfig('bg', bg.id);
        this.renderer.applyBackgroundSkin(bg);

        // Update solid background CSS variables and body background
        document.documentElement.style.setProperty('--bg-color', bg.bg);
        document.documentElement.style.setProperty('--card-bg', bg.boardBg);
        document.documentElement.style.setProperty('--score-color', bg.scoreColor || '#A3E635');
        document.documentElement.style.setProperty('--diamond-color', bg.diamondColor || '#F59E0B');
        document.body.style.backgroundColor = bg.bg;

        this.renderBackgroundTab();
        this.updateSkinsSummary();
    }

    selectPuzzleSkin(puzzleId, save = true) {
        const puzzle = SkinManager.getPuzzle(puzzleId);
        if (!puzzle) return;

        if (save) SkinManager.saveConfig('puzzle', puzzle.id);
        this.gameState.applyPuzzleSkin(puzzle);

        // Update home screen display swatches
        if (this.dom.homeActiveSwatch) {
            const dots = this.dom.homeActiveSwatch.querySelectorAll('.swatch-dot');
            if (dots.length >= 3 && puzzle.palette.length >= 3) {
                dots[0].style.backgroundColor = puzzle.palette[0].hex;
                dots[1].style.backgroundColor = puzzle.palette[1].hex;
                dots[2].style.backgroundColor = puzzle.palette[2].hex;
            }
        }

        this.renderPuzzleTab();
        this.updateSkinsSummary();
    }

    selectEffectSkin(effectId, save = true) {
        const effect = SkinManager.getEffect(effectId);
        if (!effect) return;

        if (save) SkinManager.saveConfig('effect', effect.id);
        this.particles.setSkinEffects(effect);

        this.renderEffectTab();
        this.updateSkinsSummary();
    }

    updateSkinsSummary() {
        const config = SkinManager.loadConfig();
        const bg = SkinManager.getBackground(config.bg);
        const puzzle = SkinManager.getPuzzle(config.puzzle);
        const effect = SkinManager.getEffect(config.effect);

        if (this.dom.summaryBgName) this.dom.summaryBgName.textContent = bg.name;
        if (this.dom.summaryPuzzleName) this.dom.summaryPuzzleName.textContent = puzzle.name;
        if (this.dom.summaryEffectName) this.dom.summaryEffectName.textContent = effect.name;
        if (this.dom.homeActiveSkinName) this.dom.homeActiveSkinName.textContent = `${bg.name} + ${puzzle.name}`;
    }

    openSkinsModal() {
        this.renderSkinsGallery();
        if (this.dom.skinsModal) {
            this.dom.skinsModal.style.display = 'flex';
            this.dom.skinsModal.classList.add('active');
        }
    }

    closeSkinsModal() {
        if (this.dom.skinsModal) {
            this.dom.skinsModal.classList.remove('active');
            this.dom.skinsModal.style.display = 'none';
        }
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
        if (this.dom.wingHighScore) this.dom.wingHighScore.textContent = this.gameState.highestScore.toLocaleString();
        if (this.dom.wingMaxCombo) this.dom.wingMaxCombo.textContent = this.gameState.stats?.maxComboStreak || this.gameState.comboCount || 0;
        if (this.dom.comboCurrent) this.dom.comboCurrent.textContent = this.gameState.comboCount;
        if (this.dom.comboFlame) {
            this.dom.comboFlame.style.display = this.gameState.comboCount >= 2 ? 'inline' : 'none';
        }
    }

    updateComboFeed() {
        if (!this.dom.comboFeed) return;
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
