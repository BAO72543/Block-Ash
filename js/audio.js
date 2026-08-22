/**
 * Block Blast - Audio Engine
 * Zero-latency procedural sound generation via Web Audio API + Audio file fallback.
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

        // Pentatonic scale frequencies for dynamic combo chimes
        this.comboPitches = [
            523.25, // C5
            587.33, // D5
            659.25, // E5
            783.99, // G5
            880.00, // A5
            1046.50,// C6
            1174.66,// D6
            1318.51,// E6
            1567.98,// G6
            1760.00 // A6
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

    playClear(comboCount = 0) {
        if (this.isMuted) return;
        this.ensureContext();

        // Also play custom audio asset if available
        if (this.customClearAudio) {
            try {
                const clone = this.customClearAudio.cloneNode();
                clone.volume = 0.6;
                clone.play().catch(() => {});
            } catch (e) {}
        }

        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const pitchIndex = Math.min(comboCount, this.comboPitches.length - 1);
            const baseFreq = this.comboPitches[pitchIndex];

            // Primary chime
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(baseFreq, now);
            osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + 0.25);

            gain1.gain.setValueAtTime(0.28, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.35);

            // Harmonizing sparkle
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
            gain2.gain.setValueAtTime(0.18, now + 0.04);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.start(now + 0.04);
            osc2.stop(now + 0.38);
        } catch (e) {}
    }

    playMultiClear(linesCount = 2) {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const freqs = [392.0, 493.88, 587.33, 783.99]; // G chord
            freqs.slice(0, Math.min(4, linesCount + 1)).forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.03);

                gain.gain.setValueAtTime(0.2, now + idx * 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + idx * 0.03);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.03);
                osc.stop(now + 0.45 + idx * 0.03);
            });
        } catch (e) {}
    }

    playAllClear() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major arpeggio
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.07);

                gain.gain.setValueAtTime(0.25, now + i * 0.07);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + i * 0.07);
                osc.stop(now + i * 0.07 + 0.4);
            });
        } catch (e) {}
    }

    playGameOver() {
        if (this.isMuted) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [440, 415.3, 392, 349.23]; // descending melancholy notes
            notes.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.12);

                gain.gain.setValueAtTime(0.22, now + i * 0.12);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + i * 0.12);
                osc.stop(now + i * 0.12 + 0.35);
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
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.setValueAtTime(90, now + 0.05);

            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.12);
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
}

export { AudioManager as SoundFX };

