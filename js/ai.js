/**
 * Block Blast - Heuristic AI Solver & Assistant
 * Optimized for:
 * 1. Classic Mode: Exponential combo scoring & 3-piece full sequence lookahead
 * 2. Adventure Mode: Goal-seeking heuristic (prioritizes lines with Gems/Puzzles/Stars)
 * 3. Drop Mode: Anti-ceiling gravity management & rising row countdown anticipation
 */

import { canPlaceShapeOnGrid, simulatePlacementOnGrid, Shape } from './shapes.js';
import { GAME_MODES } from './modes.js';

// Key reference benchmark shapes to test board flexibility
const BENCHMARK_TEST_SHAPES = [
    new Shape([2, 0]), // 3x3 square (Class 3)
    new Shape([11, 0]),// 5x1 horizontal (Class 3)
    new Shape([11, 1]),// 5x1 vertical (Class 3)
    new Shape([1, 0]), // 3x2 (Class 2)
    new Shape([0, 0]), // 2x2 (Class 1)
    new Shape([4, 0])  // 3x2 L (Class 2)
];

function simulateDropRiseOnGrid(grid) {
    for (let c = 0; c < 8; c++) {
        if (grid[0][c] !== 0) return { overflow: true, grid };
    }
    const newGrid = [];
    for (let r = 0; r < 7; r++) {
        newGrid[r] = [...grid[r + 1]];
    }
    newGrid[7] = [1, 1, 0, 1, 1, 0, 1, 1];
    return { overflow: false, grid: newGrid };
}

export class BlockBlastAI {
    constructor() {
        this.isThinking = false;
    }

    /**
     * Context-aware heuristic evaluation across Classic, Adventure, and Drop modes
     */
    evaluateBoard(grid, simResult, comboCount, gameState, shapeCellCount = 0) {
        let score = 0;
        const linesCleared = simResult.linesCleared || 0;
        const rowsCleared = simResult.rowsCleared || [];
        const colsCleared = simResult.colsCleared || [];
        const mode = gameState?.mode || GAME_MODES.CLASSIC;
        let targetCells = null;

        // ==========================================
        // 1. Classic Exponential Scoring & Combo Value
        // ==========================================
        if (linesCleared > 0) {
            const baseClear = 10 * linesCleared * Math.pow(2, linesCleared - 1);
            const comboMultiplier = 1 + (0.5 * comboCount);
            const turnClearScore = baseClear * comboMultiplier;

            score += turnClearScore * 2.8;
        }

        // ==========================================
        // 2. Adventure Mode: Target Item Hunting (Gems, Puzzles, Stars)
        // ==========================================
        if (mode === GAME_MODES.ADVENTURE || gameState?.stageGoals) {
            targetCells = [];
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const cell = gameState.grid[r][c];
                    if (cell && cell.item) {
                        targetCells.push({ row: r, col: c, item: cell.item });
                    }
                }
            }

            // A. Huge reward for directly clearing target item rows/columns
            let itemsCollected = 0;
            for (const itemCell of targetCells) {
                if (rowsCleared.includes(itemCell.row) || colsCleared.includes(itemCell.col)) {
                    itemsCollected++;
                }
            }
            score += itemsCollected * 2500;

            // B. Reward filling blocks into rows/cols containing items to prime them for clearing
            for (const itemCell of targetCells) {
                const rowFilled = grid[itemCell.row].filter(x => x !== 0).length;
                let colFilled = 0;
                for (let r = 0; r < 8; r++) {
                    if (grid[r][itemCell.col] !== 0) colFilled++;
                }
                score += (rowFilled * 45) + (colFilled * 45);
            }
        }

        // ==========================================
        // 3. Drop Mode: Anti-Ceiling & Bottom Gap Filler
        // ==========================================
        if (mode === GAME_MODES.DROP) {
            const movesUntilDrop = gameState?.movesUntilDrop ?? 3;

            // A. Ceiling Overflow Danger: Extreme penalty for ANY blocks in top rows (0, 1, 2, 3)
            for (let r = 0; r < 4; r++) {
                const count = grid[r].filter(x => x !== 0).length;
                if (r === 0) {
                    score -= count * (movesUntilDrop <= 1 ? 80000 : 8000); // LETHAL
                } else if (r === 1) {
                    score -= count * (movesUntilDrop <= 1 ? 15000 : 4000);
                } else if (r === 2) {
                    score -= count * 1500;
                } else if (r === 3) {
                    score -= count * 400;
                }
            }

            // B. Massive reward for clearing rows (especially upper rows or multi-clears)
            for (const r of rowsCleared) {
                if (r === 0) score += 10000;
                else if (r <= 2) score += 5000;
                else score += 2000;
            }

            // C. Super high reward for completing rows (7/8, 6/8, 5/8) in bottom half
            for (let r = 4; r < 8; r++) {
                const count = grid[r].filter(x => x !== 0).length;
                if (count === 7) score += 600; // 1 block from clear!
                else if (count === 6) score += 300;
                else if (count === 5) score += 120;
            }

            // D. High incentive to trigger multi-line clears in Drop mode
            if (linesCleared > 0) {
                score += 2500 * Math.pow(1.8, linesCleared);
            }
        }

        // ==========================================
        // 4. Board Occupancy, Fill Rate & Stack Height
        // ==========================================
        let filledCount = 0;
        let highestOccupiedRow = 8;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (grid[r][c] !== 0) {
                    filledCount++;
                    if (r < highestOccupiedRow) highestOccupiedRow = r;
                }
            }
        }
        const fillRatio = filledCount / 64.0;

        // Progressive stack height compression penalty (only in Drop & Classic modes)
        if (mode === GAME_MODES.DROP) {
            if (highestOccupiedRow === 0) score -= 5000;
            else if (highestOccupiedRow === 1) score -= 2500;
            else if (highestOccupiedRow === 2) score -= 1000;
        } else if (mode === GAME_MODES.CLASSIC) {
            if (highestOccupiedRow === 0) score -= 2500;
            else if (highestOccupiedRow === 1) score -= 800;
            else if (highestOccupiedRow === 2) score -= 300;
        }

        if (fillRatio > 0.55) {
            score -= (fillRatio - 0.55) * 1800;
        } else {
            score -= filledCount * 2.5;
        }

        // ==========================================
        // 5. Isolated Holes / Trapped Cells Penalty
        // ==========================================
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
        score -= trappedHoles * 24;

        // ==========================================
        // 6. Test Board Openness / Flexibility
        // ==========================================
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
        score += fitCount * 22;

        // ==========================================
        // 7. High-density Line Readiness (6-7 blocks primed)
        // ==========================================
        for (let r = 0; r < 8; r++) {
            const count = grid[r].filter(c => c !== 0).length;
            if (count === 7) score += 35;
            else if (count === 6) score += 14;
        }
        for (let c = 0; c < 8; c++) {
            let count = 0;
            for (let r = 0; r < 8; r++) {
                if (grid[r][c] !== 0) count++;
            }
            if (count === 7) score += 35;
            else if (count === 6) score += 14;
        }

        return score;
    }

    /**
     * Find optimal move evaluating full permutation sequence lookahead with Mode Awareness
     */
    findBestMove(gameState) {
        const available = [];
        for (let i = 0; i < gameState.currentShapes.length; i++) {
            if (gameState.currentShapes[i] && gameState.currentShapes[i].form) {
                available.push(i);
            }
        }

        if (available.length === 0) return null;

        const isDropMode = (gameState.mode === GAME_MODES.DROP);
        const movesUntilDrop = gameState.movesUntilDrop ?? 3;

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

                    let gridAfter1 = sim1.grid;
                    let dropPenalty1 = 0;

                    if (isDropMode && movesUntilDrop === 1) {
                        const drop1 = simulateDropRiseOnGrid(sim1.grid);
                        if (drop1.overflow) {
                            dropPenalty1 = -100000;
                        } else {
                            gridAfter1 = drop1.grid;
                        }
                    }

                    const eval1 = this.evaluateBoard(sim1.grid, sim1, combo1, gameState, shape1.cellCount) + dropPenalty1;

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
                                if (!canPlaceShapeOnGrid(gridAfter1, shape2, r2, c2)) continue;

                                const sim2 = simulatePlacementOnGrid(gridAfter1, shape2, r2, c2);
                                const combo2 = sim2.linesCleared > 0 ? combo1 + 1 : combo1;

                                let gridAfter2 = sim2.grid;
                                let dropPenalty2 = 0;
                                if (isDropMode && movesUntilDrop === 2) {
                                    const drop2 = simulateDropRiseOnGrid(sim2.grid);
                                    if (drop2.overflow) {
                                        dropPenalty2 = -100000;
                                    } else {
                                        gridAfter2 = drop2.grid;
                                    }
                                }

                                const eval2 = this.evaluateBoard(sim2.grid, sim2, combo2, gameState, shape2.cellCount) + dropPenalty2;

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
                                        if (canPlaceShapeOnGrid(gridAfter2, shape3, r3, c3)) {
                                            canFit3 = true;
                                            break;
                                        }
                                    }
                                    if (canFit3) break;
                                }

                                if (canFit3) {
                                    sequencePossible = true;
                                    if (eval2 + 30 > bestRemainingBonus) bestRemainingBonus = eval2 + 30;
                                    break;
                                }
                            }
                            if (sequencePossible) break;
                        }
                        if (sequencePossible) break;
                    }

                    const totalChainScore = sequencePossible ? (eval1 + bestRemainingBonus) : (eval1 - 1800);
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
