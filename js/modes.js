/**
 * Block Blast - Game Modes & Progression Engine
 * Supports:
 * 1. Classic Mode (Endless high-score spatial survival)
 * 2. Adventure Mode (Curated Stage Map with Gem, Puzzle, and Star collection goals)
 * 3. Drop Mode (Inverted rising block stacks pushing from bottom)
 */

export const GAME_MODES = {
    CLASSIC: 'classic',
    ADVENTURE: 'adventure',
    DROP: 'drop'
};

export const ADVENTURE_STAGES = [
    {
        id: 1,
        name: 'Stage 1: Emerald Gateway',
        description: 'Collect 4 Emerald Gems to unlock the path.',
        movesLimit: 16,
        goals: { gems: 4 },
        initialBlocks: [
            { row: 3, col: 3, color: { hex: '#10B981', light: '#6EE7B7', dark: '#059669' }, item: 'gem' },
            { row: 3, col: 4, color: { hex: '#10B981', light: '#6EE7B7', dark: '#059669' }, item: 'gem' },
            { row: 4, col: 3, color: { hex: '#10B981', light: '#6EE7B7', dark: '#059669' }, item: 'gem' },
            { row: 4, col: 4, color: { hex: '#10B981', light: '#6EE7B7', dark: '#059669' }, item: 'gem' }
        ]
    },
    {
        id: 2,
        name: 'Stage 2: Ruby Cross',
        description: 'Collect 6 Ruby Gems embedded in the cross formation.',
        movesLimit: 18,
        goals: { gems: 6 },
        initialBlocks: [
            { row: 2, col: 3, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' },
            { row: 3, col: 3, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' },
            { row: 4, col: 3, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' },
            { row: 3, col: 2, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' },
            { row: 3, col: 4, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' },
            { row: 3, col: 5, color: { hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626' }, item: 'gem' }
        ]
    },
    {
        id: 3,
        name: 'Stage 3: Puzzle Relic',
        description: 'Recover 3 ancient Puzzle Pieces before running out of moves.',
        movesLimit: 20,
        goals: { puzzles: 3 },
        initialBlocks: [
            { row: 1, col: 2, color: { hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' }, item: 'puzzle' },
            { row: 4, col: 5, color: { hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' }, item: 'puzzle' },
            { row: 6, col: 1, color: { hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED' }, item: 'puzzle' },
            { row: 1, col: 1, color: { hex: '#334155' } },
            { row: 6, col: 2, color: { hex: '#334155' } }
        ]
    },
    {
        id: 4,
        name: 'Stage 4: Sapphire Vault',
        description: 'Collect 8 Sapphire Gems guarded by stone pillars.',
        movesLimit: 22,
        goals: { gems: 8 },
        initialBlocks: [
            { row: 2, col: 2, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 2, col: 5, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 5, col: 2, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 5, col: 5, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 3, col: 2, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 3, col: 5, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 4, col: 2, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' },
            { row: 4, col: 5, color: { hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2' }, item: 'gem' }
        ]
    },
    {
        id: 5,
        name: 'Stage 5: Star Sanctuary',
        description: 'Master stage: Collect 4 Golden Stars within 20 moves.',
        movesLimit: 20,
        goals: { stars: 4 },
        initialBlocks: [
            { row: 1, col: 1, color: { hex: '#FBBF24', light: '#FDE68A', dark: '#D97706' }, item: 'star' },
            { row: 1, col: 6, color: { hex: '#FBBF24', light: '#FDE68A', dark: '#D97706' }, item: 'star' },
            { row: 6, col: 1, color: { hex: '#FBBF24', light: '#FDE68A', dark: '#D97706' }, item: 'star' },
            { row: 6, col: 6, color: { hex: '#FBBF24', light: '#FDE68A', dark: '#D97706' }, item: 'star' }
        ]
    },
    {
        id: 6,
        name: 'Stage 6: The Diamond Matrix',
        description: 'Collect 10 Mixed Gems from the dense core.',
        movesLimit: 24,
        goals: { gems: 10 },
        initialBlocks: [
            { row: 2, col: 3, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 2, col: 4, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 3, col: 2, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 3, col: 5, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 4, col: 2, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 4, col: 5, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 5, col: 3, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 5, col: 4, color: { hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB' }, item: 'gem' },
            { row: 3, col: 3, color: { hex: '#F97316', light: '#FDBA74', dark: '#EA580C' }, item: 'gem' },
            { row: 4, col: 4, color: { hex: '#F97316', light: '#FDBA74', dark: '#EA580C' }, item: 'gem' }
        ]
    }
];

export class ModeManager {
    static STORAGE_KEY_ADVENTURE = 'blockblast_adventure_progress';

    static loadAdventureProgress() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY_ADVENTURE);
            if (raw) return JSON.parse(raw);
        } catch (e) {}

        return {
            unlockedStage: 1,
            stageScores: {}, // stageId -> { stars: 3, highScore: 1200 }
            totalStars: 0
        };
    }

    static saveStageVictory(stageId, starsEarned, score) {
        const progress = this.loadAdventureProgress();
        const prev = progress.stageScores[stageId] || { stars: 0, highScore: 0 };

        const newStars = Math.max(prev.stars, starsEarned);
        const newScore = Math.max(prev.highScore, score);

        progress.stageScores[stageId] = { stars: newStars, highScore: newScore };
        progress.unlockedStage = Math.max(progress.unlockedStage, stageId + 1);

        // Recalculate total stars
        let total = 0;
        for (const s of Object.values(progress.stageScores)) {
            total += (s.stars || 0);
        }
        progress.totalStars = total;

        try {
            localStorage.setItem(this.STORAGE_KEY_ADVENTURE, JSON.stringify(progress));
        } catch (e) {}

        return progress;
    }

    static getStage(stageId) {
        const stage = ADVENTURE_STAGES.find(s => s.id === stageId);
        if (stage) return stage;

        // Procedurally generate stage if beyond predefined catalog
        return {
            id: stageId,
            name: `Stage ${stageId}: Master Realm`,
            description: `Collect ${Math.min(16, 6 + stageId)} Gems across the grid.`,
            movesLimit: Math.max(15, 25 - Math.floor(stageId / 2)),
            goals: { gems: Math.min(16, 6 + stageId) },
            initialBlocks: [
                { row: 2, col: 2, color: { hex: '#10B981', light: '#6EE7B7' }, item: 'gem' },
                { row: 2, col: 5, color: { hex: '#10B981', light: '#6EE7B7' }, item: 'gem' },
                { row: 5, col: 2, color: { hex: '#10B981', light: '#6EE7B7' }, item: 'gem' },
                { row: 5, col: 5, color: { hex: '#10B981', light: '#6EE7B7' }, item: 'gem' }
            ]
        };
    }
}
