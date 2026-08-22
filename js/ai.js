/**
 * Block Blast - Heuristic AI Solver & Assistant
 * Evaluates board states with lookahead to find optimal moves for Hints and Autoplay.
 */

import { canPlaceShapeOnGrid, simulatePlacementOnGrid, FORMS, Shape } from './shapes.js';

// Key reference shapes used to test board flexibility/openness
const BENCHMARK_TEST_SHAPES = [
    new Shape([2, 0]), // 3x3 square
    new Shape([11, 0]),// 5x1 horizontal
    new Shape([11, 1]),// 5x1 vertical
    new Shape([1, 0]), // 3x2
    new Shape([0, 0]), // 2x2
    new Shape([4, 0])  // 3x2 L
];

export class BlockBlastAI {
    constructor() {
        this.isThinking = false;
    }

    /**
     * Evaluate the quality of a board state
     */
    evaluateBoard(grid, linesCleared, comboCount, shapeCellCount) {
        let score = 0;

        // 1. Line Clear Reward
        if (linesCleared > 0) {
            score += linesCleared * 120;
            if (linesCleared >= 2) {
                score += linesCleared * 80; // Multi-line bonus
            }
            score += comboCount * 30; // Combo bonus
        }

        // 2. Count occupied cells & free cells
        let filledCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] !== 0) filledCount++;
            }
        }

        // Penalty for too crowded board
        score -= (filledCount * 2.5);

        // 3. Isolated Holes & Trapped Empty Cells Penalty
        let trappedHoles = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] === 0) {
                    let walls = 0;
                    if (r === 0 || grid[r - 1][c] !== 0) walls++;
                    if (r === 7 || grid[r + 1][c] !== 0) walls++;
                    if (c === 0 || grid[r][c - 1] !== 0) walls++;
                    if (c === 7 || grid[r][c + 1] !== 0) walls++;

                    if (walls >= 4) trappedHoles += 3;
                    else if (walls === 3) trappedHoles += 1;
                }
            }
        }
        score -= trappedHoles * 15;

        // 4. Test Board Flexibility (can big pieces fit?)
        let fitCount = 0;
        for (const testShape of BENCHMARK_TEST_SHAPES) {
            let canFit = false;
            for (let r = 0; r <= 8 - testShape.rows; r++) {
                for (let c = 0; c <= 8 - testShape.cols; c++) {
                    if (canPlaceShapeOnGrid(grid, testShape, r, c)) {
                        canFit = true;
                        fitCount++;
                        break;
                    }
                }
                if (canFit) break;
            }
        }
        score += fitCount * 20;

        // 5. Line Completeness Incentive (lines close to 8 cells get rewarded)
        for (let r = 0; r < 8; r++) {
            const count = grid[r].filter(c => c !== 0).length;
            if (count >= 6) score += (count - 5) * 8;
        }
        for (let c = 0; c < 8; c++) {
            let count = 0;
            for (let r = 0; r < 8; r++) {
                if (grid[r][c] !== 0) count++;
            }
            if (count >= 6) score += (count - 5) * 8;
        }

        return score;
    }

    /**
     * Find the best immediate move for the current available shapes
     */
    findBestMove(gameState) {
        const availableIndices = [];
        for (let i = 0; i < gameState.currentShapes.length; i++) {
            if (gameState.currentShapes[i] && gameState.currentShapes[i].form) {
                availableIndices.push(i);
            }
        }

        if (availableIndices.length === 0) return null;

        let bestMove = null;
        let highestScore = -Infinity;

        // Permutations / Lookahead search
        for (const shapeIdx of availableIndices) {
            const shape = gameState.currentShapes[shapeIdx];
            for (let r = 0; r <= 8 - shape.rows; r++) {
                for (let c = 0; c <= 8 - shape.cols; c++) {
                    if (!gameState.canPlaceShape(shape, r, c)) continue;

                    // 1st Ply simulation
                    const sim1 = simulatePlacementOnGrid(gameState.grid, shape, r, c);
                    let moveScore = this.evaluateBoard(
                        sim1.grid,
                        sim1.linesCleared,
                        gameState.combos[1] + sim1.linesCleared,
                        shape.cellCount
                    );

                    // 2nd Ply: Check remaining available shapes to see if they can still be placed
                    const remainingShapes = availableIndices.filter(idx => idx !== shapeIdx);
                    let subsequentFitBonus = 0;
                    let canFitNext = remainingShapes.length === 0;

                    for (const nextIdx of remainingShapes) {
                        const nextShape = gameState.currentShapes[nextIdx];
                        let canFit = false;
                        for (let nr = 0; nr <= 8 - nextShape.rows; nr++) {
                            for (let nc = 0; nc <= 8 - nextShape.cols; nc++) {
                                if (canPlaceShapeOnGrid(sim1.grid, nextShape, nr, nc)) {
                                    canFit = true;
                                    subsequentFitBonus += 15;
                                    break;
                                }
                            }
                            if (canFit) break;
                        }
                        if (canFit) canFitNext = true;
                    }

                    if (!canFitNext && remainingShapes.length > 0) {
                        // Severe penalty if this move traps all remaining pieces
                        moveScore -= 500;
                    } else {
                        moveScore += subsequentFitBonus;
                    }

                    if (moveScore > highestScore) {
                        highestScore = moveScore;
                        bestMove = {
                            shapeIdx,
                            row: r,
                            col: c,
                            shape,
                            linesCleared: sim1.linesCleared,
                            score: moveScore
                        };
                    }
                }
            }
        }

        return bestMove;
    }
}
