/**
 * Block Blast - Comprehensive Skin & Visual FX System
 * Supports 10 distinct, vibrant themes featuring:
 * - Solid atmospheric background colors
 * - Custom tailored shape & block palettes
 * - Custom particle FX (shapes, spark colors, shockwave laser colors)
 */

export const SKINS = {
    'classic-crimson': {
        id: 'classic-crimson',
        name: 'Classic Crimson',
        description: 'Authentic arcade puzzle feel with warm amber blocks',
        bg: '#7B1113',              // Solid deep burgundy
        boardBg: '#4A080A',         // Solid dark burgundy board
        cellEmpty: '#360608',       // Dark empty grid slot
        dockBg: '#4A080A',          // Dock slot background
        dockBorder: '#630D10',      // Dock slot border
        hudBadgeBg: 'rgba(0, 0, 0, 0.35)',
        textHighlight: '#FDE047',
        scoreColor: '#A3E635',
        scoreShadow: '#15803D',
        diamondColor: '#F59E0B',
        palette: [
            { name: 'amber-1', hex: '#F59E0B', light: '#FDE68A', dark: '#B45309', rgb: [245, 158, 11] },
            { name: 'amber-2', hex: '#D97706', light: '#FCD34D', dark: '#92400E', rgb: [217, 119, 6] },
            { name: 'amber-3', hex: '#EA580C', light: '#FDBA74', dark: '#9A3412', rgb: [234, 88, 12] },
            { name: 'amber-gold', hex: '#EAB308', light: '#FEF08A', dark: '#A16207', rgb: [234, 179, 8] },
            { name: 'amber-warm', hex: '#F97316', light: '#FED7AA', dark: '#C2410C', rgb: [249, 115, 22] }
        ],
        effects: {
            particleShape: 'square',
            particleColors: ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
            waveColor: 'rgba(254, 240, 138, 0.95)',
            floatingTextColor: '#FDE047',
            glowColor: 'rgba(245, 158, 11, 0.6)'
        }
    },
    'deep-slate': {
        id: 'deep-slate',
        name: 'Deep Slate Navy',
        description: 'Polished dark slate with vibrant rainbow jewel blocks',
        bg: '#0F172A',
        boardBg: '#1E293B',
        cellEmpty: '#334155',
        dockBg: '#1E293B',
        dockBorder: '#334155',
        hudBadgeBg: 'rgba(0, 0, 0, 0.35)',
        textHighlight: '#60A5FA',
        scoreColor: '#38BDF8',
        scoreShadow: '#0369A1',
        diamondColor: '#3B82F6',
        palette: [
            { name: 'yellow', hex: '#FBBF24', light: '#FDE68A', dark: '#D97706', rgb: [251, 191, 36] },
            { name: 'orange', hex: '#F97316', light: '#FDBA74', dark: '#EA580C', rgb: [249, 115, 22] },
            { name: 'red',    hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626', rgb: [239, 68, 68] },
            { name: 'green',  hex: '#10B981', light: '#6EE7B7', dark: '#059669', rgb: [16, 185, 129] },
            { name: 'cyan',   hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2', rgb: [6, 182, 212] },
            { name: 'blue',   hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB', rgb: [59, 130, 246] },
            { name: 'purple', hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED', rgb: [139, 92, 246] },
            { name: 'pink',   hex: '#EC4899', light: '#F472B6', dark: '#DB2777', rgb: [236, 72, 153] }
        ],
        effects: {
            particleShape: 'circle',
            particleColors: ['#60A5FA', '#38BDF8', '#818CF8', '#FFFFFF'],
            waveColor: 'rgba(255, 255, 255, 0.95)',
            floatingTextColor: '#FDE047',
            glowColor: 'rgba(59, 130, 246, 0.6)'
        }
    },
    'cyber-neon': {
        id: 'cyber-neon',
        name: 'Cyber Neon',
        description: 'Futuristic laser grid with high-voltage neon blocks',
        bg: '#080C14',
        boardBg: '#0F172A',
        cellEmpty: '#1E293B',
        dockBg: '#0F172A',
        dockBorder: '#06B6D4',
        hudBadgeBg: 'rgba(6, 182, 212, 0.15)',
        textHighlight: '#06B6D4',
        scoreColor: '#22D3EE',
        scoreShadow: '#0891B2',
        diamondColor: '#06B6D4',
        palette: [
            { name: 'neon-cyan', hex: '#00F0FF', light: '#A5F3FC', dark: '#0891B2', rgb: [0, 240, 255] },
            { name: 'neon-pink', hex: '#FF007F', light: '#F472B6', dark: '#BE185D', rgb: [255, 0, 127] },
            { name: 'neon-lime', hex: '#39FF14', light: '#BEF264', dark: '#4D7C0F', rgb: [57, 255, 20] },
            { name: 'neon-purple', hex: '#BD00FF', light: '#E9D5FF', dark: '#7E22CE', rgb: [189, 0, 255] },
            { name: 'neon-yellow', hex: '#FFE600', light: '#FEF08A', dark: '#CA8A04', rgb: [255, 230, 0] }
        ],
        effects: {
            particleShape: 'diamond',
            particleColors: ['#00F0FF', '#FF007F', '#39FF14', '#FFE600'],
            waveColor: 'rgba(0, 240, 255, 0.95)',
            floatingTextColor: '#00F0FF',
            glowColor: 'rgba(0, 240, 255, 0.7)'
        }
    },
    'emerald-jade': {
        id: 'emerald-jade',
        name: 'Emerald Jade',
        description: 'Lush soothing forest jade with glistening gem blocks',
        bg: '#064E3B',
        boardBg: '#022C22',
        cellEmpty: '#065F46',
        dockBg: '#022C22',
        dockBorder: '#047857',
        hudBadgeBg: 'rgba(16, 185, 129, 0.2)',
        textHighlight: '#34D399',
        scoreColor: '#6EE7B7',
        scoreShadow: '#047857',
        diamondColor: '#10B981',
        palette: [
            { name: 'emerald-1', hex: '#10B981', light: '#6EE7B7', dark: '#047857', rgb: [16, 185, 129] },
            { name: 'emerald-2', hex: '#059669', light: '#34D399', dark: '#064E3B', rgb: [5, 150, 105] },
            { name: 'jade-lime', hex: '#84CC16', light: '#BEF264', dark: '#4D7C0F', rgb: [132, 204, 22] },
            { name: 'jade-mint', hex: '#14B8A6', light: '#5EEAD4', dark: '#0F766E', rgb: [20, 184, 166] },
            { name: 'jade-gold', hex: '#EAB308', light: '#FDE047', dark: '#A16207', rgb: [234, 179, 8] }
        ],
        effects: {
            particleShape: 'star',
            particleColors: ['#6EE7B7', '#34D399', '#FDE047', '#FFFFFF'],
            waveColor: 'rgba(110, 231, 183, 0.95)',
            floatingTextColor: '#A7F3D0',
            glowColor: 'rgba(16, 185, 129, 0.65)'
        }
    },
    'sunset-amber': {
        id: 'sunset-amber',
        name: 'Solar Sunset',
        description: 'Fiery solar radiance with warm terracotta & sunburst blocks',
        bg: '#431407',
        boardBg: '#270A03',
        cellEmpty: '#7C2D12',
        dockBg: '#270A03',
        dockBorder: '#9A3412',
        hudBadgeBg: 'rgba(249, 115, 22, 0.2)',
        textHighlight: '#FB923C',
        scoreColor: '#FDBA74',
        scoreShadow: '#C2410C',
        diamondColor: '#F97316',
        palette: [
            { name: 'solar-orange', hex: '#F97316', light: '#FED7AA', dark: '#C2410C', rgb: [249, 115, 22] },
            { name: 'solar-gold', hex: '#F59E0B', light: '#FDE68A', dark: '#B45309', rgb: [245, 158, 11] },
            { name: 'solar-ruby', hex: '#EF4444', light: '#FCA5A5', dark: '#B91C1C', rgb: [239, 68, 68] },
            { name: 'solar-amber', hex: '#D97706', light: '#FCD34D', dark: '#78350F', rgb: [217, 119, 6] },
            { name: 'solar-rose', hex: '#F43F5E', light: '#FDA4AF', dark: '#BE123C', rgb: [244, 63, 94] }
        ],
        effects: {
            particleShape: 'circle',
            particleColors: ['#FED7AA', '#F97316', '#F59E0B', '#EF4444'],
            waveColor: 'rgba(253, 186, 116, 0.95)',
            floatingTextColor: '#FDBA74',
            glowColor: 'rgba(249, 115, 22, 0.7)'
        }
    },
    'royal-amethyst': {
        id: 'royal-amethyst',
        name: 'Royal Amethyst',
        description: 'Enchanting celestial violet with glowing crystal blocks',
        bg: '#2E1065',
        boardBg: '#1E0A45',
        cellEmpty: '#4C1D95',
        dockBg: '#1E0A45',
        dockBorder: '#6D28D9',
        hudBadgeBg: 'rgba(168, 85, 247, 0.2)',
        textHighlight: '#C084FC',
        scoreColor: '#E9D5FF',
        scoreShadow: '#7E22CE',
        diamondColor: '#A855F7',
        palette: [
            { name: 'purple-1', hex: '#A855F7', light: '#E9D5FF', dark: '#6B21A8', rgb: [168, 85, 247] },
            { name: 'purple-2', hex: '#8B5CF6', light: '#C4B5FD', dark: '#5B21B6', rgb: [139, 92, 246] },
            { name: 'magenta', hex: '#D946EF', light: '#F5D0FE', dark: '#86198F', rgb: [217, 70, 239] },
            { name: 'indigo', hex: '#6366F1', light: '#C7D2FE', dark: '#3730A3', rgb: [99, 102, 241] },
            { name: 'pink-gem', hex: '#EC4899', light: '#FBCFE8', dark: '#9D174D', rgb: [236, 72, 153] }
        ],
        effects: {
            particleShape: 'star',
            particleColors: ['#E9D5FF', '#C084FC', '#F472B6', '#FFFFFF'],
            waveColor: 'rgba(233, 213, 255, 0.95)',
            floatingTextColor: '#E9D5FF',
            glowColor: 'rgba(168, 85, 247, 0.7)'
        }
    },
    'frost-glacier': {
        id: 'frost-glacier',
        name: 'Frost Glacier',
        description: 'Crisp arctic ice crystal aesthetics with frosted blue blocks',
        bg: '#082F49',
        boardBg: '#031D30',
        cellEmpty: '#0C4A6E',
        dockBg: '#031D30',
        dockBorder: '#0284C7',
        hudBadgeBg: 'rgba(56, 189, 248, 0.2)',
        textHighlight: '#38BDF8',
        scoreColor: '#BAE6FD',
        scoreShadow: '#0284C7',
        diamondColor: '#0284C7',
        palette: [
            { name: 'ice-cyan', hex: '#0EA5E9', light: '#BAE6FD', dark: '#0369A1', rgb: [14, 165, 233] },
            { name: 'ice-blue', hex: '#38BDF8', light: '#E0F2FE', dark: '#0284C7', rgb: [56, 189, 248] },
            { name: 'frost-teal', hex: '#06B6D4', light: '#A5F3FC', dark: '#0E7490', rgb: [6, 182, 212] },
            { name: 'snow-white', hex: '#94A3B8', light: '#F1F5F9', dark: '#475569', rgb: [148, 163, 184] },
            { name: 'arctic-indigo', hex: '#6366F1', light: '#C7D2FE', dark: '#4338CA', rgb: [99, 102, 241] }
        ],
        effects: {
            particleShape: 'diamond',
            particleColors: ['#E0F2FE', '#BAE6FD', '#38BDF8', '#FFFFFF'],
            waveColor: 'rgba(186, 230, 253, 0.95)',
            floatingTextColor: '#BAE6FD',
            glowColor: 'rgba(56, 189, 248, 0.7)'
        }
    },
    'obsidian-magma': {
        id: 'obsidian-magma',
        name: 'Obsidian Magma',
        description: 'Deep volcanic charcoal with glowing molten lava blocks',
        bg: '#18181B',
        boardBg: '#09090B',
        cellEmpty: '#27272A',
        dockBg: '#09090B',
        dockBorder: '#DC2626',
        hudBadgeBg: 'rgba(239, 68, 68, 0.2)',
        textHighlight: '#F87171',
        scoreColor: '#FCA5A5',
        scoreShadow: '#991B1B',
        diamondColor: '#DC2626',
        palette: [
            { name: 'magma-orange', hex: '#EA580C', light: '#FDBA74', dark: '#9A3412', rgb: [234, 88, 12] },
            { name: 'lava-red', hex: '#DC2626', light: '#FCA5A5', dark: '#7F1D1D', rgb: [220, 38, 38] },
            { name: 'glow-yellow', hex: '#FBBF24', light: '#FEF08A', dark: '#B45309', rgb: [251, 191, 36] },
            { name: 'charcoal-ruby', hex: '#991B1B', light: '#F87171', dark: '#450A0A', rgb: [153, 27, 27] },
            { name: 'ash-slate', hex: '#52525B', light: '#A1A1AA', dark: '#27272A', rgb: [82, 82, 91] }
        ],
        effects: {
            particleShape: 'square',
            particleColors: ['#FEF08A', '#FDBA74', '#DC2626', '#EA580C'],
            waveColor: 'rgba(254, 202, 202, 0.95)',
            floatingTextColor: '#FCA5A5',
            glowColor: 'rgba(220, 38, 38, 0.7)'
        }
    },
    'pastel-candy': {
        id: 'pastel-candy',
        name: 'Pastel Candy',
        description: 'Sweet playful bakery palette with soft strawberry & mint blocks',
        bg: '#E2E8F0',
        boardBg: '#FFFFFF',
        cellEmpty: '#CBD5E1',
        dockBg: '#FFFFFF',
        dockBorder: '#94A3B8',
        hudBadgeBg: 'rgba(0, 0, 0, 0.1)',
        textHighlight: '#EC4899',
        scoreColor: '#DB2777',
        scoreShadow: '#9D174D',
        diamondColor: '#F472B6',
        palette: [
            { name: 'candy-pink', hex: '#F472B6', light: '#FDF2F8', dark: '#DB2777', rgb: [244, 114, 182] },
            { name: 'candy-mint', hex: '#34D399', light: '#ECFDF5', dark: '#059669', rgb: [52, 211, 153] },
            { name: 'candy-yellow', hex: '#FCD34D', light: '#FFFBEB', dark: '#D97706', rgb: [252, 211, 77] },
            { name: 'candy-sky', hex: '#60A5FA', light: '#EFF6FF', dark: '#2563EB', rgb: [96, 165, 250] },
            { name: 'candy-purple', hex: '#C084FC', light: '#FAF5FF', dark: '#9333EA', rgb: [192, 132, 252] }
        ],
        effects: {
            particleShape: 'circle',
            particleColors: ['#F472B6', '#34D399', '#FCD34D', '#60A5FA'],
            waveColor: 'rgba(244, 114, 182, 0.95)',
            floatingTextColor: '#DB2777',
            glowColor: 'rgba(244, 114, 182, 0.6)'
        }
    },
    'retro-arcade': {
        id: 'retro-arcade',
        name: 'Retro 8-Bit Arcade',
        description: 'Pure nostalgic arcade black with maximum contrast pixel blocks',
        bg: '#000000',
        boardBg: '#111111',
        cellEmpty: '#222222',
        dockBg: '#111111',
        dockBorder: '#444444',
        hudBadgeBg: 'rgba(255, 255, 255, 0.15)',
        textHighlight: '#FFE600',
        scoreColor: '#FFE600',
        scoreShadow: '#B45309',
        diamondColor: '#FFCC00',
        palette: [
            { name: 'retro-red', hex: '#FF0044', light: '#FFAAC0', dark: '#990022', rgb: [255, 0, 68] },
            { name: 'retro-yellow', hex: '#FFCC00', light: '#FFEE88', dark: '#AA8800', rgb: [255, 204, 0] },
            { name: 'retro-blue', hex: '#0077FF', light: '#99CCFF', dark: '#003399', rgb: [0, 119, 255] },
            { name: 'retro-green', hex: '#00DD55', light: '#99FFAA', dark: '#007722', rgb: [0, 221, 85] },
            { name: 'retro-orange', hex: '#FF6600', light: '#FFBB88', dark: '#993300', rgb: [255, 102, 0] }
        ],
        effects: {
            particleShape: 'square',
            particleColors: ['#FF0044', '#FFCC00', '#0077FF', '#00DD55'],
            waveColor: 'rgba(255, 204, 0, 0.95)',
            floatingTextColor: '#FFCC00',
            glowColor: 'rgba(255, 204, 0, 0.75)'
        }
    }
};

export class SkinManager {
    static STORAGE_KEY = 'blockblast_selected_skin';

    static getDefaultSkinId() {
        return 'classic-crimson';
    }

    static loadSelectedSkinId() {
        try {
            return localStorage.getItem(this.STORAGE_KEY) || this.getDefaultSkinId();
        } catch (e) {
            return this.getDefaultSkinId();
        }
    }

    static saveSelectedSkinId(skinId) {
        try {
            localStorage.setItem(this.STORAGE_KEY, skinId);
        } catch (e) {}
    }

    static getSkin(skinId) {
        return SKINS[skinId] || SKINS[this.getDefaultSkinId()];
    }

    static getAllSkins() {
        return Object.values(SKINS);
    }
}
