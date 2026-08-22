/**
 * Block Blast - Shape Definitions & Generation Logic
 * Exact replica of the 13 shape categories and solvability generator from game_state.py
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

export const FORMS = [
    // 0: 2x2 square
    [
        [[1, 1], [1, 1]]
    ],
    // 1: 3x2 rectangle (2 variants)
    [
        [[1, 1, 1], [1, 1, 1]],
        [[1, 1], [1, 1], [1, 1]]
    ],
    // 2: 3x3 square
    [
        [[1, 1, 1], [1, 1, 1], [1, 1, 1]]
    ],
    // 3: 3x3 L shape (4 variants)
    [
        [[1, 1, 1], [1, 0, 0], [1, 0, 0]],
        [[1, 1, 1], [0, 0, 1], [0, 0, 1]],
        [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
        [[0, 0, 1], [0, 0, 1], [1, 1, 1]]
    ],
    // 4: 2x3 L shape (8 variants)
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
    // 5: Z shape (4 variants)
    [
        [[0, 1, 1], [1, 1, 0]],
        [[1, 1, 0], [0, 1, 1]],
        [[1, 0], [1, 1], [0, 1]],
        [[0, 1], [1, 1], [1, 0]]
    ],
    // 6: T shape (4 variants)
    [
        [[0, 1, 0], [1, 1, 1]],
        [[1, 0], [1, 1], [1, 0]],
        [[1, 1, 1], [0, 1, 0]],
        [[0, 1], [1, 1], [0, 1]]
    ],
    // 7: 2x1 rectangle (2 variants)
    [
        [[1, 1]],
        [[1], [1]]
    ],
    // 8: 3x1 rectangle (2 variants)
    [
        [[1, 1, 1]],
        [[1], [1], [1]]
    ],
    // 9: S shape (4 variants)
    [
        [[1, 0], [1, 1]],
        [[1, 1], [0, 1]],
        [[1, 1], [1, 0]],
        [[0, 1], [1, 1]]
    ],
    // 10: 4x1 rectangle (2 variants)
    [
        [[1, 1, 1, 1]],
        [[1], [1], [1], [1]]
    ],
    // 11: 5x1 rectangle (2 variants)
    [
        [[1, 1, 1, 1, 1]],
        [[1], [1], [1], [1], [1]]
    ],
    // 12: 2x2 L / corner shape (4 variants)
    [
        [[1, 0], [1, 1]],
        [[0, 1], [1, 1]],
        [[1, 1], [1, 0]],
        [[1, 1], [0, 1]]
    ]
];

export class Shape {
    /**
     * @param {Array<number>|number|null} formData [formIndex, variantIndex] or -1 for 1x1
     * @param {Object} [color] Optional predefined color object
     */
    constructor(formData = null, color = null) {
        this.id = Math.random().toString(36).substring(2, 9);
        if (formData === -1 || formData === null) {
            this.form = [[1]];
            this.formIndex = -1;
            this.variantIndex = 0;
        } else if (Array.isArray(formData)) {
            const [formIdx, varIdx] = formData;
            if (FORMS[formIdx] && FORMS[formIdx][varIdx]) {
                this.form = FORMS[formIdx][varIdx].map(row => [...row]);
                this.formIndex = formIdx;
                this.variantIndex = varIdx;
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

        this.color = color || SHAPE_COLORS[Math.floor(Math.random() * SHAPE_COLORS.length)];
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
 * Check if a shape can be placed on a specific 8x8 grid
 */
export function canPlaceShapeOnGrid(grid, shape, row, col) {
    if (!shape || !shape.form) return false;
    const h = shape.form.length;
    const w = shape.form[0].length;

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
 * Simulate placing shape and clearing lines on a copied grid
 */
export function simulatePlacementOnGrid(grid, shape, row, col) {
    const newGrid = grid.map(r => [...r]);
    const h = shape.form.length;
    const w = shape.form[0].length;

    for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
            if (shape.form[r][c]) {
                newGrid[row + r][col + c] = 1;
            }
        }
    }

    // Rows to clear
    const rowsToClear = [];
    for (let r = 0; r < 8; r++) {
        if (newGrid[r].every(cell => cell !== 0)) {
            rowsToClear.push(r);
        }
    }

    // Cols to clear
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

/**
 * Greedily generates 3 shapes that are guaranteed to have at least one valid sequence
 * of placements on the current board, matching game_state.py
 */
export function generateValidShapes(grid) {
    const remaining = Array.from({ length: FORMS.length }, (_, i) => i);
    const nextShapes = [];
    let currentGrid = grid.map(row => [...row]);

    for (let s = 0; s < 3; s++) {
        let placed = false;
        // Shuffle remaining
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);

        for (const formIdx of shuffled) {
            const variantsCount = FORMS[formIdx].length;
            const varIndices = Array.from({ length: variantsCount }, (_, i) => i).sort(() => Math.random() - 0.5);

            for (const varIdx of varIndices) {
                const shape = new Shape([formIdx, varIdx]);
                // Test all spots
                for (let r = 0; r <= 8 - shape.rows; r++) {
                    for (let c = 0; c <= 8 - shape.cols; c++) {
                        if (canPlaceShapeOnGrid(currentGrid, shape, r, c)) {
                            nextShapes.push(shape);
                            currentGrid = simulatePlacementOnGrid(currentGrid, shape, r, c).grid;
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
                if (placed) break;
            }

            if (placed) {
                const idx = remaining.indexOf(formIdx);
                if (idx !== -1) remaining.splice(idx, 1);
                break;
            }
        }

        if (!placed) {
            // Fallback to 1x1 block
            const single = new Shape(-1);
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    if (canPlaceShapeOnGrid(currentGrid, single, r, c)) {
                        nextShapes.push(single);
                        currentGrid = simulatePlacementOnGrid(currentGrid, single, r, c).grid;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }
            if (!placed) {
                nextShapes.push(single);
            }
        }
    }

    return nextShapes;
}
