/**
 * Block Blast - Unified Input Handler
 * Supports Touch Drag & Drop (with finger offset), Mouse Drag, Click-to-Place, and Keyboard shortcuts.
 */

export class InputHandler {
    constructor(canvas, renderer, gameState, onPlaceAction, onHintToggle, onAutoplayToggle, onAudioToggle, onRestart) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.gameState = gameState;
        this.onPlaceAction = onPlaceAction;
        this.onHintToggle = onHintToggle;
        this.onAutoplayToggle = onAutoplayToggle;
        this.onAudioToggle = onAudioToggle;
        this.onRestart = onRestart;

        this.keyboardCursor = { row: 3, col: 3 };
        this.isDragging = false;
        this.touchActive = false;

        this.initMouseEvents();
        this.initTouchEvents();
        this.initKeyboardEvents();
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.clientX ?? (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    initMouseEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState.gameOver) return;
            const pos = this.getCanvasPos(e);

            // Check if clicking a shape slot in the dock
            const slotIdx = this.renderer.getShapeSlotAt(pos.x, pos.y);
            if (slotIdx !== -1 && this.gameState.currentShapes[slotIdx]) {
                this.isDragging = true;
                this.renderer.draggingShapeIdx = slotIdx;
                this.renderer.selectedShapeIdx = slotIdx;
                this.renderer.dragPointer = pos;
                this.renderer.dragOffset = { x: 0, y: 0 };
                return;
            }

            // Check if clicking on the grid with an already selected shape
            if (this.renderer.selectedShapeIdx !== -1) {
                const cell = this.renderer.screenToGrid(pos.x, pos.y);
                if (cell) {
                    const shape = this.gameState.currentShapes[this.renderer.selectedShapeIdx];
                    if (shape) {
                        const targetRow = Math.max(0, Math.min(8 - shape.rows, cell.row - Math.floor(shape.rows / 2)));
                        const targetCol = Math.max(0, Math.min(8 - shape.cols, cell.col - Math.floor(shape.cols / 2)));
                        this.tryPlace(this.renderer.selectedShapeIdx, targetRow, targetCol);
                    }
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            const pos = this.getCanvasPos(e);
            if (this.isDragging && this.renderer.draggingShapeIdx !== -1) {
                this.renderer.dragPointer = pos;
            } else if (this.renderer.selectedShapeIdx !== -1) {
                this.renderer.hoverGridCell = this.renderer.screenToGrid(pos.x, pos.y);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;

            const shapeIdx = this.renderer.draggingShapeIdx;
            if (shapeIdx === -1) return;

            const shape = this.gameState.currentShapes[shapeIdx];
            if (shape) {
                const { cellSize, gap, x: bx, y: by } = this.renderer.boardMetrics;
                const shapePixelW = shape.cols * (cellSize + gap);
                const shapePixelH = shape.rows * (cellSize + gap);

                const originX = this.renderer.dragPointer.x - shapePixelW / 2;
                const originY = this.renderer.dragPointer.y - shapePixelH / 2;

                const col = Math.round((originX - bx - gap) / (cellSize + gap));
                const row = Math.round((originY - by - gap) / (cellSize + gap));

                const targetRow = Math.max(0, Math.min(8 - shape.rows, row));
                const targetCol = Math.max(0, Math.min(8 - shape.cols, col));

                const placed = this.tryPlace(shapeIdx, targetRow, targetCol);
                if (placed) {
                    this.renderer.selectedShapeIdx = -1;
                }
            }

            this.renderer.draggingShapeIdx = -1;
        });
    }

    initTouchEvents() {
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState.gameOver) return;
            const pos = this.getCanvasPos(e);
            const slotIdx = this.renderer.getShapeSlotAt(pos.x, pos.y);

            if (slotIdx !== -1 && this.gameState.currentShapes[slotIdx]) {
                e.preventDefault();
                this.isDragging = true;
                this.touchActive = true;
                this.renderer.draggingShapeIdx = slotIdx;
                this.renderer.selectedShapeIdx = slotIdx;
                this.renderer.dragPointer = pos;
                // Offset shape upwards so player's finger doesn't cover the piece
                this.renderer.dragOffset = { x: 0, y: 55 };

                if (navigator.vibrate) navigator.vibrate(8);
                return;
            }

            if (this.renderer.selectedShapeIdx !== -1) {
                const cell = this.renderer.screenToGrid(pos.x, pos.y);
                if (cell) {
                    e.preventDefault();
                    const shape = this.gameState.currentShapes[this.renderer.selectedShapeIdx];
                    if (shape) {
                        const targetRow = Math.max(0, Math.min(8 - shape.rows, cell.row - Math.floor(shape.rows / 2)));
                        const targetCol = Math.max(0, Math.min(8 - shape.cols, cell.col - Math.floor(shape.cols / 2)));
                        this.tryPlace(this.renderer.selectedShapeIdx, targetRow, targetCol);
                    }
                }
            }
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!this.isDragging || this.renderer.draggingShapeIdx === -1) return;
            e.preventDefault();
            const pos = this.getCanvasPos(e);
            this.renderer.dragPointer = pos;
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.touchActive = false;

            const shapeIdx = this.renderer.draggingShapeIdx;
            if (shapeIdx === -1) return;

            const shape = this.gameState.currentShapes[shapeIdx];
            if (shape) {
                const { cellSize, gap, x: bx, y: by } = this.renderer.boardMetrics;
                const shapePixelW = shape.cols * (cellSize + gap);
                const shapePixelH = shape.rows * (cellSize + gap);

                const originX = this.renderer.dragPointer.x - shapePixelW / 2;
                const originY = this.renderer.dragPointer.y - shapePixelH / 2 - this.renderer.dragOffset.y;

                const col = Math.round((originX - bx - gap) / (cellSize + gap));
                const row = Math.round((originY - by - gap) / (cellSize + gap));

                const targetRow = Math.max(0, Math.min(8 - shape.rows, row));
                const targetCol = Math.max(0, Math.min(8 - shape.cols, col));

                const placed = this.tryPlace(shapeIdx, targetRow, targetCol);
                if (placed) {
                    this.renderer.selectedShapeIdx = -1;
                }
            }

            this.renderer.draggingShapeIdx = -1;
        });

        window.addEventListener('touchcancel', () => {
            this.isDragging = false;
            this.renderer.draggingShapeIdx = -1;
        });
    }

    initKeyboardEvents() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toUpperCase();

            // Restart shortcut
            if ((key === ' ' || key === 'ENTER' || key === 'R') && this.gameState.gameOver) {
                e.preventDefault();
                if (this.onRestart) this.onRestart();
                return;
            }

            // Mute shortcut
            if (key === 'M') {
                if (this.onAudioToggle) this.onAudioToggle();
                return;
            }

            // AI Hint shortcut
            if (key === 'H') {
                if (this.onHintToggle) this.onHintToggle();
                return;
            }

            // AI Autoplay shortcut
            if (key === 'A') {
                if (this.onAutoplayToggle) this.onAutoplayToggle();
                return;
            }

            // Shape Selection: E, R, T or 1, 2, 3
            const shapeKeys = { 'E': 0, '1': 0, 'R': 1, '2': 1, 'T': 2, '3': 2 };
            if (key in shapeKeys) {
                const idx = shapeKeys[key];
                if (this.gameState.currentShapes[idx]) {
                    this.renderer.selectedShapeIdx = (this.renderer.selectedShapeIdx === idx) ? -1 : idx;
                    if (this.renderer.selectedShapeIdx !== -1) {
                        this.renderer.hoverGridCell = { ...this.keyboardCursor };
                    } else {
                        this.renderer.hoverGridCell = null;
                    }
                }
                return;
            }

            // Arrow Keys / WASD Navigation
            if (['ARROWUP', 'W', 'ARROWDOWN', 'S', 'ARROWLEFT', 'A', 'ARROWRIGHT', 'D'].includes(key)) {
                if (key === 'ARROWUP' || key === 'W') this.keyboardCursor.row = Math.max(0, this.keyboardCursor.row - 1);
                if (key === 'ARROWDOWN' || key === 'S') this.keyboardCursor.row = Math.min(7, this.keyboardCursor.row + 1);
                if (key === 'ARROWLEFT' || key === 'A') this.keyboardCursor.col = Math.max(0, this.keyboardCursor.col - 1);
                if (key === 'ARROWRIGHT' || key === 'D') this.keyboardCursor.col = Math.min(7, this.keyboardCursor.col + 1);

                if (this.renderer.selectedShapeIdx !== -1) {
                    this.renderer.hoverGridCell = { ...this.keyboardCursor };
                }
                return;
            }

            // Place shape with Space or Enter
            if ((key === ' ' || key === 'ENTER') && this.renderer.selectedShapeIdx !== -1) {
                e.preventDefault();
                const shape = this.gameState.currentShapes[this.renderer.selectedShapeIdx];
                if (shape) {
                    const targetRow = Math.max(0, Math.min(8 - shape.rows, this.keyboardCursor.row - Math.floor(shape.rows / 2)));
                    const targetCol = Math.max(0, Math.min(8 - shape.cols, this.keyboardCursor.col - Math.floor(shape.cols / 2)));
                    const placed = this.tryPlace(this.renderer.selectedShapeIdx, targetRow, targetCol);
                    if (placed) {
                        this.renderer.selectedShapeIdx = -1;
                        this.renderer.hoverGridCell = null;
                    }
                }
                return;
            }

            // Deselect / Escape
            if (key === 'ESCAPE') {
                this.renderer.selectedShapeIdx = -1;
                this.renderer.hoverGridCell = null;
                this.renderer.aiHint = null;
            }
        });
    }

    tryPlace(shapeIdx, row, col) {
        if (this.onPlaceAction) {
            return this.onPlaceAction(shapeIdx, row, col);
        }
        return false;
    }
}
