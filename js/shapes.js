/**
 * Block Blast - Shape Definitions, DDA Spawner & Solvability Engine
 * Features diverse vibrant block colors and S_3 forward solvability.
 */

export const SHAPE_COLORS = [
    { name: 'yellow', hex: '#FBBF24', light: '#FDE68A', dark: '#D97706', rgb: [251, 191, 36] },
    { name: 'orange', hex: '#F97316', light: '#FDBA74', dark: '#EA580C', rgb: [249, 115, 22] },
    { name: 'red',    hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626', rgb: [239, 68, 68] },
    { name: 'green',  hex: '#10B981', light: '#6EE7B7', dark: '#059669', rgb: [16, 185, 129] },
    { name: 'cyan',   hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2', rgb: [6, 182, 212] },
    { name: 'blue',   hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB', rgb: [59, 130, 246] },
    { name: 'purple', hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED', rgb: [139, 92, 246] },
    { name: 'pink',   hex: '#EC4899', light: '#F472B6', dark: '#DB2777', rgb: [236, 72, 153] }
];

export let activeColorPalette = SHAPE_COLORS;

export function setActiveColorPalette(palette) {
    if (palette && Array.isArray(palette) && palette.length > 0) {
        activeColorPalette = palette;
    }
}

export function getActiveColorPalette() {
    return activeColorPalette;
}

export const FORMS = [
    // 0: 2x2 square (Class 1)
    [
        [[1, 1], [1, 1]]
    ],
    // 1: 3x2 rectangle (Class 2)
    [
        [[1, 1, 1], [1, 1, 1]],
        [[1, 1], [1, 1], [1, 1]]
    ],
    // 2: 3x3 square (Class 3)
    [
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    ],
    // 3: 3x3 L shape (Class 3)
    [
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
        [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [0, 0, 1], [1, 1, 1]]
    ],
    // 4: 2x3 L shape (Class 2)
    [
        [[1, 1, 1], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1]],
        [[0, 0, 1], [1, 1, 1]],
        [[1, 0, 0], [1, 1, 1]],
        [[1, 0], [1, 0], [1, 1]],
        [[0, 1], [0, 1], [1, 1]],
        [[1, 1], [0, 1], [0, 1]],
        [[1, 1], [1, 0], [1, 0]]
    ],
    // 5: Z shape (Class 3)
    [
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 0], [0, 1, 1]],
        [[1, 0], [1, 1], [0, 1]],
        [[0, 1], [1, 1], [1, 0]]
    ],
    // 6: T shape (Class 2)
    [
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0], [1, 1], [1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[0, 1], [1, 1], [0, 1]]
    ],
    // 7: 2x1 rectangle (Class 1)
    [
        [[1, 1]],
        [[1], [1]]
    ],
    // 8: 3x1 rectangle (Class 1)
    [
        [[1, 1, 1]],
        [[1], [1], [1]]
    ],
    // 9: S shape (Class 3)
    [
        [[1, 0], [1, 1]],
        [[1, 1], [0, 1]],
        [[1, 1], [1, 0]],
        [[0, 1], [1, 1]]
    ],
    // 10: 4x1 rectangle (Class 2)
    [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]]
    ],
    // 11: 5x1 rectangle (Class 3)
    [
        [[1, 1, 1, 1, 1]],
        [[1], [1], [1], [1], [1]]
    ],
    // 12: 2x2 L / corner shape (Class 2)
    [
        [[1, 0], [1, 1]],
        [[0, 1], [1, 1]],
        [[1, 1], [1, 0]],
        [[1, 1], [0, 1]]
    ]
];

// Difficulty Class Categorization
export const SHAPE_CLASSES = {
    CLASS_1: [
        { formIdx: -1, varIdx: 0 }, // 1x1 dot
        { formIdx: 7, varIdx: null }, // 2x1
        { formIdx: 8, varIdx: null }, // 3x1
        { formIdx: 0, varIdx: null }  // 2x2
    ],
    CLASS_2: [
        { formIdx: 1, varIdx: null }, // 3x2
        { formIdx: 4, varIdx: null }, // 2x3 L
        { formIdx: 6, varIdx: null }, // T-shape
        { formIdx: 10, varIdx: null },// 4x1
        { formIdx: 12, varIdx: null } // 2x2 corner L
    ],
    CLASS_3: [
        { formIdx: 2, varIdx: null }, // 3x3 square
        { formIdx: 3, varIdx: null }, // 3x3 large L
        { formIdx: 5, varIdx: null }, // Z-shape
        { formIdx: 9, varIdx: null }, // S-shape
        { formIdx: 11, varIdx: null } // 5x1 line
    ]
};

export class Shape {
    constructor(formIndex = null, color = null) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.formIndex = formIndex;
        this.variantIndex = 0;

        if (Array.isArray(formIndex)) {
            const [fIdx, vIdx] = formIndex;
            this.formIndex = fIdx;
            this.variantIndex = vIdx;
            this.form = FORMS[fIdx][vIdx];
        } else if (formIndex === -1) {
            // Single 1x1 dot
            this.form = [[1]];
        } else if (typeof formIndex === 'number' && FORMS[formIndex]) {
            const variants = FORMS[formIndex];
            this.variantIndex = Math.floor(Math.random() * variants.length);
            this.form = variants[this.variantIndex];
        } else if (Array.isArray(formIndex) && Array.isArray(formIndex[0])) {
            this.form = formIndex;
        } else {
            this.form = [[1]];
        }

        // Varied block color matching active skin palette
        const palette = activeColorPalette && activeColorPalette.length > 0 ? activeColorPalette : SHAPE_COLORS;
        this.color = color || palette[Math.floor(Math.random() * palette.length)];
        this.rows = this.form.length;
        this.cols = this.form[0].length;
        this.cellCount = this.form.reduce((acc, row) => acc + row.reduce((r, c) => r + c, 0), 0);
    }

    clone() {
        const copy = new Shape([this.formIndex, this.variantIndex], this.color);
        copy.form = this.form.map(row => [...row]);
        copy.rows = this.rows;
        copy.cols = this.cols;
        copy.cellCount = this.cellCount;
        return copy;
    }
}

export function canPlaceShapeOnGrid(grid, shape, row, col) {
    if (!shape || !shape.form) return false;
    const h = shape.rows;
    const w = shape.cols;

    if (row < 0 || col < 0 || row + h > 8 || col + w > 8) {
        return false;
    }

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            if (shape.form[r][c] && grid[row + r][col + c]) {
                return false;
            }
        }
    }
    return true;
}

export function simulatePlacementOnGrid(grid, shape, row, col) {
    const newGrid = grid.map(r => [...r]);
    const h = shape.rows;
    const w = shape.cols;

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            if (shape.form[r][c]) {
                newGrid[row + r][col + c] = 1;
            }
        }
    }

    const rowsToClear = [];
    for (let r = 0; r < 8; r++) {
        if (newGrid[r].every(cell => cell !== 0)) {
            rowsToClear.push(r);
        }
    }

    const colsToClear = [];
    for (let c = 0; c < 8; c++) {
        let full = true;
        for (let r = 0; r < 8; r++) {
            if (newGrid[r][c] === 0) {
                full = false;
                break;
            }
        }
        if (full) colsToClear.push(c);
    }

    for (const r of rowsToClear) {
        for (let c = 0; c < 8; c++) newGrid[r][c] = 0;
    }
    for (const c of colsToClear) {
        for (let r = 0; r < 8; r++) newGrid[r][c] = 0;
    }

    return {
        grid: newGrid,
        linesCleared: rowsToClear.length + colsToClear.length,
        rowsCleared: rowsToClear,
        colsCleared: colsToClear
    };
}

function sampleFromClass(classKey) {
    const items = SHAPE_CLASSES[classKey];
    const item = items[Math.floor(Math.random() * items.length)];

    if (item.formIdx === -1) {
        return new Shape(-1);
    }

    const formIdx = item.formIdx;
    const variantsCount = FORMS[formIdx].length;
    const varIdx = item.varIdx !== null ? item.varIdx : Math.floor(Math.random() * variantsCount);

    return new Shape([formIdx, varIdx]);
}

function sampleWeightedShape(w1, w2, w3) {
    const totalWeight = w1 + w2 + w3;
    const rand = Math.random() * totalWeight;

    if (rand < w1) {
        return sampleFromClass('CLASS_1');
    } else if (rand < w1 + w2) {
        return sampleFromClass('CLASS_2');
    } else {
        return sampleFromClass('CLASS_3');
    }
}

export function verifySolvability(grid, pieces) {
    const permIndices = [
        [0, 1, 2], [0, 2, 1],
        [1, 0, 2], [1, 2, 0],
        [2, 0, 1], [2, 1, 0]
    ];

    for (const perm of permIndices) {
        if (canPlacePermutation(grid, pieces, perm, 0)) {
            return true;
        }
    }
    return false;
}

function canPlacePermutation(currentGrid, pieces, perm, step) {
    if (step === perm.length) return true;

    const piece = pieces[perm[step]];
    for (let r = 0; r <= 8 - piece.rows; r++) {
        for (let c = 0; c <= 8 - piece.cols; c++) {
            if (canPlaceShapeOnGrid(currentGrid, piece, r, c)) {
                const nextState = simulatePlacementOnGrid(currentGrid, piece, r, c);
                if (canPlacePermutation(nextState.grid, pieces, perm, step + 1)) {
                    return true;
                }
            }
        }
    }
    return false;
}

export function generateValidShapes(grid, comboStreak = 0, mode = 'classic') {
    let filledCells = 0;
    let highestRow = 8;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c] !== 0) {
                filledCells++;
                if (r < highestRow) highestRow = r;
            }
        }
    }
    const fillRatio = filledCells / 64.0;

    let w1 = 10;
    let w2 = 5;
    let w3 = 3;

    if (mode === 'drop') {
        // Drop mode: gravity stack requires compact gap-filling shapes and line-sweeping shapes
        if (highestRow <= 2) {
            w1 = 30; w2 = 6; w3 = 0; // Emergency ceiling clearance
        } else if (highestRow <= 4) {
            w1 = 20; w2 = 8; w3 = 1;
        } else {
            w1 = 14; w2 = 9; w3 = 2;
        }
    } else if (fillRatio > 0.75 || highestRow <= 2) {
        w1 = 28;
        w2 = 6;
        w3 = 1;
    } else if (comboStreak >= 4) {
        w1 = 6;
        w2 = 7;
        w3 = 8;
    } else if (fillRatio > 0.55 || highestRow <= 4) {
        w1 = 16;
        w2 = 6;
        w3 = 2;
    }

    const MAX_ATTEMPTS = 50;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidatePieces = [
            sampleWeightedShape(w1, w2, w3),
            sampleWeightedShape(w1, w2, w3),
            sampleWeightedShape(w1, w2, w3)
        ];

        // In Drop mode when ceiling is high, don't generate shapes taller than the open headroom
        if (mode === 'drop' && highestRow <= 3) {
            if (candidatePieces.some(p => p.rows > highestRow)) {
                continue;
            }
        }

        if (verifySolvability(grid, candidatePieces)) {
            return candidatePieces;
        }
    }

    const safePieces = [];
    let simGrid = grid.map(r => [...r]);

    for (let i = 0; i < 3; i++) {
        let placed = false;
        for (let t = 0; t < 20; t++) {
            const piece = sampleFromClass('CLASS_1');
            for (let r = 0; r <= 8 - piece.rows; r++) {
                for (let c = 0; c <= 8 - piece.cols; c++) {
                    if (canPlaceShapeOnGrid(simGrid, piece, r, c)) {
                        safePieces.push(piece);
                        simGrid = simulatePlacementOnGrid(simGrid, piece, r, c).grid;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }
            if (placed) break;
        }

        if (!placed) {
            const dot = new Shape(-1);
            safePieces.push(dot);
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (canPlaceShapeOnGrid(simGrid, dot, r, c)) {
                        simGrid = simulatePlacementOnGrid(simGrid, dot, r, c).grid;
                        break;
                    }
                }
            }
        }
    }

    return safePieces;
}
