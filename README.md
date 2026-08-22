# Heuristic Grid-Space Optimization Prototype (Block-Ash)

Academic repository containing a grid-space allocation prototype using tree-search heuristics. This codebase implements grid-state simulation rules on an 8x8 matrix and evaluates search algorithms for cell coverage.

## Abstract

This project serves as a basic simulation framework for testing discrete placement heuristics. It includes a canvas-based grid visualizer and procedural sound feedback. The core objective is to analyze lookahead decision strategies in restricted environments.

## Features

- **Matrix Operations**: Simulates cell insertion, row/column validation, and state transformations.
- **Decision Engine**: Basic heuristic functions calculating lookahead score distributions based on cell density.
- **Audio Feedback**: Procedural sound generation via standard browser web audio contexts.
- **Input System**: Event handling for pointer coordinates and keyboard actions.

## Local Execution

To run the local server:
```bash
npm start
```
Default port: `3000`.

## License

This software is licensed under the GNU Affero General Public License v3 (AGPLv3). See the LICENSE file for details.
