/**
 * Block Blast - Heuristic AI Solver & Assistant
 * Optimized for the exponential scoring model: S_turn = N_cells + (10 * L * 2^(L-1)) * (1 + 0.5 * C)
 * Implements S_3 Sequence Lookahead Search to guarantee all 3 dock shapes fit without blocking.
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
    evaluateBoard(grid, linesCleared, comboCount, shapeCellCount = 0) {
        let score = 0;

        // 1. Exponential Line Clear & Combo Value
        if (linesCleared > 0) {
            const baseClear = 10 * linesCleared * Math.pow(2, linesCleared - 1);
            const comboMultiplier = 1 + (0.5 * comboCount);
            const turnClearScore = baseClear * comboMultiplier;

            score += turnClearScore * 2.5;
        }

        // 2. Board Occupancy & Fill Rate
        let filledCount = 0;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] !== 0) filledCount++;
            }
        }
        const fillRatio = filledCount / 64.0;

        // Penalize higher board density (especially above 0.65)
        if (fillRatio > 0.65) {
            score -= (fillRatio - 0.65) * 1500;
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

                    if (walls === 4) trappedHoles += 4;
                    else if (walls === 3) trappedHoles += 1.5;
                }
            }
        }
        score -= trappedHoles * 20;

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
        score += fitCount * 18;

        // 5. High-density Line Readiness (lines with 6-7 blocks are primed for combos)
        for (let r = 0; r < 8; r++) {
            const count = grid[r].filter(c => c !== 0).length;
            if (count === 7) score += 30;
            else if (count === 6) score += 12;
        }
        for (let c = 0; c < 8; c++) {
            let count = 0;
            for (let r = 0; r < 8; r++) {
                if (grid[r][c] !== 0) count++;
            }
            if (count === 7) score += 30;
            else if (count === 6) score += 12;
        }

        return score;
    }

    /**
     * Find optimal move evaluating full permutation sequence lookahead
     */
    findBestMove(gameState) {
        const available = [];
        for (let i = 0; i < gameState.currentShapes.length; i++) {
            if (gameState.currentShapes[i] && gameState.currentShapes[i].form) {
                available.push(i);
            }
        }

        if (available.length === 0) return null;

        let bestFirstMove = null;
        let maxChainScore = -Infinity;

        for (const s1 of available) {
            const shape1 = gameState.currentShapes[s1];
            const rem1 = available.filter(i => i !== s1);

            for (let r1 = 0; r1 <= 8 - shape1.rows; r1++) {
                for (let c1 = 0; c1 <= 8 - shape1.cols; c1++) {
                    if (!canPlaceShapeOnGrid(gameState.grid, shape1, r1, c1)) continue;

                    const sim1 = simulatePlacementOnGrid(gameState.grid, shape1, r1, c1);
                    const combo1 = sim1.linesCleared > 0 ? gameState.comboCount + 1 : gameState.comboCount;
                    const eval1 = this.evaluateBoard(sim1.grid, sim1.linesCleared, combo1, shape1.cellCount);

                    if (rem1.length === 0) {
                        if (eval1 > maxChainScore) {
                            maxChainScore = eval1;
                            bestFirstMove = { shapeIdx: s1, row: r1, col: c1, shape: shape1, linesCleared: sim1.linesCleared, score: eval1 };
                        }
                        continue;
                    }

                    // Check if remaining pieces can be placed in sequence without jamming
                    let sequencePossible = false;
                    let bestRemainingBonus = -Infinity;

                    for (const s2 of rem1) {
                        const shape2 = gameState.currentShapes[s2];
                        const rem2 = rem1.filter(i => i !== s2);

                        for (let r2 = 0; r2 <= 8 - shape2.rows; r2++) {
                            for (let c2 = 0; c2 <= 8 - shape2.cols; c2++) {
                                if (!canPlaceShapeOnGrid(sim1.grid, shape2, r2, c2)) continue;

                                const sim2 = simulatePlacementOnGrid(sim1.grid, shape2, r2, c2);
                                const combo2 = sim2.linesCleared > 0 ? combo1 + 1 : combo1;
                                const eval2 = this.evaluateBoard(sim2.grid, sim2.linesCleared, combo2, shape2.cellCount);

                                if (rem2.length === 0) {
                                    sequencePossible = true;
                                    if (eval2 > bestRemainingBonus) bestRemainingBonus = eval2;
                                    break;
                                }

                                // For piece 3, verify feasibility
                                const s3 = rem2[0];
                                const shape3 = gameState.currentShapes[s3];
                                let canFit3 = false;
                                for (let r3 = 0; r3 <= 8 - shape3.rows; r3++) {
                                    for (let c3 = 0; c3 <= 8 - shape3.cols; c3++) {
                                        if (canPlaceShapeOnGrid(sim2.grid, shape3, r3, c3)) {
                                            canFit3 = true;
                                            break;
                                        }
                                    }
                                    if (canFit3) break;
                                }

                                if (canFit3) {
                                    sequencePossible = true;
                                    if (eval2 + 25 > bestRemainingBonus) bestRemainingBonus = eval2 + 25;
                                    break;
                                }
                            }
                            if (sequencePossible) break;
                        }
                        if (sequencePossible) break;
                    }

                    const totalChainScore = sequencePossible ? (eval1 + bestRemainingBonus) : (eval1 - 1500);
                    if (totalChainScore > maxChainScore) {
                        maxChainScore = totalChainScore;
                        bestFirstMove = {
                            shapeIdx: s1,
                            row: r1,
                            col: c1,
                            shape: shape1,
                            linesCleared: sim1.linesCleared,
                            score: totalChainScore
                        };
                    }
                }
            }
        }

        return bestFirstMove;
    }
}
