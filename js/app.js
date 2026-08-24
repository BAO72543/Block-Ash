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
import { SkinManager, BACKGROUND_SKINS, PUZZLE_SKINS, EFFECT_SKINS } from './skins.js';

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
            hudClassicBest: document.getElementById('hud-classic-best'),
            hudModeLeft: document.getElementById('hud-mode-left'),
            modeStageBadge: document.getElementById('mode-stage-badge'),
            modeGoalPill: document.getElementById('mode-goal-pill'),
            modeGoalSvg: document.getElementById('mode-goal-svg'),
            modeGoalText: document.getElementById('mode-goal-text'),
            modeMovesCapsule: document.getElementById('mode-moves-capsule'),
            modeMovesSvg: document.getElementById('mode-moves-svg'),
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
            aiSpeedContainer: document.getElementById('ai-speed-container'),
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
            skinsView: document.getElementById('skins-view'),
            btnSkinsReturnHome: document.getElementById('btn-skins-return-home'),
            stageSampleBoardCard: document.getElementById('stage-sample-board-card'),
            stageSampleCanvas: document.getElementById('stage-sample-canvas'),
            stageDockPreview: document.getElementById('stage-dock-preview'),
            previewDockBlocks: document.getElementById('preview-dock-blocks'),
            loadoutPuzzleIconWrap: document.getElementById('loadout-puzzle-icon-wrap'),
            loadoutBgIconWrap: document.getElementById('loadout-bg-icon-wrap'),
            loadoutEffectIconWrap: document.getElementById('loadout-effect-icon-wrap'),
            loadoutPuzzleName: document.getElementById('loadout-puzzle-name'),
            loadoutBgName: document.getElementById('loadout-bg-name'),
            loadoutEffectName: document.getElementById('loadout-effect-name'),
            catTabPuzzle: document.getElementById('cat-tab-puzzle'),
            catTabBg: document.getElementById('cat-tab-bg'),
            catTabEffect: document.getElementById('cat-tab-effect'),
            panelCatPuzzle: document.getElementById('panel-category-puzzle'),
            panelCatBg: document.getElementById('panel-category-bg'),
            panelCatEffect: document.getElementById('panel-category-effect'),
            gridCatPuzzle: document.getElementById('grid-category-puzzle'),
            gridCatBg: document.getElementById('grid-category-bg'),
            gridCatEffect: document.getElementById('grid-category-effect')
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
        this.displayedScore = 0;
        this.lastScore = 0;
        this.scoreTickTimer = 0;
        this.celebratedNewBest = false;

        this.particles.setCellTriggerCallback((stepIdx, combo) => {
            this.audio.playSequentialCellPop(stepIdx, combo);
        });

        // Theme Studio sample board particle system & canvas state
        this.studioParticles = new ParticleSystem();
        this.studioCanvas = document.getElementById('stage-sample-canvas');
        this.studioCtx = this.studioCanvas ? this.studioCanvas.getContext('2d') : null;
        this.studioBoardMetrics = { x: 8, y: 8, size: 208, cellSize: 45, gap: 5, outerPadding: 8 };
        this.studioGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
        this.studioSweepTimer = null;

        this.studioParticles.setCellTriggerCallback((stepIdx, combo) => {
            this.audio.playSequentialCellPop(stepIdx, combo);
        });

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAudioButtonState();
        this.initSkinsGallery();
        this.showHomeScreen();

        // Handle comprehensive responsive resizing across all devices, ratios and fullscreen modes
        this.handleResize();
        ['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach(evt => {
            window.addEventListener(evt, () => {
                this.handleResize();
                setTimeout(() => this.handleResize(), 50);
                setTimeout(() => this.handleResize(), 200);
            });
        });

        // ResizeObserver directly on stage container & wrapper for zero-lag responsive adaptation
        if (typeof window !== 'undefined' && window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                requestAnimationFrame(() => this.handleResize());
            });
            if (this.dom.stageContainer) ro.observe(this.dom.stageContainer);
            if (this.dom.appWrapper) ro.observe(this.dom.appWrapper);
        }

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
        if (this.dom.gameplayView) this.dom.gameplayView.style.display = 'flex';

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

        // Skins & Theme Studio Handlers (Accessible from Main Menu)
        if (this.dom.homeBtnSkins) {
            this.dom.homeBtnSkins.addEventListener('click', () => {
                this.openSkinsStudio();
            });
        }
        if (this.dom.btnSkinsReturnHome) {
            this.dom.btnSkinsReturnHome.addEventListener('click', () => {
                this.closeSkinsStudio();
            });
        }
        if (this.dom.catTabPuzzle) {
            this.dom.catTabPuzzle.addEventListener('click', () => this.switchStudioCategory('puzzle'));
        }
        if (this.dom.catTabBg) {
            this.dom.catTabBg.addEventListener('click', () => this.switchStudioCategory('bg'));
        }
        if (this.dom.catTabEffect) {
            this.dom.catTabEffect.addEventListener('click', () => this.switchStudioCategory('effect'));
        }
        if (this.dom.stageDockPreview) {
            this.dom.stageDockPreview.addEventListener('click', () => {
                this.testStudioEffect();
            });
        }
        if (this.dom.stageSampleBoardCard) {
            this.dom.stageSampleBoardCard.addEventListener('click', () => {
                this.testStudioEffect();
            });
        }
        if (this.dom.stageSampleCanvas) {
            this.dom.stageSampleCanvas.addEventListener('click', () => {
                this.testStudioEffect();
            });
        }

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

        // Close modals on clicking outside backdrop
        window.addEventListener('click', (e) => {
            if (e.target === this.dom.statsModal) {
                this.closeStatsModal();
            }
            if (e.target === this.dom.adventureMapModal) {
                this.closeAdventureMap();
            }
        });
    }

    handleResize() {
        if (!this.canvas) return;
        const container = this.canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const w = Math.round((rect && rect.width > 50) ? rect.width : (container.clientWidth > 50 ? container.clientWidth : 420));
        const h = Math.round((rect && rect.height > 50) ? rect.height : (container.clientHeight > 50 ? container.clientHeight : 540));
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

        // 2. Visual Effects: Sweeping Laser Waves, Domino Ripples & Cross-Intersections
        const { cellSize, gap } = this.renderer.boardMetrics;
        const shapeColor = result.shapePlaced.color;

        for (const r of result.rowsCleared) {
            const rowCells = result.clearedRowData ? result.clearedRowData[r] : null;
            this.particles.addLineClearSweep('row', r, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap, shapeColor, result.comboCount, rowCells);
        }
        for (const c of result.colsCleared) {
            const colCells = result.clearedColData ? result.clearedColData[c] : null;
            this.particles.addLineClearSweep('col', c, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap, shapeColor, result.comboCount, colCells);
        }

        // Multi-line cross intersections
        if (result.rowsCleared.length > 0 && result.colsCleared.length > 0) {
            this.particles.addCrossIntersections(result.rowsCleared, result.colsCleared, this.renderer.boardMetrics.x, this.renderer.boardMetrics.y, cellSize, gap, result.comboCount);
        }

        // If no line clear occurred, burst gentle snap particles at placed cells
        if (result.linesCleared === 0) {
            for (const placed of result.placedCells) {
                const rect = this.renderer.getCellRect(placed.row, placed.col);
                this.particles.addBlockClearBurst(rect.x, rect.y, rect.size * 0.7, shapeColor);
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
                this.particles.addCollectiblePickupBurst(rect.x, rect.y, rect.size, it.item);

                if (it.item === 'puzzle') {
                    this.particles.addFloatingText('+1 PUZZLE PIECE!', rect.x + cellSize / 2, rect.y + cellSize / 2, {
                        isGold: false,
                        fontSize: 26,
                        color: '#F0ABFC',
                        shadow: '#581C87'
                    });
                } else if (it.item === 'star') {
                    this.particles.addFloatingText('+1 GOLDEN STAR!', rect.x + cellSize / 2, rect.y + cellSize / 2, {
                        isGold: true,
                        fontSize: 28,
                        color: '#FDE047',
                        shadow: '#78350F'
                    });
                } else {
                    this.particles.addFloatingText('+1 GEM!', rect.x + cellSize / 2, rect.y + cellSize / 2, {
                        isGold: false,
                        fontSize: 26,
                        color: '#38BDF8',
                        shadow: '#0369A1'
                    });
                }
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

        // Upward arcing golden sparks towards top score zone ONLY on line clear / combo
        if (result.linesCleared >= 1 || result.comboCount >= 1) {
            if (result.scoreGained > 0) {
                this.particles.addScoreAbsorptionSparks(centerX, centerY, Math.min(10, 4 + Math.floor(result.scoreGained / 30)));
            }
        }

        // High Score celebration
        if (result.isNewRecord && !this.celebratedNewRecord) {
            this.celebratedNewRecord = true;
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 70);
        }

        // Update UI Displays (only scale when in combo or clear 1+ row)
        this.updateScoreDisplays(result.scoreGained, result.comboCount, result.linesCleared);
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
        // Show/Hide AI controls based on game mode:
        // AI option is completely disabled & removed in Adventure and Drop Mode
        const isAiSupportedMode = (this.gameState.mode === GAME_MODES.CLASSIC);
        if (this.dom.btnHint) this.dom.btnHint.style.display = isAiSupportedMode ? 'flex' : 'none';
        if (this.dom.btnAutoplay) this.dom.btnAutoplay.style.display = isAiSupportedMode ? 'flex' : 'none';
        if (this.dom.aiSpeedContainer) this.dom.aiSpeedContainer.style.display = isAiSupportedMode ? 'block' : 'none';

        if (!isAiSupportedMode) {
            if (this.isAutoplayActive) this.stopAutoplay();
            this.renderer.aiHint = null;
        }

        if (this.gameState.mode === GAME_MODES.ADVENTURE) {
            if (this.dom.hudClassicBest) this.dom.hudClassicBest.style.display = 'none';
            if (this.dom.hudModeLeft) this.dom.hudModeLeft.style.display = 'flex';
            if (this.dom.modeMovesCapsule) this.dom.modeMovesCapsule.style.display = 'flex';
            if (this.dom.modeGoalPill) this.dom.modeGoalPill.style.display = 'flex';

            if (this.dom.modeStageBadge) {
                this.dom.modeStageBadge.textContent = `Stage ${this.gameState.stageId}`;
                this.dom.modeStageBadge.className = 'topbar-stage-badge badge-adventure';
            }
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'flex';

            const g = this.gameState.stageGoals;
            const goalType = (g && g.type) ? g.type.toLowerCase() : 'gems';
            const collected = g ? g.collected : 0;
            const target = (g && g.target) ? g.target : 4;

            if (this.dom.modeGoalText) {
                this.dom.modeGoalText.textContent = `${collected}/${target}`;
            }
            if (this.dom.modeGoalSvg) {
                if (goalType === 'puzzles' || goalType === 'puzzle') {
                    this.dom.modeGoalSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#C084FC" stroke-width="1.8"><path d="M4 4h4v2a2 2 0 0 0 4 0V4h4v4h-2a2 2 0 0 0 0 4h2v4h-4v-2a2 2 0 0 0-4 0v2H4v-4h2a2 2 0 0 0 0-4H4V4z" fill="#C084FC" fill-opacity="0.3"></path></svg>';
                } else if (goalType === 'stars' || goalType === 'star') {
                    this.dom.modeGoalSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="#FBBF24" stroke="#F59E0B" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>';
                } else {
                    this.dom.modeGoalSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#34D399" stroke-width="1.8"><polygon points="6 3 18 3 22 9 12 21 2 9 6 3" fill="#34D399" fill-opacity="0.35"></polygon><line x1="2" y1="9" x2="22" y2="9"></line><polyline points="10 3 7 9 12 21 17 9 14 3"></polyline></svg>';
                }
            }

            const moves = this.gameState.movesRemaining;
            if (this.dom.modeMovesText) this.dom.modeMovesText.textContent = `${moves}`;
            if (this.dom.modeMovesCapsule) {
                this.dom.modeMovesCapsule.className = `topbar-moves-pill ${moves <= 3 ? 'state-danger' : moves <= 5 ? 'state-warning' : 'state-normal'}`;
            }
            if (this.dom.modeMovesSvg) {
                this.dom.modeMovesSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
            }

        } else if (this.gameState.mode === GAME_MODES.DROP) {
            if (this.dom.hudClassicBest) this.dom.hudClassicBest.style.display = 'none';
            if (this.dom.hudModeLeft) this.dom.hudModeLeft.style.display = 'flex';
            if (this.dom.modeMovesCapsule) this.dom.modeMovesCapsule.style.display = 'flex';
            if (this.dom.modeGoalPill) this.dom.modeGoalPill.style.display = 'none';
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'none';

            if (this.dom.modeStageBadge) {
                this.dom.modeStageBadge.textContent = '🔥 DROP';
                this.dom.modeStageBadge.className = 'topbar-stage-badge badge-drop';
            }

            const dropIn = this.gameState.movesUntilDrop;
            if (this.dom.modeMovesText) this.dom.modeMovesText.textContent = `${dropIn}`;
            if (this.dom.modeMovesCapsule) {
                this.dom.modeMovesCapsule.className = `topbar-moves-pill ${dropIn === 1 ? 'state-danger' : dropIn === 2 ? 'state-warning' : 'state-normal'}`;
            }
            if (this.dom.modeMovesSvg) {
                this.dom.modeMovesSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" fill-opacity="0.3"></polygon></svg>';
            }

        } else if (this.gameState.mode === GAME_MODES.DAILY) {
            if (this.dom.hudClassicBest) this.dom.hudClassicBest.style.display = 'none';
            if (this.dom.hudModeLeft) this.dom.hudModeLeft.style.display = 'flex';
            if (this.dom.modeMovesCapsule) this.dom.modeMovesCapsule.style.display = 'flex';
            if (this.dom.modeGoalPill) this.dom.modeGoalPill.style.display = 'flex';
            if (this.dom.btnOpenStageMap) this.dom.btnOpenStageMap.style.display = 'none';

            if (this.dom.modeStageBadge) {
                this.dom.modeStageBadge.textContent = '⭐ DAILY';
                this.dom.modeStageBadge.className = 'topbar-stage-badge badge-daily';
            }

            const g = this.gameState.stageGoals;
            const collected = g ? g.collected : 0;
            const target = (g && g.target) ? g.target : 4;

            if (this.dom.modeGoalText) this.dom.modeGoalText.textContent = `${collected}/${target}`;
            if (this.dom.modeGoalSvg) {
                this.dom.modeGoalSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FBBF24" stroke-width="1.8"><polygon points="6 3 18 3 22 9 12 21 2 9 6 3" fill="#FBBF24" fill-opacity="0.35"></polygon><line x1="2" y1="9" x2="22" y2="9"></line><polyline points="10 3 7 9 12 21 17 9 14 3"></polyline></svg>';
            }

            const moves = this.gameState.movesRemaining;
            if (this.dom.modeMovesText) this.dom.modeMovesText.textContent = `${moves}`;
            if (this.dom.modeMovesCapsule) {
                this.dom.modeMovesCapsule.className = `topbar-moves-pill ${moves <= 3 ? 'state-danger' : moves <= 5 ? 'state-warning' : 'state-normal'}`;
            }
            if (this.dom.modeMovesSvg) {
                this.dom.modeMovesSvg.innerHTML = '<svg class="ui-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
            }

        } else {
            if (this.dom.hudClassicBest) this.dom.hudClassicBest.style.display = 'flex';
            if (this.dom.hudModeLeft) this.dom.hudModeLeft.style.display = 'none';
            if (this.dom.modeMovesCapsule) this.dom.modeMovesCapsule.style.display = 'none';
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
                : (isUnlocked ? '☆☆☆' : 'Locked');

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
                this.dom.btnModalRevive.innerHTML = '<span>Revive Used (1/session limit)</span>';
            } else {
                this.dom.btnModalRevive.disabled = false;
                this.dom.btnModalRevive.innerHTML = '<span>Watch Ad to Revive (Clear 4×4 Center)</span>';
            }
        }

        if (isNewRecord) {
            this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 80);
        }

        if (this.dom.gameOverModal) {
            this.dom.gameOverModal.style.display = 'flex';
            this.dom.gameOverModal.classList.add('active');
        }
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
                this.dom.rewardedTimerText.textContent = 'Video Complete! Reward Ready.';
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
            this.particles.addLineClearSweep('row', r, bx, by, cellSize, gap, { hex: '#38BDF8', light: '#BAE6FD' }, 0);
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
        if (this.dom.gameOverModal) {
            this.dom.gameOverModal.classList.remove('active');
            this.dom.gameOverModal.style.display = 'none';
        }
        if (this.dom.rewardedAdModal) this.dom.rewardedAdModal.style.display = 'none';
        if (this.dom.interstitialAdModal) this.dom.interstitialAdModal.style.display = 'none';

        this.updateScoreDisplays();
        this.updateComboFeed();
        this.updateModeStatusBar();

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
        const soundOnSvg = `
            <svg class="ui-icon icon-vol-sound" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.25"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
        `;
        const soundOffSvg = `
            <svg class="ui-icon icon-vol-sound icon-muted" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fill-opacity="0.25"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
        `;

        if (this.audio.isMuted) {
            if (this.dom.btnSound) {
                this.dom.btnSound.innerHTML = `${soundOffSvg}<span class="btn-text">Muted</span>`;
                this.dom.btnSound.classList.add('muted');
            }
            if (this.dom.homeBtnSound) {
                this.dom.homeBtnSound.innerHTML = soundOffSvg;
                this.dom.homeBtnSound.classList.add('muted');
                this.dom.homeBtnSound.title = 'Unmute Sound';
            }
        } else {
            if (this.dom.btnSound) {
                this.dom.btnSound.innerHTML = `${soundOnSvg}<span class="btn-text">Sound</span>`;
                this.dom.btnSound.classList.remove('muted');
            }
            if (this.dom.homeBtnSound) {
                this.dom.homeBtnSound.innerHTML = soundOnSvg;
                this.dom.homeBtnSound.classList.remove('muted');
                this.dom.homeBtnSound.title = 'Mute Sound';
            }
        }
    }

    toggleHint() {
        if (this.gameState.gameOver) return;
        // AI option is disabled in Adventure and Drop Mode
        if (this.gameState.mode !== GAME_MODES.CLASSIC) return;

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
        // AI option is disabled in Adventure and Drop Mode
        if (this.gameState.mode !== GAME_MODES.CLASSIC) {
            this.stopAutoplay();
            return;
        }

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
        this.dom.btnAutoplay.innerHTML = `
            <svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
                <rect x="6" y="6" width="12" height="12" rx="2"></rect>
            </svg>
            <span class="btn-text">Stop AI</span>
        `;
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
        this.dom.btnAutoplay.innerHTML = `
            <svg class="ui-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="3"></rect>
                <circle cx="9" cy="10" r="1.5" fill="currentColor"></circle>
                <circle cx="15" cy="10" r="1.5" fill="currentColor"></circle>
                <path d="M9 15h6"></path>
            </svg>
            <span class="btn-text">AI Play</span>
        `;
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
        const puzzle = SkinManager.getPuzzle(config.puzzle);
        const effect = SkinManager.getEffect(config.effect);

        this.initStudioGrid(puzzle);
        if (this.studioParticles) {
            this.studioParticles.setSkinEffects(effect);
        }

        this.selectBackgroundSkin(config.bg, false);
        this.selectPuzzleSkin(config.puzzle, false);
        this.selectEffectSkin(config.effect, false);
        this.renderSkinsStudio();
    }

    openSkinsStudio() {
        this.audio.playPop();
        this.triggerHaptic('snap');
        if (this.dom.homeScreen) this.dom.homeScreen.style.display = 'none';
        if (this.dom.gameplayView) this.dom.gameplayView.style.display = 'none';
        if (this.dom.skinsView) this.dom.skinsView.style.display = 'flex';
        if (this.dom.appWrapper) this.dom.appWrapper.classList.add('in-skins');

        this.renderSkinsStudio();
        this.switchStudioCategory('puzzle');
    }

    closeSkinsStudio() {
        this.audio.playPop();
        this.triggerHaptic('snap');
        if (this.dom.skinsView) this.dom.skinsView.style.display = 'none';
        if (this.dom.homeScreen) this.dom.homeScreen.style.display = 'flex';
        if (this.dom.appWrapper) this.dom.appWrapper.classList.remove('in-skins');

        this.updateSkinsSummary();
    }

    switchStudioCategory(catKey) {
        this.audio.playHover();
        const categories = [
            { key: 'puzzle', tab: this.dom.catTabPuzzle, panel: this.dom.panelCatPuzzle },
            { key: 'bg', tab: this.dom.catTabBg, panel: this.dom.panelCatBg },
            { key: 'effect', tab: this.dom.catTabEffect, panel: this.dom.panelCatEffect }
        ];

        categories.forEach(c => {
            const isActive = c.key === catKey;
            if (c.tab) c.tab.classList.toggle('active', isActive);
            if (c.panel) {
                c.panel.style.display = isActive ? 'block' : 'none';
                c.panel.classList.toggle('active', isActive);
            }
        });
    }

    renderSkinsStudio() {
        this.renderStudioPreview();
        this.renderPuzzleCards();
        this.renderBackgroundCards();
        this.renderEffectCards();
        this.updateSkinsSummary();
    }

    initStudioGrid(puzzle) {
        const pal = (puzzle && puzzle.palette && puzzle.palette.length > 0)
            ? puzzle.palette
            : [{ hex: '#F59E0B', light: '#FEF08A', dark: '#D97706' }];

        this.studioGrid = [
            [0, pal[0 % pal.length], pal[1 % pal.length], 0],
            [pal[2 % pal.length] || pal[0], pal[3 % pal.length] || pal[1], pal[0 % pal.length], pal[1 % pal.length]], // Full 4-block clearing line
            [pal[4 % pal.length] || pal[0], pal[1 % pal.length], 0, pal[2 % pal.length] || pal[0]],
            [0, pal[3 % pal.length] || pal[1], pal[4 % pal.length] || pal[2], 0]
        ];
    }

    renderStudioPreview(animatePop = false) {
        const config = SkinManager.loadConfig();
        const puzzle = SkinManager.getPuzzle(config.puzzle);
        const effect = SkinManager.getEffect(config.effect);

        this.updateSkinsSummary();
        this.initStudioGrid(puzzle);
        if (this.studioParticles) {
            this.studioParticles.setSkinEffects(effect);
        }

        // Render Test Dock Sample Piece
        if (this.dom.previewDockBlocks) {
            this.dom.previewDockBlocks.innerHTML = '';
            const samplePieceCols = [puzzle.palette[0], puzzle.palette[1], puzzle.palette[2]];
            samplePieceCols.forEach(c => {
                if (!c) return;
                const b = document.createElement('div');
                b.className = 'dock-sample-block';
                b.style.background = `linear-gradient(135deg, ${c.light} 0%, ${c.hex} 55%, ${c.dark} 100%)`;
                b.style.boxShadow = `inset 1px 1px 0 rgba(255,255,255,0.6), inset -1px -1px 0 rgba(0,0,0,0.35), 0 3px 6px rgba(0,0,0,0.4)`;
                this.dom.previewDockBlocks.appendChild(b);
            });
        }
    }

    testStudioEffect() {
        if (this.studioSweepTimer) {
            clearTimeout(this.studioSweepTimer);
        }

        const config = SkinManager.loadConfig();
        const puzzle = SkinManager.getPuzzle(config.puzzle);
        const effect = SkinManager.getEffect(config.effect);

        // 1. Audio and Haptic feedback
        this.audio.playClear(2);
        this.triggerHaptic('snap');

        // 2. Pulse test dock button & emit sparks around it
        if (this.dom.stageDockPreview) {
            this.spawnStudioSparkleBurst(this.dom.stageDockPreview, effect);
            this.dom.stageDockPreview.classList.remove('pulse-test');
            void this.dom.stageDockPreview.offsetWidth;
            this.dom.stageDockPreview.classList.add('pulse-test');
        }

        // 3. Reset studio particles & apply effect
        if (this.studioParticles) {
            this.studioParticles.reset();
            this.studioParticles.setSkinEffects(effect);
        }

        // 4. Ensure studio grid has blocks
        this.initStudioGrid(puzzle);

        // 5. Capture snapshot of Row 1 and clear from base grid
        const row1Snapshot = this.studioGrid[1].map(col => col ? { color: col } : { color: puzzle.palette[0] });
        this.studioGrid[1] = [0, 0, 0, 0];

        // 6. Launch sweeping rolling star laser beam across Row 1 scaled for 4x4 sample board!
        const m = this.studioBoardMetrics;
        const gridX = m.x + m.outerPadding;
        const gridY = m.y + m.outerPadding;

        if (this.studioParticles) {
            this.studioParticles.addLineClearSweep(
                'row',
                1,
                gridX,
                gridY,
                m.cellSize,
                m.gap,
                row1Snapshot[0]?.color,
                2,
                row1Snapshot,
                4
            );

            // 7. Floating celebratory score banner
            const centerX = m.x + m.size / 2;
            const centerY = m.y + m.size / 2;
            this.studioParticles.addFloatingText('+120 ✨', centerX, centerY - 10, {
                isGold: true,
                fontSize: 26,
                color: effect.floatingTextColor || '#FDE047'
            });
        }

        // 8. Instant spring reset of Row 1 blocks after sweep finishes
        this.studioSweepTimer = setTimeout(() => {
            this.initStudioGrid(puzzle);
        }, 440);
    }

    renderStudioCanvas(dt) {
        if (!this.studioCanvas) {
            this.studioCanvas = document.getElementById('stage-sample-canvas');
            if (this.studioCanvas) {
                this.studioCtx = this.studioCanvas.getContext('2d');
            }
        }
        if (!this.studioCtx || !this.studioCanvas) return;

        const ctx = this.studioCtx;
        const config = SkinManager.loadConfig();
        const bg = SkinManager.getBackground(config.bg);

        const dpr = window.devicePixelRatio || 1;
        const displayW = 224;
        const displayH = 224;

        if (this.studioCanvas.width !== Math.round(displayW * dpr) || this.studioCanvas.height !== Math.round(displayH * dpr)) {
            this.studioCanvas.width = Math.round(displayW * dpr);
            this.studioCanvas.height = Math.round(displayH * dpr);
        }

        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, displayW, displayH);

        const m = this.studioBoardMetrics;
        const x = m.x;
        const y = m.y;
        const size = m.size;
        const cellSize = m.cellSize;
        const gap = m.gap;
        const outerPadding = m.outerPadding;

        // 1. Draw 4x4 Board Background Card
        ctx.save();
        ctx.fillStyle = bg.boardBg;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 4;
        this.renderer.roundRect(x, y, size, size, 16, ctx);
        ctx.fill();
        ctx.restore();

        // 2. Draw Empty Grid Cell Slots
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cx = x + outerPadding + c * (cellSize + gap);
                const cy = y + outerPadding + r * (cellSize + gap);
                ctx.save();
                ctx.fillStyle = bg.cellEmpty;
                this.renderer.roundRect(cx, cy, cellSize, cellSize, Math.max(3, Math.round(cellSize * 0.14)), ctx);
                ctx.fill();
                ctx.restore();
            }
        }

        // 3. Draw Filled Grid Blocks
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const cellColor = this.studioGrid[r] ? this.studioGrid[r][c] : null;
                if (cellColor) {
                    const cx = x + outerPadding + c * (cellSize + gap);
                    const cy = y + outerPadding + r * (cellSize + gap);
                    this.renderer.drawBeveledBlock(cx, cy, cellSize, cellColor, false, null, ctx);
                }
            }
        }

        // 4. Render Studio Particles & Sweeper Animation on Top!
        if (this.studioParticles) {
            this.studioParticles.render(ctx);
        }

        ctx.restore();
    }

    spawnStudioSparkleBurst(container, effect) {
        if (!container) return;
        const colors = effect.particleColors || ['#FDE047', '#F59E0B', '#FFFFFF'];
        const count = 14;

        for (let i = 0; i < count; i++) {
            const spark = document.createElement('div');
            spark.className = 'studio-sparkle';
            const color = colors[i % colors.length];
            const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const dist = 35 + Math.random() * 45;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist;
            const size = 6 + Math.random() * 8;

            spark.style.setProperty('--tx', `${tx}px`);
            spark.style.setProperty('--ty', `${ty}px`);
            spark.style.backgroundColor = color;
            spark.style.boxShadow = `0 0 10px ${color}`;
            spark.style.width = `${size}px`;
            spark.style.height = `${size}px`;
            if (effect.particleShape === 'circle') {
                spark.style.borderRadius = '50%';
            } else if (effect.particleShape === 'diamond') {
                spark.style.transform = 'rotate(45deg)';
            } else if (effect.particleShape === 'star') {
                spark.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            } else {
                spark.style.borderRadius = '2px';
            }

            container.appendChild(spark);
            setTimeout(() => {
                if (spark.parentElement) spark.remove();
            }, 600);
        }
    }

    renderPuzzleCards() {
        if (!this.dom.gridCatPuzzle) return;
        const config = SkinManager.loadConfig();
        const puzzles = SkinManager.getAllPuzzles();

        this.dom.gridCatPuzzle.innerHTML = '';
        puzzles.forEach(p => {
            const isEquipped = p.id === config.puzzle;
            const isUnlocked = SkinManager.isUnlocked('puzzle', p.id);
            const card = document.createElement('div');
            card.className = `modern-skin-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;

            const swatchesHtml = p.palette.slice(0, 5).map(c =>
                `<span class="skin-dot" style="background: ${c.hex}; box-shadow: 0 0 6px ${c.hex}88;"></span>`
            ).join('');

            const rarityClass = `rarity-${p.rarity.toLowerCase()}`;

            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equipped"><span class="check-icon">✓</span> EQUIPPED</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equip">EQUIP</button>`;
            } else {
                buttonHtml = `
                    <button type="button" class="btn-skin-action btn-skin-unlock">
                        <svg class="ui-icon icon-ad-film" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="3"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                        </svg>
                        <span>UNLOCK (AD)</span>
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="skin-card-top">
                    <div class="skin-mini-shape-wrap">
                        <div class="skin-preview-block" style="background: linear-gradient(135deg, ${p.palette[0].light} 0%, ${p.palette[0].hex} 60%, ${p.palette[0].dark} 100%);"></div>
                    </div>
                    <div class="skin-meta">
                        <div class="skin-title-row">
                            <span class="skin-card-name">${p.name}</span>
                            <span class="skin-rarity-badge ${rarityClass}">${p.rarity}</span>
                        </div>
                        <p class="skin-card-desc">${p.desc}</p>
                    </div>
                </div>
                <div class="skin-card-bot">
                    <div class="skin-swatches-cluster">${swatchesHtml}</div>
                    <div class="skin-action-wrap">${buttonHtml}</div>
                </div>
            `;

            const triggerAction = (e) => {
                if (e) e.stopPropagation();
                if (!isUnlocked) {
                    this.handleSkinUnlock('puzzle', p.id, p.name);
                } else {
                    this.audio.playPop();
                    this.selectPuzzleSkin(p.id);
                }
            };

            const actionBtn = card.querySelector('.btn-skin-action');
            if (actionBtn) actionBtn.addEventListener('click', triggerAction);
            card.addEventListener('click', triggerAction);

            this.dom.gridCatPuzzle.appendChild(card);
        });
    }

    renderBackgroundCards() {
        if (!this.dom.gridCatBg) return;
        const config = SkinManager.loadConfig();
        const backgrounds = SkinManager.getAllBackgrounds();

        this.dom.gridCatBg.innerHTML = '';
        backgrounds.forEach(bg => {
            const isEquipped = bg.id === config.bg;
            const isUnlocked = SkinManager.isUnlocked('bg', bg.id);
            const card = document.createElement('div');
            card.className = `modern-skin-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;

            const rarityClass = `rarity-${bg.rarity.toLowerCase()}`;

            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equipped"><span class="check-icon">✓</span> EQUIPPED</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equip">EQUIP</button>`;
            } else {
                buttonHtml = `
                    <button type="button" class="btn-skin-action btn-skin-unlock">
                        <svg class="ui-icon icon-ad-film" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="3"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                        </svg>
                        <span>UNLOCK (AD)</span>
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="skin-card-top">
                    <div class="skin-mini-shape-wrap">
                        <div class="skin-preview-bg-tile" style="background: ${bg.bg}; border: 1.5px solid ${bg.dockBorder || 'rgba(255,255,255,0.2)'};">
                            <div class="skin-tile-inner" style="background: ${bg.boardBg};"></div>
                        </div>
                    </div>
                    <div class="skin-meta">
                        <div class="skin-title-row">
                            <span class="skin-card-name">${bg.name}</span>
                            <span class="skin-rarity-badge ${rarityClass}">${bg.rarity}</span>
                        </div>
                        <p class="skin-card-desc">${bg.desc}</p>
                    </div>
                </div>
                <div class="skin-card-bot">
                    <span class="skin-chip-tag" style="background: ${bg.bg.includes('gradient') ? (bg.solidFallback || '#1E293B') : bg.bg}; color: #FFFFFF;">${bg.bg.includes('gradient') ? 'SPECTRUM' : 'SOLID'}</span>
                    <div class="skin-action-wrap">${buttonHtml}</div>
                </div>
            `;

            const triggerAction = (e) => {
                if (e) e.stopPropagation();
                if (!isUnlocked) {
                    this.handleSkinUnlock('bg', bg.id, bg.name);
                } else {
                    this.audio.playPop();
                    this.selectBackgroundSkin(bg.id);
                }
            };

            const actionBtn = card.querySelector('.btn-skin-action');
            if (actionBtn) actionBtn.addEventListener('click', triggerAction);
            card.addEventListener('click', triggerAction);

            this.dom.gridCatBg.appendChild(card);
        });
    }

    renderEffectCards() {
        if (!this.dom.gridCatEffect) return;
        const config = SkinManager.loadConfig();
        const effects = SkinManager.getAllEffects();

        this.dom.gridCatEffect.innerHTML = '';
        effects.forEach(eff => {
            const isEquipped = eff.id === config.effect;
            const isUnlocked = SkinManager.isUnlocked('effect', eff.id);
            const card = document.createElement('div');
            card.className = `modern-skin-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;

            const shapeIcon = eff.particleShape === 'star' ?
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' :
                eff.particleShape === 'diamond' ?
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="#38BDF8" stroke="none"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg>' :
                eff.particleShape === 'circle' ?
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="#C084FC" stroke="none"><circle cx="12" cy="12" r="8"/></svg>' :
                '<svg viewBox="0 0 24 24" width="16" height="16" fill="#60A5FA" stroke="none"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>';

            const swatchesHtml = eff.particleColors.slice(0, 4).map(c =>
                `<span class="skin-dot" style="background: ${c}; box-shadow: 0 0 6px ${c}88;"></span>`
            ).join('');

            const rarityClass = `rarity-${eff.rarity.toLowerCase()}`;

            let buttonHtml = '';
            if (isEquipped) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equipped"><span class="check-icon">✓</span> EQUIPPED</button>`;
            } else if (isUnlocked) {
                buttonHtml = `<button type="button" class="btn-skin-action btn-skin-equip">EQUIP</button>`;
            } else {
                buttonHtml = `
                    <button type="button" class="btn-skin-action btn-skin-unlock">
                        <svg class="ui-icon icon-ad-film" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="2" width="20" height="20" rx="3"></rect>
                            <line x1="7" y1="2" x2="7" y2="22"></line>
                            <line x1="17" y1="2" x2="17" y2="22"></line>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                        </svg>
                        <span>UNLOCK (AD)</span>
                    </button>
                `;
            }

            card.innerHTML = `
                <div class="skin-card-top">
                    <div class="skin-mini-shape-wrap">
                        <div class="skin-preview-eff-tile" style="background: #111827; border: 1.5px solid rgba(255,255,255,0.2);">
                            <span style="font-size: 16px;">${shapeIcon}</span>
                        </div>
                    </div>
                    <div class="skin-meta">
                        <div class="skin-title-row">
                            <span class="skin-card-name">${eff.name}</span>
                            <span class="skin-rarity-badge ${rarityClass}">${eff.rarity}</span>
                        </div>
                        <p class="skin-card-desc">${eff.desc}</p>
                    </div>
                </div>
                <div class="skin-card-bot">
                    <div class="skin-swatches-cluster">${swatchesHtml}</div>
                    <div class="skin-action-wrap">${buttonHtml}</div>
                </div>
            `;

            const triggerAction = (e) => {
                if (e) e.stopPropagation();
                if (!isUnlocked) {
                    this.handleSkinUnlock('effect', eff.id, eff.name);
                } else {
                    this.audio.playPop();
                    this.selectEffectSkin(eff.id);
                }
            };

            const actionBtn = card.querySelector('.btn-skin-action');
            if (actionBtn) actionBtn.addEventListener('click', triggerAction);
            card.addEventListener('click', triggerAction);

            this.dom.gridCatEffect.appendChild(card);
        });
    }

    handleSkinUnlock(type, id, name) {
        this.audio.playLevelUp();
        this.triggerHaptic('snap');
        SkinManager.unlockSkin(type, id);

        // Automatically equip newly unlocked item
        if (type === 'puzzle') this.selectPuzzleSkin(id);
        else if (type === 'bg') this.selectBackgroundSkin(id);
        else if (type === 'effect') this.selectEffectSkin(id);

        this.showSkinToast(`✨ Unlocked ${name}!`);
        this.renderSkinsStudio();
    }

    showSkinToast(msg) {
        const toast = document.getElementById('skin-unlock-toast');
        const msgEl = document.getElementById('skin-toast-msg');
        if (!toast || !msgEl) return;

        msgEl.textContent = msg;
        toast.style.display = 'inline-flex';
        toast.classList.remove('toast-active');
        void toast.offsetWidth;
        toast.classList.add('toast-active');

        if (this.skinToastTimer) clearTimeout(this.skinToastTimer);
        this.skinToastTimer = setTimeout(() => {
            if (toast) {
                toast.classList.remove('toast-active');
                setTimeout(() => { toast.style.display = 'none'; }, 300);
            }
        }, 2200);
    }

    selectBackgroundSkin(bgId, save = true) {
        const bg = SkinManager.getBackground(bgId);
        if (!bg) return;

        if (save) SkinManager.saveConfig('bg', bg.id);
        this.renderer.applyBackgroundSkin(bg);

        // Update solid / gradient background CSS variables and body background
        document.documentElement.style.setProperty('--bg-color', bg.bg);
        document.documentElement.style.setProperty('--card-bg', bg.boardBg);
        document.documentElement.style.setProperty('--score-color', bg.scoreColor || '#A3E635');
        document.documentElement.style.setProperty('--diamond-color', bg.diamondColor || '#F59E0B');
        document.body.style.background = bg.bg;
        document.body.style.backgroundColor = bg.solidFallback || bg.bg;

        this.renderStudioPreview();
        this.renderBackgroundCards();
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

        this.renderStudioPreview();
        this.renderPuzzleCards();
        this.updateSkinsSummary();
    }

    selectEffectSkin(effectId, save = true) {
        const effect = SkinManager.getEffect(effectId);
        if (!effect) return;

        if (save) SkinManager.saveConfig('effect', effect.id);
        this.particles.setSkinEffects(effect);
        if (this.studioParticles) {
            this.studioParticles.setSkinEffects(effect);
        }

        this.renderStudioPreview();
        this.renderEffectCards();
        this.updateSkinsSummary();

        // Auto-play the test effect when selecting an effect card
        if (this.dom.skinsView && this.dom.skinsView.style.display !== 'none') {
            this.testStudioEffect();
        }
    }

    updateSkinsSummary() {
        const config = SkinManager.loadConfig();
        const bg = SkinManager.getBackground(config.bg);
        const puzzle = SkinManager.getPuzzle(config.puzzle);
        const effect = SkinManager.getEffect(config.effect);

        if (this.dom.loadoutBgName) this.dom.loadoutBgName.textContent = bg.name;
        if (this.dom.loadoutPuzzleName) this.dom.loadoutPuzzleName.textContent = puzzle.name;
        if (this.dom.loadoutEffectName) this.dom.loadoutEffectName.textContent = effect.name;
        if (this.dom.homeActiveSkinName) this.dom.homeActiveSkinName.textContent = `${bg.name} + ${puzzle.name}`;

        // Render true matching selection icons (NO EMOJIS)
        if (this.dom.loadoutPuzzleIconWrap && puzzle.palette && puzzle.palette.length > 0) {
            const p0 = puzzle.palette[0];
            this.dom.loadoutPuzzleIconWrap.innerHTML = `
                <span class="chip-puzzle-swatch" style="background: linear-gradient(135deg, ${p0.light} 0%, ${p0.hex} 60%, ${p0.dark} 100%);"></span>
            `;
        }

        if (this.dom.loadoutBgIconWrap) {
            this.dom.loadoutBgIconWrap.innerHTML = `
                <span class="chip-bg-swatch" style="background: ${bg.bg}; border: 1px solid ${bg.dockBorder || 'rgba(255,255,255,0.3)'};">
                    <span class="chip-bg-inner" style="background: ${bg.boardBg};"></span>
                </span>
            `;
        }

        if (this.dom.loadoutEffectIconWrap && effect.particleColors) {
            const pColor = effect.particleColors[0] || '#FDE047';
            const shapeIcon = effect.particleShape === 'star' ?
                `<svg viewBox="0 0 24 24" width="12" height="12" fill="${pColor}" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` :
                effect.particleShape === 'diamond' ?
                `<svg viewBox="0 0 24 24" width="12" height="12" fill="${pColor}" stroke="none"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg>` :
                effect.particleShape === 'circle' ?
                `<svg viewBox="0 0 24 24" width="12" height="12" fill="${pColor}" stroke="none"><circle cx="12" cy="12" r="8"/></svg>` :
                `<svg viewBox="0 0 24 24" width="12" height="12" fill="${pColor}" stroke="none"><rect x="4" y="4" width="16" height="16" rx="2.5"/></svg>`;

            this.dom.loadoutEffectIconWrap.innerHTML = `
                <span class="chip-fx-icon" style="filter: drop-shadow(0 0 4px ${pColor});">${shapeIcon}</span>
            `;
        }
    }

    openStatsModal() {
        const stats = this.gameState.stats;
        this.dom.statGames.textContent = stats.gamesPlayed || 0;
        this.dom.statHighScore.textContent = (this.gameState.highestScore || 0).toLocaleString();
        this.dom.statMaxCombo.textContent = stats.maxComboStreak || 0;
        this.dom.statLines.textContent = stats.totalLinesCleared || 0;
        this.dom.statAllClears.textContent = stats.allClearsCount || 0;

        if (this.dom.statsModal) {
            this.dom.statsModal.style.display = 'flex';
            this.dom.statsModal.classList.add('active');
        }
    }

    closeStatsModal() {
        if (this.dom.statsModal) {
            this.dom.statsModal.classList.remove('active');
            this.dom.statsModal.style.display = 'none';
        }
    }

    updateScoreDisplays(pointsGained = 0, combo = 0, linesCleared = 0) {
        if (this.dom.scoreHighest) this.dom.scoreHighest.textContent = this.gameState.highestScore.toLocaleString();
        if (this.dom.wingHighScore) this.dom.wingHighScore.textContent = this.gameState.highestScore.toLocaleString();
        if (this.dom.wingMaxCombo) this.dom.wingMaxCombo.textContent = this.gameState.stats?.maxComboStreak || this.gameState.comboCount || 0;
        if (this.dom.comboCurrent) this.dom.comboCurrent.textContent = this.gameState.comboCount;
        if (this.dom.comboFlame) {
            this.dom.comboFlame.style.display = this.gameState.comboCount >= 2 ? 'inline' : 'none';
        }

        if (this.gameState.score === 0) {
            this.displayedScore = 0;
            this.lastScore = 0;
            this.celebratedNewBest = false;
            if (this.dom.scoreCurrent) this.dom.scoreCurrent.textContent = '0';
            return;
        }

        const isSpecialGain = (linesCleared >= 1 || combo >= 1 || this.gameState.comboCount >= 1);

        if (isSpecialGain && (pointsGained > 0 || this.gameState.score > this.lastScore)) {
            // SCALE PUNCH: Only triggers when clearing 1+ row/column or during combo streaks!
            const scoreEl = this.dom.scoreCurrent;
            const emblem = document.querySelector('.score-diamond-emblem');
            if (scoreEl) {
                const animClass = (combo >= 3 || this.gameState.comboCount >= 3) ? 'score-punch-fire' : 'score-punch';
                scoreEl.classList.remove('score-punch', 'score-punch-fire', 'score-new-best');
                if (emblem) emblem.classList.remove('score-punch', 'score-punch-fire');

                // Force reflow for crisp animation replay
                void scoreEl.offsetWidth;
                scoreEl.classList.add(animClass);
                if (emblem) emblem.classList.add(animClass);

                // High score overtake celebration
                const oldHigh = this.gameState.highestScore;
                if (this.gameState.score > oldHigh && oldHigh > 0 && !this.celebratedNewBest) {
                    this.celebratedNewBest = true;
                    scoreEl.classList.add('score-new-best');
                    this.particles.addConfettiBurst(this.renderer.width, this.renderer.height, 40);
                }

                setTimeout(() => {
                    scoreEl.classList.remove('score-punch', 'score-punch-fire', 'score-new-best');
                    if (emblem) emblem.classList.remove('score-punch', 'score-punch-fire');
                }, 480);
            }
            this.lastScore = this.gameState.score;
        } else {
            // NORMAL DRAG & DROP: Add score immediately like normal without scale punch!
            this.displayedScore = this.gameState.score;
            this.lastScore = this.gameState.score;
            if (this.dom.scoreCurrent) {
                this.dom.scoreCurrent.textContent = this.displayedScore.toLocaleString();
            }
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

        // Smooth rolling odometer score animation with audio tick
        if (this.displayedScore !== this.gameState.score) {
            const diff = this.gameState.score - this.displayedScore;
            const step = Math.max(1, Math.ceil(Math.abs(diff) * 0.22));
            if (diff > 0) {
                this.displayedScore = Math.min(this.gameState.score, this.displayedScore + step);
            } else {
                this.displayedScore = Math.max(this.gameState.score, this.displayedScore - step);
            }

            if (this.dom.scoreCurrent) {
                this.dom.scoreCurrent.textContent = this.displayedScore.toLocaleString();
            }

            // Audio tick while counting up
            this.scoreTickTimer = (this.scoreTickTimer || 0) + dt;
            if (this.scoreTickTimer > 45 && diff > 0) {
                this.scoreTickTimer = 0;
                const pitch = 0.8 + (Math.min(diff, 500) / 500) * 0.8;
                this.audio.playScoreTick(pitch);
            }
        }

        this.particles.update(dt);
        this.renderer.render(dt);

        // Update & Render Theme Studio sample board canvas if visible
        if (this.dom.skinsView && this.dom.skinsView.style.display !== 'none') {
            if (this.studioParticles) {
                this.studioParticles.update(dt);
            }
            this.renderStudioCanvas(dt);
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new BlockBlastApp();
});
