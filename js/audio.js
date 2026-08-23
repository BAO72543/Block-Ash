/**
 * Block Blast - Audio Engine
 * Zero-latency procedural sound generation via Web Audio API + Audio file fallback.
 * Features:
 * - Solfège Pitch-Ascending Ladder (Do, Re, Mi, Fa, Sol, La, Ti, Do...) for combo streaks
 * - Harmonic Chord Arpeggios for multi-line clears (Double, Triple, Quad)
 * - Celebratory Fanfare for All Clear & High Records
 */

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = this.loadMuteState();
        this.initialized = false;
        this.customClearAudio = null;

        // Load custom clear sound from assets if available
        try {
            this.customClearAudio = new Audio('assets/clear_sf.wav');
        } catch (e) {}

        // Solfège Musical Scale Ladder (Do -> Re -> Mi -> Fa -> Sol -> La -> Ti -> Do_high...)
        this.solfegePitches = [
            261.63, // Do  (C4) - Base / Combo 0
            293.66, // Re  (D4) - Combo 1
            329.63, // Mi  (E4) - Combo 2
            349.23, // Fa  (F4) - Combo 3
            392.00, // Sol (G4) - Combo 4
            440.00, // La  (A4) - Combo 5
            493.88, // Ti  (B4) - Combo 6
            523.25, // Do  (C5) - Combo 7
            587.33, // Re  (D5) - Combo 8
            659.25, // Mi  (E5) - Combo 9
            698.46, // Fa  (F5) - Combo 10
            783.99, // Sol (G5) - Combo 11
            880.00, // La  (A5) - Combo 12
            987.77, // Ti  (B5) - Combo 13
            1046.50 // Do  (C6) - High Octave
        ];
    }

    init() {
        if (this.initialized && this.ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.initialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    ensureContext() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    loadMuteState() {
        try {
            return localStorage.getItem('blockblast_muted') === 'true';
        } catch (e) {
            return false;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        try {
            localStorage.setItem('blockblast_muted', this.isMuted.toString());
        } catch (e) {}
        return this.isMuted;
    }

    playPickup() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(520, now + 0.06);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    }

    playPlace() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // 1. Thud component
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.09);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);

            // 2. Click transient
            const clickOsc = this.ctx.createOscillator();
            const clickGain = this.ctx.createGain();

            clickOsc.type = 'sine';
            clickOsc.frequency.setValueAtTime(800, now);
            clickOsc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

            clickGain.gain.setValueAtTime(0.15, now);
            clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

            clickOsc.connect(clickGain);
            clickGain.connect(this.ctx.destination);

            clickOsc.start(now);
            clickOsc.stop(now + 0.03);
        } catch (e) {}
    }

    /**
     * Pitch-Ascending Line Clear Chime along Musical Solfège Scale (Do -> Re -> Mi -> ...)
     */
    playClear(comboCount = 0) {
        if (this.isMuted) return;
        this.ensureContext();

        if (this.customClearAudio && comboCount === 0) {
            try {
                const clone = this.customClearAudio.cloneNode();
                clone.volume = 0.55;
                clone.play().catch(() => {});
            } catch (e) {}
        }

        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const pitchIndex = Math.min(Math.max(0, comboCount), this.solfegePitches.length - 1);
            const baseFreq = this.solfegePitches[pitchIndex];

            // 1. Primary Rich Chime
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.04, now + 0.28);

            gain1.gain.setValueAtTime(0.30, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.38);

            // 2. Crystal Harmonic Sparkle (Major 3rd / 5th overtone)
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.03);
            osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.52, now + 0.32);

            gain2.gain.setValueAtTime(0.18, now + 0.03);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.start(now + 0.03);
            osc2.stop(now + 0.40);
        } catch (e) {}
    }

    /**
     * Pitch-ascending domino micro-pop sound as sweeping laser passes each individual block
     */
    playSequentialCellPop(stepIndex = 0, comboCount = 0) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const comboPitch = this.solfegePitches[Math.min(comboCount, this.solfegePitches.length - 1)] || 261.63;
            const stepFreq = comboPitch * (1 + (stepIndex % 8) * 0.09);

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(stepFreq, now);
            osc.frequency.exponentialRampToValueAtTime(stepFreq * 1.06, now + 0.08);

            const volume = 0.09 + Math.min(0.06, (stepIndex / 8) * 0.05);
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.09);
        } catch (e) {}
    }

    /**
     * Harmonic Arpeggiated Chords for Multi-Line Clears (Double, Triple, Quad)
     */
    playMultiClear(linesCount = 2) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // Pentatonic arpeggio chords
            const freqs = [392.00, 493.88, 587.33, 783.99, 987.77];
            const count = Math.min(freqs.length, linesCount + 1);

            for (let i = 0; i < count; i++) {
                const freq = freqs[i];
                const startTime = now + i * 0.04;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = i % 2 === 0 ? 'sine' : 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.22, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.45);
            }
        } catch (e) {}
    }

    playAllClear() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C Major Fanfare
            notes.forEach((freq, i) => {
                const startTime = now + i * 0.06;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.28, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.65);
            });
        } catch (e) {}
    }

    playInvalid() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.setValueAtTime(110, now + 0.06);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.14);
        } catch (e) {}
    }

    playGameOver() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [440, 415.3, 392, 369.99, 329.63];
            notes.forEach((freq, i) => {
                const startTime = now + i * 0.12;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, startTime);

                gain.gain.setValueAtTime(0.25, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(startTime);
                osc.stop(startTime + 0.28);
            });
        } catch (e) {}
    }

    playButton() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.04);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.04);
        } catch (e) {}
    }

    playPop() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(420, now);
            osc.frequency.exponentialRampToValueAtTime(840, now + 0.06);

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {}
    }

    playHover() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1000, now + 0.02);

            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.02);
        } catch (e) {}
    }
}

export { AudioManager as SoundFX };
