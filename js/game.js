/**
 * Block Blast - Game State & Engine
 * Exact replica of game_state.py mechanics with score, combos, and game loop.
 */

import { Shape, canPlaceShapeOnGrid, generateValidShapes } from './shapes.js';

export class BlockGameState {
    constructor() {
        this.STORAGE_KEY_HIGH_SCORE = 'blockblast_high_score';
        this.STORAGE_KEY_STATS = 'blockblast_stats';

        this.MAX_COMBO_STREAK = 3; // Resets combo after 3 placements without clearing lines

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

        this.highestScore = this.loadHighScore();
        this.stats = this.loadStats();

        this.reset();
    }

    reset() {
        // 8x8 grid (0 = empty, object = filled cell with color data)
        this.grid = Array.from({ length: 8 }, () => Array(8).fill(0));
        this.score = 0;
        this.displayedScore = 0;
        this.gameOver = false;
        this.comboStreak = false;
        this.combos = [['COMBO 0'], 0]; // [history array, current count]
        this.placementsWithoutClear = 0;
        this.lastLinesCleared = 0;
        this.lastActionScore = 0;
        this.totalLinesClearedThisGame = 0;
        this.placementsCount = 0;

        // Generate 3 initial solvable shapes
        this.currentShapes = generateValidShapes(this.grid);

        this.stats.gamesPlayed = (this.stats.gamesPlayed || 0) + 1;
        this.saveStats();
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

        // 1. Place blocks on grid
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

        // Add 1 point per placed tile
        const baseTileScore = shape.cellCount;
        this.score += baseTileScore;
        this.placementsCount++;

        // 2. Consume the shape
        this.currentShapes[shapeIdx] = null;

        // 3. Clear lines & calculate bonus
        const clearResult = this.updateGrid();
        const linesCleared = clearResult.linesCleared;

        // 4. Update combo streak tracking
        let comboReset = false;
        if (linesCleared > 0) {
            this.placementsWithoutClear = 0;
            this.totalLinesClearedThisGame += linesCleared;
            this.stats.totalLinesCleared = (this.stats.totalLinesCleared || 0) + linesCleared;
            this.stats.maxComboStreak = Math.max(this.stats.maxComboStreak || 0, this.combos[1]);
        } else {
            this.placementsWithoutClear++;
            if (this.placementsWithoutClear >= this.MAX_COMBO_STREAK) {
                if (this.combos[1] > 0) comboReset = true;
                this.comboStreak = false;
                this.combos[1] = 0;
                this.combos[0][this.combos[0].length - 1] = 'COMBO 0';
                this.placementsWithoutClear = 0;
            }
        }

        // 5. Generate new shapes if all 3 are used
        let newShapesGenerated = false;
        if (this.currentShapes.every(s => s === null)) {
            this.currentShapes = generateValidShapes(this.grid);
            newShapesGenerated = true;
        }

        // 6. Check Game Over
        this.checkGameOver();

        // 7. Check & update high score
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
            scoreGained: this.lastActionScore + baseTileScore,
            bonusScore: clearResult.bonus,
            comboCount: this.combos[1],
            comboMessage: clearResult.comboMessage,
            comboReset,
            newShapesGenerated,
            gameOver: this.gameOver,
            isNewRecord
        };
    }

    updateGrid() {
        this.lastLinesCleared = 0;
        const scoreBefore = this.score;

        const rowsToDelete = [];
        const colsToDelete = [];

        // Check rows
        for (let r = 0; r < 8; r++) {
            if (this.grid[r].every(cell => cell !== 0)) {
                rowsToDelete.push(r);
            }
        }

        // Check cols
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

        // Check All-Clear
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

        const linesCleared = rowsToDelete.length + colsToDelete.length;
        this.lastLinesCleared = linesCleared;
        let bonus = 0;
        let comboMessage = null;

        if (linesCleared > 0) {
            // Formula from original game_state.py:
            // bonus = lines_cleared * 10 * (combos[1] + 1)
            // if lines_cleared > 2: bonus *= (lines_cleared - 1)
            bonus = linesCleared * 10 * (this.combos[1] + 1);
            if (linesCleared > 2) {
                bonus *= (linesCleared - 1);
            }

            const prefix = this.comboNames[linesCleared] || 'MULTI ';
            comboMessage = `${prefix}CLEAR +${bonus}`;
            this.combos[0].splice(this.combos[0].length - 1, 0, comboMessage);

            if (allClear) {
                bonus += 300;
                this.combos[0].splice(this.combos[0].length - 1, 0, 'ALL CLEAR +300');
                this.stats.allClearsCount = (this.stats.allClearsCount || 0) + 1;
            }

            // Keep combo history capped at 8 entries
            if (this.combos[0].length > 8) {
                this.combos[0] = this.combos[0].slice(-8);
            }

            this.combos[1] += linesCleared;
            this.combos[0][this.combos[0].length - 1] = `COMBO ${this.combos[1]}`;
            this.comboStreak = true;

            this.score += bonus;
        }

        this.lastActionScore = this.score - scoreBefore;

        return {
            linesCleared,
            rowsCleared: rowsToDelete,
            colsCleared: colsToDelete,
            allClear,
            bonus,
            comboMessage
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

    getStateSnapshot() {
        return {
            grid: this.grid.map(row => [...row]),
            currentShapes: this.currentShapes.map(s => (s ? s.clone() : null)),
            score: this.score,
            highestScore: this.highestScore,
            gameOver: this.gameOver,
            comboStreak: this.comboStreak,
            comboCount: this.combos[1],
            combos: [...this.combos[0]],
            placementsWithoutClear: this.placementsWithoutClear
        };
    }
}
