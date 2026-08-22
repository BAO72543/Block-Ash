/**
 * Block Blast - Shape Definitions, Semantic Color Mapping, DDA Spawner & Solvability Engine
 * Implements Saturated Color Palette:
 * - Square / Block Shapes (2x2, 3x3): Ruby Red (#FF3B30)
 * - Line Shapes (1x2, 1x3, 1x4, 1x5): Cobalt Blue (#007AFF)
 * - Corner / L Shapes (3x3 L, 2x3 L, 2x2 corner L, 3x2): Emerald Green (#34C759)
 * - T / Step Shapes (T, Z, S): Canary Yellow (#FFCC00)
 * - Special / Dots (1x1): Vivid Magenta (#AF52DE) / Gold (#FFD700)
 */

export const SEMANTIC_PALETTE = {
    RUBY_RED:       { name: 'ruby-red',       hex: '#FF3B30', light: '#FF6961', dark: '#C92A2A', shadow: '#961919', rgb: [255, 59, 48] },
    COBALT_BLUE:    { name: 'cobalt-blue',    hex: '#007AFF', light: '#5AC8FA', dark: '#0051A8', shadow: '#003975', rgb: [0, 122, 255] },
    EMERALD_GREEN:  { name: 'emerald-green',  hex: '#34C759', light: '#62E484', dark: '#248A3D', shadow: '#175E28', rgb: [52, 199, 89] },
    CANARY_YELLOW:  { name: 'canary-yellow',  hex: '#FFCC00', light: '#FFE066', dark: '#D4A000', shadow: '#997300', rgb: [255, 204, 0] },
    VIVID_MAGENTA:  { name: 'vivid-magenta',  hex: '#AF52DE', light: '#D47AFF', dark: '#7825A8', shadow: '#511475', rgb: [175, 82, 222] },
    ROYAL_GOLD:     { name: 'royal-gold',     hex: '#FFD700', light: '#FFE44D', dark: '#C6A700', shadow: '#8C7600', rgb: [255, 215, 0] }
};

export const SHAPE_COLORS = Object.values(SEMANTIC_PALETTE);

export const FORMS = [
    // 0: 2x2 square (Class 1) -> Ruby Red
    [
        [[1, 1], [1, 1]]
    ],
    // 1: 3x2 rectangle (Class 2) -> Emerald Green
    [
        [[1, 1, 1], [1, 1, 1]],
        [[1, 1], [1, 1], [1, 1]]
    ],
    // 2: 3x3 square (Class 3) -> Ruby Red
    [
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    ],
    // 3: 3x3 L shape (Class 3) -> Emerald Green
    [
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
        [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [0, 0, 1], [1, 1, 1]]
    ],
    // 4: 2x3 L shape (Class 2) -> Emerald Green
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
    // 5: Z shape (Class 3) -> Canary Yellow
    [
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 0], [0, 1, 1]],
        [[1, 0], [1, 1], [0, 1]],
        [[0, 1], [1, 1], [1, 0]]
    ],
    // 6: T shape (Class 2) -> Canary Yellow
    [
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0], [1, 1], [1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[0, 1], [1, 1], [0, 1]]
    ],
    // 7: 2x1 rectangle (Class 1) -> Cobalt Blue
    [
        [[1, 1]],
        [[1], [1]]
    ],
    // 8: 3x1 rectangle (Class 1) -> Cobalt Blue
    [
        [[1, 1, 1]],
        [[1], [1], [1]]
    ],
    // 9: S shape (Class 3) -> Canary Yellow
    [
        [[1, 0], [1, 1]],
        [[1, 1], [0, 1]],
        [[1, 1], [1, 0]],
        [[0, 1], [1, 1]]
    ],
    // 10: 4x1 rectangle (Class 2) -> Cobalt Blue
    [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]]
    ],
    // 11: 5x1 rectangle (Class 3) -> Cobalt Blue
    [
        [[1, 1, 1, 1, 1]],
        [[1], [1], [1], [1], [1]]
    ],
    // 12: 2x2 L / corner shape (Class 2) -> Emerald Green
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

/**
 * Assign saturated semantic color based on shape category:
 * - Square / Block Shapes (2x2, 3x3): Ruby Red
 * - Line Shapes (1x2, 1x3, 1x4, 1x5): Cobalt Blue
 * - Corner / L Shapes (3x3 L, 2x3 L, 2x2 corner L, 3x2): Emerald Green
 * - T / Step Shapes (T, Z, S): Canary Yellow
 * - Special Items / 1x1 Dots: Vivid Magenta / Gold
 */
export function getSemanticColorForShape(formIdx) {
    if (formIdx === 0 || formIdx === 2) {
        return SEMANTIC_PALETTE.RUBY_RED;
    }
    if (formIdx === 7 || formIdx === 8 || formIdx === 10 || formIdx === 11) {
        return SEMANTIC_PALETTE.COBALT_BLUE;
    }
    if (formIdx === 3 || formIdx === 4 || formIdx === 12 || formIdx === 1) {
        return SEMANTIC_PALETTE.EMERALD_GREEN;
    }
    if (formIdx === 6 || formIdx === 5 || formIdx === 9) {
        return SEMANTIC_PALETTE.CANARY_YELLOW;
    }
    if (formIdx === -1) {
        return Math.random() > 0.3 ? SEMANTIC_PALETTE.VIVID_MAGENTA : SEMANTIC_PALETTE.ROYAL_GOLD;
    }
    return SEMANTIC_PALETTE.COBALT_BLUE;
}

export class Shape {
    constructor(formData = null, color = null) {
        this.id = Math.random().toString(36).substring(2, 9);
        if (formData === -1 || formData === null) {
            this.form = [[1]];
            this.formIndex = -1;
            this.variantIndex = 0;
        } else if (Array.isArray(formData)) {
            const [formIdx, varIdx] = formData;
            if (formIdx === -1) {
                this.form = [[1]];
                this.formIndex = -1;
                this.variantIndex = 0;
            } else if (FORMS[formIdx] && FORMS[formIdx][varIdx !== undefined ? varIdx : 0]) {
                const actualVar = varIdx !== undefined ? varIdx : 0;
                this.form = FORMS[formIdx][actualVar].map(row => [...row]);
                this.formIndex = formIdx;
                this.variantIndex = actualVar;
            } else {
                this.form = [[1]];
                this.formIndex = -1;
                this.variantIndex = 0;
            }
        } else {
            this.form = [[1]];
            this.formIndex = -1;
            this.variantIndex = 0;
        }

        // Apply semantic saturated color according to shape geometry specification
        this.color = color || getSemanticColorForShape(this.formIndex);
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

/**
 * Check if a shape can be placed at target anchor on 8x8 matrix
 */
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

/**
 * Simulate placement and line clears on a copied grid
 */
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

export function generateValidShapes(grid, comboStreak = 0) {
    let filledCells = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (grid[r][c] !== 0) filledCells++;
        }
    }
    const fillRatio = filledCells / 64.0;

    let w1 = 10;
    let w2 = 5;
    let w3 = 3;

    if (fillRatio > 0.75) {
        w1 = 28;
        w2 = 6;
        w3 = 1;
    } else if (comboStreak >= 4) {
        w1 = 6;
        w2 = 7;
        w3 = 8;
    } else if (fillRatio > 0.55) {
        w1 = 16;
        w2 = 6;
        w3 = 2;
    }

    const MAX_ATTEMPTS = 40;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const candidatePieces = [
            sampleWeightedShape(w1, w2, w3),
            sampleWeightedShape(w1, w2, w3),
            sampleWeightedShape(w1, w2, w3)
        ];

        if (verifySolvability(grid, candidatePieces)) {
            return candidatePieces;
        }
    }

    const safePieces = [];
    let simGrid = grid.map(r => [...r]);

    for (let i = 0; i < 3; i++) {
        let placed = false;
        for (let t = 0; t < 15; t++) {
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
