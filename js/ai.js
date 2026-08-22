/**
 * Block Blast - Heuristic AI Solver & Assistant
 * Optimized for the exponential scoring model: S_turn = N_cells + (10 * L * 2^(L-1)) * (1 + 0.5 * C)
 * and DDA board fill maintenance.
 */

import { canPlaceShapeOnGrid, simulatePlacementOnGrid, Shape } from './shapes.js';

// Key reference benchmark shapes to test board flexibility
const BENCHMARK_TEST_SHAPES = [
    new Shape([2, 0]), // 3x3 square (Class 3)
    new Shape([11, 0]),// 5x1 horizontal (Class 3)
    new Shape([11, 1]),// 5x1 vertical (Class 3)
    new Shape([1, 0]), // 3x2 (Class 2)
    new Shape([0, 0]), // 2x2 (Class 1)
    new Shape([4, 0])  // 3x2 L (Class 2)
];

export class BlockBlastAI {
    constructor() {
        this.isThinking = false;
    }

    /**
     * Evaluate board state value under the exponential scoring formula
     */
    evaluateBoard(grid, linesCleared, comboCount, shapeCellCount) {
        let score = 0;

        // 1. Exponential Line Clear & Combo Value
        if (linesCleared > 0) {
            const baseClear = 10 * linesCleared * Math.pow(2, linesCleared - 1);
            const comboMultiplier = 1 + (0.5 * comboCount);
            const turnClearScore = baseClear * comboMultiplier;

            score += turnClearScore * 1.5;
        }

        // 2. Board Occupancy & Fill Rate
        let filledCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] !== 0) filledCount++;
            }
        }
        const fillRatio = filledCount / 64.0;

        // Penalize higher board density (especially above 0.75)
        if (fillRatio > 0.75) {
            score -= (fillRatio - 0.75) * 800;
        } else {
            score -= filledCount * 2.0;
        }

        // 3. Isolated Holes / Trapped Cells Penalty
        let trappedHoles = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] === 0) {
                    let walls = 0;
                    if (r === 0 || grid[r - 1][c] !== 0) walls++;
                    if (r === 7 || grid[r + 1][c] !== 0) walls++;
                    if (c === 0 || grid[r][c - 1] !== 0) walls++;
                    if (c === 7 || grid[r][c + 1] !== 0) walls++;

                    if (walls === 4) trappedHoles += 3;
                    else if (walls === 3) trappedHoles += 1;
                }
            }
        }
        score -= trappedHoles * 18;

        // 4. Test Board Openness / Flexibility
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
        score += fitCount * 25;

        // 5. High-density Line Readiness (lines with 6-7 blocks are primed for combos)
        for (let r = 0; r < 8; r++) {
            const count = grid[r].filter(c => c !== 0).length;
            if (count === 6) score += 10;
            else if (count === 7) score += 25;
        }
        for (let c = 0; c < 8; c++) {
            let count = 0;
            for (let r = 0; r < 8; r++) {
                if (grid[r][c] !== 0) count++;
            }
            if (count === 6) score += 10;
            else if (count === 7) score += 25;
        }

        return score;
    }

    /**
     * Find optimal move evaluating all available pieces and 2-ply lookahead
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

        for (const shapeIdx of availableIndices) {
            const shape = gameState.currentShapes[shapeIdx];
            for (let r = 0; r <= 8 - shape.rows; r++) {
                for (let c = 0; c <= 8 - shape.cols; c++) {
                    if (!gameState.canPlaceShape(shape, r, c)) continue;

                    // 1st Ply Simulation
                    const sim1 = simulatePlacementOnGrid(gameState.grid, shape, r, c);
                    const nextCombo = sim1.linesCleared > 0 ? (gameState.comboCount + 1) : gameState.comboCount;

                    let moveScore = this.evaluateBoard(
                        sim1.grid,
                        sim1.linesCleared,
                        nextCombo,
                        shape.cellCount
                    );

                    // 2nd Ply Lookahead: Test feasibility of other remaining shapes
                    const remainingShapes = availableIndices.filter(idx => idx !== shapeIdx);
                    let canFitRemaining = remainingShapes.length === 0;
                    let fitBonus = 0;

                    for (const nextIdx of remainingShapes) {
                        const nextShape = gameState.currentShapes[nextIdx];
                        let canFit = false;
                        for (let nr = 0; nr <= 8 - nextShape.rows; nr++) {
                            for (let nc = 0; nc <= 8 - nextShape.cols; nc++) {
                                if (canPlaceShapeOnGrid(sim1.grid, nextShape, nr, nc)) {
                                    canFit = true;
                                    fitBonus += 20;
                                    break;
                                }
                            }
                            if (canFit) break;
                        }
                        if (canFit) canFitRemaining = true;
                    }

                    if (!canFitRemaining && remainingShapes.length > 0) {
                        moveScore -= 800; // Heavy penalty if move locks out remaining pieces
                    } else {
                        moveScore += fitBonus;
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
