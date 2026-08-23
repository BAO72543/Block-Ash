/**
 * Block Blast - Modular 3-Section Customization System
 * Allows players to mix & match independently:
 * 1. Backgrounds (Solid Atmospheric Background Colors)
 * 2. Puzzle Palettes (Shape / Block Colors)
 * 3. Animation & Particle FX (Particle Shapes, Spark Colors, Shockwave Colors)
 */

export const BACKGROUND_SKINS = [
    {
        id: 'classic-crimson',
        name: 'Classic Crimson',
        desc: 'Deep rich burgundy arcade atmosphere',
        bg: '#7B1113',
        boardBg: '#4A080A',
        cellEmpty: '#360608',
        dockBg: '#4A080A',
        dockBorder: '#630D10',
        hudBadgeBg: 'rgba(0, 0, 0, 0.35)',
        textHighlight: '#FDE047',
        scoreColor: '#A3E635',
        diamondColor: '#F59E0B'
    },
    {
        id: 'deep-slate',
        name: 'Deep Slate Navy',
        desc: 'Clean sleek modern dark slate',
        bg: '#0F172A',
        boardBg: '#1E293B',
        cellEmpty: '#334155',
        dockBg: '#1E293B',
        dockBorder: '#334155',
        hudBadgeBg: 'rgba(0, 0, 0, 0.35)',
        textHighlight: '#60A5FA',
        scoreColor: '#38BDF8',
        diamondColor: '#3B82F6'
    },
    {
        id: 'cyber-obsidian',
        name: 'Cyber Obsidian',
        desc: 'Futuristic high-tech dark space',
        bg: '#080C14',
        boardBg: '#0F172A',
        cellEmpty: '#1E293B',
        dockBg: '#0F172A',
        dockBorder: '#06B6D4',
        hudBadgeBg: 'rgba(6, 182, 212, 0.15)',
        textHighlight: '#06B6D4',
        scoreColor: '#22D3EE',
        diamondColor: '#06B6D4'
    },
    {
        id: 'forest-jade',
        name: 'Emerald Forest',
        desc: 'Lush soothing deep forest green',
        bg: '#064E3B',
        boardBg: '#022C22',
        cellEmpty: '#065F46',
        dockBg: '#022C22',
        dockBorder: '#047857',
        hudBadgeBg: 'rgba(16, 185, 129, 0.2)',
        textHighlight: '#34D399',
        scoreColor: '#6EE7B7',
        diamondColor: '#10B981'
    },
    {
        id: 'solar-terracotta',
        name: 'Solar Terracotta',
        desc: 'Warm fiery terracotta backdrop',
        bg: '#431407',
        boardBg: '#270A03',
        cellEmpty: '#7C2D12',
        dockBg: '#270A03',
        dockBorder: '#9A3412',
        hudBadgeBg: 'rgba(249, 115, 22, 0.2)',
        textHighlight: '#FB923C',
        scoreColor: '#FDBA74',
        diamondColor: '#F97316'
    },
    {
        id: 'royal-indigo',
        name: 'Royal Amethyst',
        desc: 'Majestic celestial deep purple',
        bg: '#2E1065',
        boardBg: '#1E0A45',
        cellEmpty: '#4C1D95',
        dockBg: '#1E0A45',
        dockBorder: '#6D28D9',
        hudBadgeBg: 'rgba(168, 85, 247, 0.2)',
        textHighlight: '#C084FC',
        scoreColor: '#E9D5FF',
        diamondColor: '#A855F7'
    },
    {
        id: 'arctic-navy',
        name: 'Frost Glacier',
        desc: 'Crisp arctic midnight navy',
        bg: '#082F49',
        boardBg: '#031D30',
        cellEmpty: '#0C4A6E',
        dockBg: '#031D30',
        dockBorder: '#0284C7',
        hudBadgeBg: 'rgba(56, 189, 248, 0.2)',
        textHighlight: '#38BDF8',
        scoreColor: '#BAE6FD',
        diamondColor: '#0284C7'
    },
    {
        id: 'volcanic-charcoal',
        name: 'Volcanic Charcoal',
        desc: 'Deep smoldering volcanic stone',
        bg: '#18181B',
        boardBg: '#09090B',
        cellEmpty: '#27272A',
        dockBg: '#09090B',
        dockBorder: '#DC2626',
        hudBadgeBg: 'rgba(239, 68, 68, 0.2)',
        textHighlight: '#F87171',
        scoreColor: '#FCA5A5',
        diamondColor: '#DC2626'
    },
    {
        id: 'pastel-sky',
        name: 'Pastel Light',
        desc: 'Soft bright minimalist light gray',
        bg: '#E2E8F0',
        boardBg: '#FFFFFF',
        cellEmpty: '#CBD5E1',
        dockBg: '#FFFFFF',
        dockBorder: '#94A3B8',
        hudBadgeBg: 'rgba(0, 0, 0, 0.1)',
        textHighlight: '#EC4899',
        scoreColor: '#DB2777',
        diamondColor: '#F472B6'
    },
    {
        id: 'pure-black',
        name: 'Pure Arcade Black',
        desc: 'Classic high-contrast true black',
        bg: '#000000',
        boardBg: '#111111',
        cellEmpty: '#222222',
        dockBg: '#111111',
        dockBorder: '#444444',
        hudBadgeBg: 'rgba(255, 255, 255, 0.15)',
        textHighlight: '#FFE600',
        scoreColor: '#FFE600',
        diamondColor: '#FFCC00'
    },
    {
        id: 'espresso-wood',
        name: 'Espresso Teak',
        desc: 'Warm rustic roasted coffee dark wood',
        bg: '#26150B',
        boardBg: '#170B05',
        cellEmpty: '#3E2313',
        dockBg: '#170B05',
        dockBorder: '#5C341C',
        hudBadgeBg: 'rgba(0, 0, 0, 0.4)',
        textHighlight: '#FDE68A',
        scoreColor: '#F59E0B',
        diamondColor: '#D97706'
    },
    {
        id: 'ocean-abyss',
        name: 'Ocean Abyss',
        desc: 'Deep marine navy abyss',
        bg: '#05192D',
        boardBg: '#020D1A',
        cellEmpty: '#0B2A4A',
        dockBg: '#020D1A',
        dockBorder: '#0F4C81',
        hudBadgeBg: 'rgba(0, 0, 0, 0.35)',
        textHighlight: '#38BDF8',
        scoreColor: '#38BDF8',
        diamondColor: '#0284C7'
    }
];

export const PUZZLE_SKINS = [
    {
        id: 'amber-wood',
        name: 'Amber Wood & Gold',
        desc: 'Warm teak wood, honey & golden amber tones',
        palette: [
            { name: 'amber-1', hex: '#F59E0B', light: '#FDE68A', dark: '#B45309', rgb: [245, 158, 11] },
            { name: 'amber-2', hex: '#D97706', light: '#FCD34D', dark: '#92400E', rgb: [217, 119, 6] },
            { name: 'amber-3', hex: '#EA580C', light: '#FDBA74', dark: '#9A3412', rgb: [234, 88, 12] },
            { name: 'amber-gold', hex: '#EAB308', light: '#FEF08A', dark: '#A16207', rgb: [234, 179, 8] },
            { name: 'amber-warm', hex: '#F97316', light: '#FED7AA', dark: '#C2410C', rgb: [249, 115, 22] }
        ]
    },
    {
        id: 'rainbow-jewels',
        name: 'Rainbow Jewels',
        desc: 'Vibrant multi-colored gem blocks',
        palette: [
            { name: 'yellow', hex: '#FBBF24', light: '#FDE68A', dark: '#D97706', rgb: [251, 191, 36] },
            { name: 'orange', hex: '#F97316', light: '#FDBA74', dark: '#EA580C', rgb: [249, 115, 22] },
            { name: 'red',    hex: '#EF4444', light: '#FCA5A5', dark: '#DC2626', rgb: [239, 68, 68] },
            { name: 'green',  hex: '#10B981', light: '#6EE7B7', dark: '#059669', rgb: [16, 185, 129] },
            { name: 'cyan',   hex: '#06B6D4', light: '#67E8F9', dark: '#0891B2', rgb: [6, 182, 212] },
            { name: 'blue',   hex: '#3B82F6', light: '#93C5FD', dark: '#2563EB', rgb: [59, 130, 246] },
            { name: 'purple', hex: '#8B5CF6', light: '#C4B5FD', dark: '#7C3AED', rgb: [139, 92, 246] },
            { name: 'pink',   hex: '#EC4899', light: '#F472B6', dark: '#DB2777', rgb: [236, 72, 153] }
        ]
    },
    {
        id: 'cyber-neon',
        name: 'Cyber Neon Lights',
        desc: 'High-voltage electric cyber synthwave palette',
        palette: [
            { name: 'neon-cyan', hex: '#00F0FF', light: '#A5F3FC', dark: '#0891B2', rgb: [0, 240, 255] },
            { name: 'neon-pink', hex: '#FF007F', light: '#F472B6', dark: '#BE185D', rgb: [255, 0, 127] },
            { name: 'neon-lime', hex: '#39FF14', light: '#BEF264', dark: '#4D7C0F', rgb: [57, 255, 20] },
            { name: 'neon-purple', hex: '#BD00FF', light: '#E9D5FF', dark: '#7E22CE', rgb: [189, 0, 255] },
            { name: 'neon-yellow', hex: '#FFE600', light: '#FEF08A', dark: '#CA8A04', rgb: [255, 230, 0] }
        ]
    },
    {
        id: 'emerald-jade',
        name: 'Emerald Jade Gemstones',
        desc: 'Lush soothing emerald, mint, lime & jade',
        palette: [
            { name: 'emerald-1', hex: '#10B981', light: '#6EE7B7', dark: '#047857', rgb: [16, 185, 129] },
            { name: 'emerald-2', hex: '#059669', light: '#34D399', dark: '#064E3B', rgb: [5, 150, 105] },
            { name: 'jade-lime', hex: '#84CC16', light: '#BEF264', dark: '#4D7C0F', rgb: [132, 204, 22] },
            { name: 'jade-mint', hex: '#14B8A6', light: '#5EEAD4', dark: '#0F766E', rgb: [20, 184, 166] },
            { name: 'jade-gold', hex: '#EAB308', light: '#FDE047', dark: '#A16207', rgb: [234, 179, 8] }
        ]
    },
    {
        id: 'solar-sunset',
        name: 'Solar Flare & Sunset',
        desc: 'Tangerine orange, sunburst gold & crimson ruby',
        palette: [
            { name: 'solar-orange', hex: '#F97316', light: '#FED7AA', dark: '#C2410C', rgb: [249, 115, 22] },
            { name: 'solar-gold', hex: '#F59E0B', light: '#FDE68A', dark: '#B45309', rgb: [245, 158, 11] },
            { name: 'solar-ruby', hex: '#EF4444', light: '#FCA5A5', dark: '#B91C1C', rgb: [239, 68, 68] },
            { name: 'solar-amber', hex: '#D97706', light: '#FCD34D', dark: '#78350F', rgb: [217, 119, 6] },
            { name: 'solar-rose', hex: '#F43F5E', light: '#FDA4AF', dark: '#BE123C', rgb: [244, 63, 94] }
        ]
    },
    {
        id: 'royal-amethyst',
        name: 'Royal Amethyst Crystal',
        desc: 'Celestial lavender, violet, lilac & sapphire',
        palette: [
            { name: 'purple-1', hex: '#A855F7', light: '#E9D5FF', dark: '#6B21A8', rgb: [168, 85, 247] },
            { name: 'purple-2', hex: '#8B5CF6', light: '#C4B5FD', dark: '#5B21B6', rgb: [139, 92, 246] },
            { name: 'magenta', hex: '#D946EF', light: '#F5D0FE', dark: '#86198F', rgb: [217, 70, 239] },
            { name: 'indigo', hex: '#6366F1', light: '#C7D2FE', dark: '#3730A3', rgb: [99, 102, 241] },
            { name: 'pink-gem', hex: '#EC4899', light: '#FBCFE8', dark: '#9D174D', rgb: [236, 72, 153] }
        ]
    },
    {
        id: 'frost-glacier',
        name: 'Frost & Arctic Ice',
        desc: 'Frosted cyan, glacier blue & snow white',
        palette: [
            { name: 'ice-cyan', hex: '#0EA5E9', light: '#BAE6FD', dark: '#0369A1', rgb: [14, 165, 233] },
            { name: 'ice-blue', hex: '#38BDF8', light: '#E0F2FE', dark: '#0284C7', rgb: [56, 189, 248] },
            { name: 'frost-teal', hex: '#06B6D4', light: '#A5F3FC', dark: '#0E7490', rgb: [6, 182, 212] },
            { name: 'snow-white', hex: '#94A3B8', light: '#F1F5F9', dark: '#475569', rgb: [148, 163, 184] },
            { name: 'arctic-indigo', hex: '#6366F1', light: '#C7D2FE', dark: '#4338CA', rgb: [99, 102, 241] }
        ]
    },
    {
        id: 'molten-lava',
        name: 'Molten Magma Core',
        desc: 'Volcanic lava red, glowing magma & dark ash',
        palette: [
            { name: 'magma-orange', hex: '#EA580C', light: '#FDBA74', dark: '#9A3412', rgb: [234, 88, 12] },
            { name: 'lava-red', hex: '#DC2626', light: '#FCA5A5', dark: '#7F1D1D', rgb: [220, 38, 38] },
            { name: 'glow-yellow', hex: '#FBBF24', light: '#FEF08A', dark: '#B45309', rgb: [251, 191, 36] },
            { name: 'charcoal-ruby', hex: '#991B1B', light: '#F87171', dark: '#450A0A', rgb: [153, 27, 27] },
            { name: 'ash-slate', hex: '#52525B', light: '#A1A1AA', dark: '#27272A', rgb: [82, 82, 91] }
        ]
    },
    {
        id: 'pastel-candy',
        name: 'Sweet Pastel Bakery',
        desc: 'Strawberry pink, mint, buttercup & bubblegum',
        palette: [
            { name: 'candy-pink', hex: '#F472B6', light: '#FDF2F8', dark: '#DB2777', rgb: [244, 114, 182] },
            { name: 'candy-mint', hex: '#34D399', light: '#ECFDF5', dark: '#059669', rgb: [52, 211, 153] },
            { name: 'candy-yellow', hex: '#FCD34D', light: '#FFFBEB', dark: '#D97706', rgb: [252, 211, 77] },
            { name: 'candy-sky', hex: '#60A5FA', light: '#EFF6FF', dark: '#2563EB', rgb: [96, 165, 250] },
            { name: 'candy-purple', hex: '#C084FC', light: '#FAF5FF', dark: '#9333EA', rgb: [192, 132, 252] }
        ]
    },
    {
        id: 'retro-8bit',
        name: 'Retro 8-Bit Arcade',
        desc: 'Pure nostalgic arcade primary pixel colors',
        palette: [
            { name: 'retro-red', hex: '#FF0044', light: '#FFAAC0', dark: '#990022', rgb: [255, 0, 68] },
            { name: 'retro-yellow', hex: '#FFCC00', light: '#FFEE88', dark: '#AA8800', rgb: [255, 204, 0] },
            { name: 'retro-blue', hex: '#0077FF', light: '#99CCFF', dark: '#003399', rgb: [0, 119, 255] },
            { name: 'retro-green', hex: '#00DD55', light: '#99FFAA', dark: '#007722', rgb: [0, 221, 85] },
            { name: 'retro-orange', hex: '#FF6600', light: '#FFBB88', dark: '#993300', rgb: [255, 102, 0] }
        ]
    },
    {
        id: 'monochrome-gold',
        name: '24K Luxury Gold',
        desc: 'Opulent shimmering metallic gold and bronze palette',
        palette: [
            { name: 'gold-1', hex: '#FDE047', light: '#FEF9C3', dark: '#CA8A04', rgb: [253, 224, 71] },
            { name: 'gold-2', hex: '#EAB308', light: '#FEF08A', dark: '#A16207', rgb: [234, 179, 8] },
            { name: 'gold-3', hex: '#D97706', light: '#FDE68A', dark: '#92400E', rgb: [217, 119, 6] },
            { name: 'bronze', hex: '#B45309', light: '#FCD34D', dark: '#78350F', rgb: [180, 83, 9] },
            { name: 'white-gold', hex: '#FFFBEB', light: '#FFFFFF', dark: '#FDE047', rgb: [255, 251, 235] }
        ]
    },
    {
        id: 'matrix-glitch',
        name: 'Cyber Matrix Green',
        desc: 'Digital terminal green, acid lime & glitch cyan',
        palette: [
            { name: 'matrix-1', hex: '#00FF66', light: '#B3FFD9', dark: '#009933', rgb: [0, 255, 102] },
            { name: 'matrix-2', hex: '#10B981', light: '#6EE7B7', dark: '#047857', rgb: [16, 185, 129] },
            { name: 'matrix-lime', hex: '#A3E635', light: '#ECFCCB', dark: '#65A30D', rgb: [163, 230, 53] },
            { name: 'matrix-cyan', hex: '#00F0FF', light: '#E0FCFF', dark: '#0891B2', rgb: [0, 240, 255] },
            { name: 'matrix-dark', hex: '#059669', light: '#34D399', dark: '#064E3B', rgb: [5, 150, 105] }
        ]
    }
];

export const EFFECT_SKINS = [
    {
        id: 'golden-sparks',
        name: 'Golden Sparks',
        desc: 'Square crystal sparks with warm golden line shockwaves',
        particleShape: 'square',
        particleColors: ['#FDE68A', '#F59E0B', '#D97706', '#FFFFFF'],
        waveColor: 'rgba(254, 240, 138, 0.95)',
        floatingTextColor: '#FDE047',
        glowColor: 'rgba(245, 158, 11, 0.65)'
    },
    {
        id: 'starburst-magic',
        name: 'Starburst Magic',
        desc: '5-point celestial starbursts with magical lilac lasers',
        particleShape: 'star',
        particleColors: ['#E9D5FF', '#C084FC', '#F472B6', '#FFFFFF'],
        waveColor: 'rgba(233, 213, 255, 0.95)',
        floatingTextColor: '#E9D5FF',
        glowColor: 'rgba(168, 85, 247, 0.7)'
    },
    {
        id: 'diamond-lasers',
        name: 'Diamond Cyber Lasers',
        desc: 'Sharp glowing diamond shards with high-energy cyan lasers',
        particleShape: 'diamond',
        particleColors: ['#00F0FF', '#FF007F', '#39FF14', '#FFE600'],
        waveColor: 'rgba(0, 240, 255, 0.95)',
        floatingTextColor: '#00F0FF',
        glowColor: 'rgba(0, 240, 255, 0.7)'
    },
    {
        id: 'glowing-orbs',
        name: 'Smooth Energy Orbs',
        desc: 'Soft glowing spherical particle bursts with smooth shockwaves',
        particleShape: 'circle',
        particleColors: ['#60A5FA', '#38BDF8', '#818CF8', '#FFFFFF'],
        waveColor: 'rgba(255, 255, 255, 0.95)',
        floatingTextColor: '#60A5FA',
        glowColor: 'rgba(59, 130, 246, 0.65)'
    },
    {
        id: 'solar-embers',
        name: 'Solar Flare Embers',
        desc: 'Hot fiery circular ember sparks with sunburst shockwaves',
        particleShape: 'circle',
        particleColors: ['#FED7AA', '#F97316', '#F59E0B', '#EF4444'],
        waveColor: 'rgba(253, 186, 116, 0.95)',
        floatingTextColor: '#FDBA74',
        glowColor: 'rgba(249, 115, 22, 0.7)'
    },
    {
        id: 'frost-shards',
        name: 'Frost & Blizzard Shards',
        desc: 'Glittering diamond ice shards with frosted blizzard shockwaves',
        particleShape: 'diamond',
        particleColors: ['#E0F2FE', '#BAE6FD', '#38BDF8', '#FFFFFF'],
        waveColor: 'rgba(186, 230, 253, 0.95)',
        floatingTextColor: '#BAE6FD',
        glowColor: 'rgba(56, 189, 248, 0.7)'
    },
    {
        id: 'emerald-crystals',
        name: 'Emerald Crystals',
        desc: 'Lush 5-point star crystal sparks with mint shockwaves',
        particleShape: 'star',
        particleColors: ['#6EE7B7', '#34D399', '#FDE047', '#FFFFFF'],
        waveColor: 'rgba(110, 231, 183, 0.95)',
        floatingTextColor: '#A7F3D0',
        glowColor: 'rgba(16, 185, 129, 0.65)'
    },
    {
        id: 'volcanic-sparks',
        name: 'Volcanic Magma Sparks',
        desc: 'Heavy square lava sparks with red magma shockwaves',
        particleShape: 'square',
        particleColors: ['#FEF08A', '#FDBA74', '#DC2626', '#EA580C'],
        waveColor: 'rgba(254, 202, 202, 0.95)',
        floatingTextColor: '#FCA5A5',
        glowColor: 'rgba(220, 38, 38, 0.7)'
    }
];

export class SkinManager {
    static KEY_BG = 'blockblast_skin_bg';
    static KEY_PUZZLE = 'blockblast_skin_puzzle';
    static KEY_EFFECT = 'blockblast_skin_effect';

    static DEFAULT_BG = 'classic-crimson';
    static DEFAULT_PUZZLE = 'amber-wood';
    static DEFAULT_EFFECT = 'golden-sparks';

    static loadConfig() {
        let bg = this.DEFAULT_BG;
        let puzzle = this.DEFAULT_PUZZLE;
        let effect = this.DEFAULT_EFFECT;

        try {
            bg = localStorage.getItem(this.KEY_BG) || this.DEFAULT_BG;
            puzzle = localStorage.getItem(this.KEY_PUZZLE) || this.DEFAULT_PUZZLE;
            effect = localStorage.getItem(this.KEY_EFFECT) || this.DEFAULT_EFFECT;
        } catch (e) {}

        return {
            bg: this.getBackground(bg).id,
            puzzle: this.getPuzzle(puzzle).id,
            effect: this.getEffect(effect).id
        };
    }

    static saveConfig(type, id) {
        try {
            if (type === 'bg') localStorage.setItem(this.KEY_BG, id);
            if (type === 'puzzle') localStorage.setItem(this.KEY_PUZZLE, id);
            if (type === 'effect') localStorage.setItem(this.KEY_EFFECT, id);
        } catch (e) {}
    }

    static getBackground(id) {
        return BACKGROUND_SKINS.find(b => b.id === id) || BACKGROUND_SKINS[0];
    }

    static getPuzzle(id) {
        return PUZZLE_SKINS.find(p => p.id === id) || PUZZLE_SKINS[0];
    }

    static getEffect(id) {
        return EFFECT_SKINS.find(e => e.id === id) || EFFECT_SKINS[0];
    }

    static getAllBackgrounds() {
        return BACKGROUND_SKINS;
    }

    static getAllPuzzles() {
        return PUZZLE_SKINS;
    }

    static getAllEffects() {
        return EFFECT_SKINS;
    }
}
