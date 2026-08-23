/**
 * Block Blast - Game State & Engine
 * Implements Mathematical Scoring Specification:
 * S_turn = N_cells + I(L > 0) * [(10 * L * 2^(L-1)) * (1 + 0.5 * C)]
 * and Turn-based Combo Streak tracking.
 */

import { Shape, canPlaceShapeOnGrid, generateValidShapes } from './shapes.js';
import { GAME_MODES, ModeManager, DailyChallengeManager } from './modes.js';

export class BlockGameState {
    constructor() {
        this.STORAGE_KEY_HIGH_SCORE = 'blockblast_high_score';
        this.STORAGE_KEY_STATS = 'blockblast_stats';

        this.MAX_NON_CLEAR_TURNS = 2; // Combo resets on the 3rd placement without line clear
        this.COMBO_ALPHA = 0.5; // alpha = 0.5 combo scaling factor

        this.comboNames = {
            1: '',
            2: 'DOUBLE ',
            3: 'TRIPLE ',
            4: 'QUAD ',
            5: 'PENTA ',
            6: 'HEXA ',
            7: 'SEPTA ',
            8: 'OCTA '
        };

        this.mode = GAME_MODES.CLASSIC;
        this.stageId = 1;
        this.stageData = null;
        this.movesRemaining = 0;
        this.stageGoals = { type: 'gems', target: 0, collected: 0 };
        this.collectedItemsThisTurn = [];

        this.dropInterval = 3;
        this.movesUntilDrop = 3;

        this.highestScore = this.loadHighScore();
        this.stats = this.loadStats();

        this.reset();
    }

    reset() {
        // 8x8 matrix B in {0, 1}^(8x8)
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.score = 0;
        this.displayedScore = 0;
        this.gameOver = false;
        this.comboCount = 0; // C in specification
        this.comboHistory = ['COMBO 0'];
        this.placementsWithoutClear = 0;
        this.lastLinesCleared = 0;
        this.lastActionScore = 0;
        this.totalLinesClearedThisGame = 0;
        this.placementsCount = 0;
        this.hasUsedRevive = false; // Limited to 1 rewarded revive per session

        if (this.mode === GAME_MODES.ADVENTURE && this.stageId) {
            this.initAdventureStage(this.stageId);
        } else if (this.mode === GAME_MODES.DROP) {
            this.initDropMode();
        } else {
            // Generate 3 initial solvable pieces with DDA
            this.currentShapes = generateValidShapes(this.grid, this.comboCount);
        }

        this.stats.gamesPlayed = (this.stats.gamesPlayed || 0) + 1;
        this.saveStats();
    }

    initAdventureStage(stageId) {
        this.mode = GAME_MODES.ADVENTURE;
        this.stageId = stageId;
        this.stageData = ModeManager.getStage(stageId);
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.score = 0;
        this.displayedScore = 0;
        this.gameOver = false;
        this.comboCount = 0;
        this.comboHistory = ['COMBO 0'];
        this.placementsWithoutClear = 0;
        this.hasUsedRevive = false;
        this.movesRemaining = this.stageData.movesLimit;

        const goalKey = Object.keys(this.stageData.goals)[0] || 'gems';
        this.stageGoals = {
            type: goalKey,
            target: this.stageData.goals[goalKey] || 4,
            collected: 0
        };

        // Populate initial stage blocks with embedded collectibles
        if (this.stageData.initialBlocks) {
            for (const b of this.stageData.initialBlocks) {
                if (b.row >= 0 && b.row < 8 && b.col >= 0 && b.col < 8) {
                    this.grid[b.row][b.col] = {
                        color: b.color || { hex: '#10B981', light: '#6EE7B7', dark: '#059669' },
                        placedAt: Date.now(),
                        item: b.item || null
                    };
                }
            }
        }

        this.currentShapes = generateValidShapes(this.grid, this.comboCount);
    }

    initDropMode() {
        this.mode = GAME_MODES.DROP;
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.score = 0;
        this.displayedScore = 0;
        this.gameOver = false;
        this.comboCount = 0;
        this.comboHistory = ['COMBO 0'];
        this.placementsWithoutClear = 0;
        this.hasUsedRevive = false;
        this.dropInterval = 3;
        this.movesUntilDrop = 3;

        // Pre-fill bottom 2 rows with randomized block segments and open gaps
        const candyColors = [
            { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
            { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
            { hex: '#10B981', light: '#6EE7B7', dark: '#059669' },
            { hex: '#F59E0B', light: '#FDE68A', dark: '#D97706' },
            { hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' }
        ];

        for (let r = 6; r <= 7; r++) {
            const gaps = new Set();
            while (gaps.size < 3) {
                gaps.add(Math.floor(Math.random() * 8));
            }
            for (let c = 0; c < 8; c++) {
                if (!gaps.has(c)) {
                    this.grid[r][c] = {
                        color: candyColors[Math.floor(Math.random() * candyColors.length)],
                        placedAt: Date.now()
                    };
                }
            }
        }

        this.currentShapes = generateValidShapes(this.grid, this.comboCount);
    }

    initDailyChallenge() {
        this.mode = GAME_MODES.DAILY;
        const challenge = DailyChallengeManager.getTodayChallenge();
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.score = 0;
        this.displayedScore = 0;
        this.gameOver = false;
        this.comboCount = 0;
        this.comboHistory = ['COMBO 0'];
        this.placementsWithoutClear = 0;
        this.hasUsedRevive = false;
        this.movesRemaining = challenge.movesLimit;
        this.stageGoals = {
            type: 'gems',
            target: challenge.goals.gems,
            collected: 0
        };

        // Seed 4 corner gem blocks
        const seedGems = [
            { row: 2, col: 2 }, { row: 2, col: 5 },
            { row: 5, col: 2 }, { row: 5, col: 5 }
        ];
        for (const pt of seedGems) {
            this.grid[pt.row][pt.col] = {
                color: { hex: '#F59E0B', light: '#FDE047', dark: '#D97706' },
                placedAt: Date.now(),
                item: 'gem'
            };
        }

        this.currentShapes = generateValidShapes(this.grid, this.comboCount);
    }

    pushRisingRow() {
        // 1. Loss Condition: Check if any block exists in the top row (row 0)
        let hasTopOverflow = false;
        for (let c = 0; c < 8; c++) {
            if (this.grid[0][c] !== 0) {
                hasTopOverflow = true;
                break;
            }
        }

        if (hasTopOverflow) {
            this.gameOver = true;
            return { overflow: true };
        }

        // 2. Shift all rows upward by 1: row 0 gets row 1, ..., row 6 gets row 7
        for (let r = 0; r < 7; r++) {
            this.grid[r] = [...this.grid[r + 1]];
        }

        // 3. Generate a new bottom row at row 7 with 2-3 randomized gaps
        const candyColors = [
            { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' },
            { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' },
            { hex: '#10B981', light: '#6EE7B7', dark: '#059669' },
            { hex: '#F59E0B', light: '#FDE68A', dark: '#D97706' },
            { hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' }
        ];

        const gaps = new Set();
        while (gaps.size < 2) {
            gaps.add(Math.floor(Math.random() * 8));
        }

        const newRow = Array(8).fill(0);
        for (let c = 0; c < 8; c++) {
            if (!gaps.has(c)) {
                newRow[c] = {
                    color: candyColors[Math.floor(Math.random() * candyColors.length)],
                    placedAt: Date.now()
                };
            }
        }
        this.grid[7] = newRow;

        return { overflow: false };
    }

    get combos() {
        // Compatibility getter for UI feeds
        return [this.comboHistory, this.comboCount];
    }

    loadHighScore() {
        try {
            const val = localStorage.getItem(this.STORAGE_KEY_HIGH_SCORE);
            return val ? parseInt(val, 10) || 0 : 0;
        } catch (e) {
            return 0;
        }
    }

    saveHighScore(score) {
        this.highestScore = Math.max(this.highestScore, score);
        try {
            localStorage.setItem(this.STORAGE_KEY_HIGH_SCORE, this.highestScore.toString());
        } catch (e) {}
    }

    loadStats() {
        try {
            const val = localStorage.getItem(this.STORAGE_KEY_STATS);
            if (val) return JSON.parse(val);
        } catch (e) {}
        return {
            gamesPlayed: 0,
            highScore: 0,
            maxComboStreak: 0,
            totalLinesCleared: 0,
            allClearsCount: 0
        };
    }

    saveStats() {
        try {
            this.stats.highScore = Math.max(this.stats.highScore || 0, this.highestScore);
            localStorage.setItem(this.STORAGE_KEY_STATS, JSON.stringify(this.stats));
        } catch (e) {}
    }

    canPlaceShape(shape, row, col) {
        return canPlaceShapeOnGrid(this.grid, shape, row, col);
    }

    isValidPlacement(shapeIdx, row, col) {
        if (shapeIdx < 0 || shapeIdx >= this.currentShapes.length) return false;
        const shape = this.currentShapes[shapeIdx];
        if (!shape || !shape.form) return false;
        return this.canPlaceShape(shape, row, col);
    }

    getValidActions() {
        const validActions = [];
        for (let shapeIdx = 0; shapeIdx < this.currentShapes.length; shapeIdx++) {
            const shape = this.currentShapes[shapeIdx];
            if (!shape || !shape.form) continue;

            for (let r = 0; r <= 8 - shape.rows; r++) {
                for (let c = 0; c <= 8 - shape.cols; c++) {
                    if (this.isValidPlacement(shapeIdx, r, c)) {
                        validActions.push({ shapeIdx, row: r, col: c });
                    }
                }
            }
        }
        return validActions;
    }

    placeShape(shapeIdx, row, col) {
        if (!this.isValidPlacement(shapeIdx, row, col)) {
            return { isValid: false };
        }

        const shape = this.currentShapes[shapeIdx];
        const h = shape.rows;
        const w = shape.cols;
        const placedCells = [];

        // 1. Commit Shape into matrix B
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                if (shape.form[r][c]) {
                    this.grid[row + r][col + c] = {
                        color: shape.color,
                        placedAt: Date.now(),
                        shapeId: shape.id
                    };
                    placedCells.push({ row: row + r, col: col + c });
                }
            }
        }

        const N_cells = shape.cellCount;
        this.placementsCount++;

        // 2. Consume the shape
        this.currentShapes[shapeIdx] = null;

        // 3. Line clear pass and score calculation
        const clearResult = this.updateGrid(N_cells);
        const linesCleared = clearResult.linesCleared;

        // 4. Update Combo Streak C: increases on line clears, resets to 0 on normal moves
        let comboReset = false;
        if (linesCleared > 0) {
            this.placementsWithoutClear = 0;
            this.comboCount += 1; // Increases by +1 per consecutive clearing turn
            this.comboHistory[this.comboHistory.length - 1] = `COMBO ${this.comboCount}`;
            this.totalLinesClearedThisGame += linesCleared;
            this.stats.totalLinesCleared = (this.stats.totalLinesCleared || 0) + linesCleared;
            this.stats.maxComboStreak = Math.max(this.stats.maxComboStreak || 0, this.comboCount);
        } else {
            // Normal placement with 0 lines cleared -> Combo breaks immediately
            if (this.comboCount > 0) {
                comboReset = true;
            }
            this.comboCount = 0;
            this.comboHistory[this.comboHistory.length - 1] = 'COMBO 0';
            this.placementsWithoutClear = 0;
        }

        // 5. Adventure & Drop Mode Progression Checks
        let isAdventureWin = false;
        let isAdventureLoss = false;
        let starsEarned = 0;
        let rowPushed = false;

        if (this.mode === GAME_MODES.ADVENTURE || this.mode === GAME_MODES.DAILY) {
            this.movesRemaining = Math.max(0, this.movesRemaining - 1);

            // Check Win condition: stage/daily target reached
            if (this.stageGoals && this.stageGoals.collected >= this.stageGoals.target) {
                isAdventureWin = true;
                this.gameOver = true;
                this.stageCompleted = true;
                starsEarned = (this.movesRemaining >= 4) ? 3 : (this.movesRemaining >= 1 ? 2 : 1);
                if (this.mode === GAME_MODES.ADVENTURE) {
                    ModeManager.saveStageVictory(this.stageId, starsEarned, this.score);
                } else if (this.mode === GAME_MODES.DAILY) {
                    DailyChallengeManager.saveDailyCompletion(this.score);
                }
            } else if (this.movesRemaining <= 0) {
                // Loss condition: out of moves before goals met
                this.gameOver = true;
                isAdventureLoss = true;
            }
        } else if (this.mode === GAME_MODES.DROP) {
            this.movesUntilDrop--;
            if (this.movesUntilDrop <= 0) {
                const pushRes = this.pushRisingRow();
                rowPushed = true;
                this.movesUntilDrop = this.dropInterval;
                if (pushRes.overflow) {
                    this.gameOver = true;
                }
            }
        }

        // 6. Generate new shapes via DDA if all 3 slots empty
        let newShapesGenerated = false;
        if (this.currentShapes.every(s => s === null)) {
            this.currentShapes = generateValidShapes(this.grid, this.comboCount);
            newShapesGenerated = true;
        }

        // 7. Check Game Over (Classic fit check)
        if (!isAdventureWin && !isAdventureLoss && !this.gameOver) {
            this.checkGameOver();
        }

        // 8. High score check
        const isNewRecord = this.score > this.highestScore;
        if (isNewRecord) {
            this.saveHighScore(this.score);
        }
        this.saveStats();

        return {
            isValid: true,
            placedCells,
            shapePlaced: shape,
            linesCleared,
            rowsCleared: clearResult.rowsCleared,
            colsCleared: clearResult.colsCleared,
            allClear: clearResult.allClear,
            scoreGained: clearResult.totalTurnScore,
            bonusScore: clearResult.lineClearScore,
            comboCount: this.comboCount,
            comboMessage: clearResult.comboMessage,
            comboReset,
            newShapesGenerated,
            gameOver: this.gameOver,
            isNewRecord,
            collectedItems: clearResult.collectedItems || [],
            isAdventureWin,
            isAdventureLoss,
            starsEarned,
            rowPushed,
            movesUntilDrop: this.movesUntilDrop,
            movesRemaining: this.movesRemaining,
            stageGoals: this.stageGoals
        };
    }

    updateGrid(N_cells) {
        const rowsToDelete = [];
        const colsToDelete = [];

        // Check complete rows: sum B[r][c] == 8
        for (let r = 0; r < 8; r++) {
            if (this.grid[r].every(cell => cell !== 0)) {
                rowsToDelete.push(r);
            }
        }

        // Check complete columns: sum B[r][c] == 8
        for (let c = 0; c < 8; c++) {
            let full = true;
            for (let r = 0; r < 8; r++) {
                if (this.grid[r][c] === 0) {
                    full = false;
                    break;
                }
            }
            if (full) colsToDelete.push(c);
        }

        const collectedItems = [];

        // Check cells to be cleared for collectible items
        const cellsToClear = new Set();
        for (const r of rowsToDelete) {
            for (let c = 0; c < 8; c++) {
                cellsToClear.add(`${r},${c}`);
            }
        }
        for (const c of colsToDelete) {
            for (let r = 0; r < 8; r++) {
                cellsToClear.add(`${r},${c}`);
            }
        }

        for (const coord of cellsToClear) {
            const [r, c] = coord.split(',').map(Number);
            const cell = this.grid[r][c];
            if (cell && cell.item) {
                collectedItems.push({ row: r, col: c, item: cell.item });
                if (this.stageGoals) {
                    this.stageGoals.collected++;
                }
            }
        }

        // Clear rows
        for (const r of rowsToDelete) {
            for (let c = 0; c < 8; c++) {
                this.grid[r][c] = 0;
            }
        }

        // Clear cols
        for (const c of colsToDelete) {
            for (let r = 0; r < 8; r++) {
                this.grid[r][c] = 0;
            }
        }

        // Check All Clear
        let allClear = true;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (this.grid[r][c] !== 0) {
                    allClear = false;
                    break;
                }
            }
            if (!allClear) break;
        }

        const L = rowsToDelete.length + colsToDelete.length;
        this.lastLinesCleared = L;

        // Mathematical Formula:
        // S_turn = N_cells + I(L > 0) * [(10 * L * 2^(L-1)) * (1 + alpha * C)]
        let lineClearScore = 0;
        let comboMessage = null;

        if (L > 0) {
            const baseClear = 10 * L * Math.pow(2, L - 1);
            const comboMultiplier = 1 + (this.COMBO_ALPHA * this.comboCount);
            lineClearScore = Math.round(baseClear * comboMultiplier);

            const prefix = this.comboNames[L] || 'MULTI ';
            comboMessage = `${prefix}CLEAR +${lineClearScore}`;
            this.comboHistory.splice(this.comboHistory.length - 1, 0, comboMessage);

            if (allClear) {
                lineClearScore += 300;
                this.stats.allClearsCount = (this.stats.allClearsCount || 0) + 1;
                this.comboHistory.splice(this.comboHistory.length - 1, 0, 'ALL CLEAR! +300');
            }
        }

        const totalTurnScore = N_cells + lineClearScore;
        this.score += totalTurnScore;
        this.lastActionScore = totalTurnScore;

        return {
            linesCleared: L,
            rowsCleared: rowsToDelete,
            colsCleared: colsToDelete,
            allClear,
            lineClearScore,
            totalTurnScore,
            comboMessage,
            collectedItems
        };
    }

    checkGameOver() {
        this.gameOver = true;

        for (let shapeIdx = 0; shapeIdx < this.currentShapes.length; shapeIdx++) {
            const shape = this.currentShapes[shapeIdx];
            if (!shape || !shape.form) continue;

            for (let r = 0; r <= 8 - shape.rows; r++) {
                for (let c = 0; c <= 8 - shape.cols; c++) {
                    if (this.canPlaceShape(shape, r, c)) {
                        this.gameOver = false;
                        return false;
                    }
                }
            }
        }

        return true;
    }

    /**
     * Rewarded Video Revive Action:
     * Triggers a grid sweep clearing the 4x4 center section (rows 2..5, cols 2..5)
     * and restores active gameplay without losing the current score or streak.
     * Strictly limited to 1 use per session.
     */
    reviveWithCenterSweep() {
        if (this.hasUsedRevive) {
            return { success: false, message: 'Revive already used this session.' };
        }

        this.hasUsedRevive = true;
        const clearedCells = [];

        // Clear 4x4 center section (rows 2-5, cols 2-5)
        for (let r = 2; r <= 5; r++) {
            for (let c = 2; c <= 5; c++) {
                if (this.grid[r][c] !== 0) {
                    clearedCells.push({ row: r, col: c, color: this.grid[r][c].color });
                    this.grid[r][c] = 0;
                }
            }
        }

        this.gameOver = false;

        // Ensure shapes can fit after the 4x4 sweep; if none fit, generate fresh solvable set
        let canFitAny = false;
        for (const shape of this.currentShapes) {
            if (!shape || !shape.form) continue;
            for (let r = 0; r <= 8 - shape.rows; r++) {
                for (let c = 0; c <= 8 - shape.cols; c++) {
                    if (this.canPlaceShape(shape, r, c)) {
                        canFitAny = true;
                        break;
                    }
                }
                if (canFitAny) break;
            }
            if (canFitAny) break;
        }

        if (!canFitAny) {
            this.currentShapes = generateValidShapes(this.grid, this.comboCount);
        }

        return {
            success: true,
            clearedCellsCount: clearedCells.length,
            clearedCells
        };
    }

    getStateSnapshot() {
        return {
            grid: this.grid.map(row => [...row]),
            currentShapes: this.currentShapes.map(s => (s ? s.clone() : null)),
            score: this.score,
            highestScore: this.highestScore,
            gameOver: this.gameOver,
            comboCount: this.comboCount,
            comboHistory: [...this.comboHistory],
            placementsWithoutClear: this.placementsWithoutClear,
            hasUsedRevive: this.hasUsedRevive
        };
    }
}
