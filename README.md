# Block-Ash: HTML5 Block Puzzle & Heuristic AI Solver

A high-performance HTML5 Canvas port of the block placement puzzle game mechanics, featuring procedural Web Audio effects and an integrated tree-search heuristic AI solver. Designed as a clean demonstration of frontend canvas rendering, multi-input event coordination, and heuristic-based search algorithms.

## Overview

This project implements the core gameplay mechanics of an 8x8 block puzzle game. The engine ensures that generated shape sets are always sequentially placeable on the board, preventing early artificial defeats. It includes an integrated lookahead solver that can either suggest optimal moves (Hint Mode) or play the game automatically (Autoplay Mode).

## Key Features

- **HTML5 Canvas Renderer**: Lightweight rendering loop supporting high-DPI scaling, beveled blocks, ghost placement previews, line-clear lasers, and custom theme layouts.
- **Heuristic AI Engine**: A JavaScript search algorithm evaluating board fitness based on line completion density, trapped cell counts, board roughness, and subsequent shape placement flexibility.
- **Procedural Sound Synthesizer**: Low-latency sounds generated dynamically via the browser's Web Audio API (ascending combo chord progressions, thuds, chimes) with local asset fallbacks.
- **Unified Multi-Input**: Supports responsive mobile/tablet touch drag-and-drop (with finger offset), mouse drag, keyboard control configurations, and classic click-to-place controls.
- **Local Server Setup**: Out-of-the-box static server script using native Node.js libraries to ensure instant local testing without external package installations.

## Project Structure

```
Block-Ash/
├── index.html       # Game view and controls interface
├── server.js        # Zero-dependency local Node.js server
├── package.json     # Project commands and metadata
├── css/
│   └── style.css    # Responsive theme styling and glassmorphic designs
├── js/
│   ├── app.js       # Master coordinator and game loop
│   ├── game.js      # Game state rules, combo formulas, and checks
│   ├── shapes.js    # 13 shape categories and solvable generator
│   ├── renderer.js  # Canvas rendering and hover states
│   ├── particles.js # Visual effects, bursts, and screen shakes
│   ├── audio.js     # Web Audio synthesizer and mute handling
│   ├── ai.js        # Lookahead heuristic solver
│   └── input.js     # Unified event listeners (mouse, touch, key)
└── assets/          # Local sound effects and typography resources
```

## Setup & Running

To run the game locally, you do not need to install any external dependencies:

1. Start the server:
   ```bash
   npm start
   ```
2. Open `http://localhost:3000` in your web browser.

## License

This project is licensed under the MIT License.
