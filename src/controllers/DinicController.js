// =============================================================================
// src/controllers/DinicsController.js
// Owns the setTimeout animation loop and all button wiring.
// Calls model.next() to advance, view.render(state) to draw.
//
// Correct animation pattern (as required by assignment):
//   render() just draws current state — never loops or sleeps inside it.
//   _scheduleNext() uses setTimeout to trigger the next step after a delay.
// =============================================================================

class DinicsController {
    constructor(model, view) {
        this.model   = model;
        this.view    = view;
        this.timer   = null;
        this.playing = false;

        // Register view as model listener
        this.model.addListener((state) => this.view.render(state));

        // Wire buttons
        this.view.btnPlay.addEventListener('click',  () => this.playing ? this._pause() : this._play());
        this.view.btnStep.addEventListener('click',  () => { this._pause(); this._step(); });
        this.view.btnReset.addEventListener('click', () => { this._pause(); this._reset(); });

        // Draw initial state
        this.view.render(this.model.getState());
    }

    // ── Playback ──────────────────────────────────────────────────────────────

    _play() {
        if (this.model.isDone() || !this.model.canNext()) return;
        this.playing = true;
        this.view.btnPlay.textContent = '⏸ Pause';
        this._scheduleNext();
    }

    _pause() {
        this.playing = false;
        this.view.btnPlay.textContent = '▶ Play';
        if (this.timer) { clearTimeout(this.timer); this.timer = null; }
    }

    // Schedule the next step — never loop inside render/paint
    _scheduleNext() {
        const delays = [900, 650, 400, 220, 100];
        const idx = Math.min(4, Math.max(0, parseInt(this.view.speedSlider.value) - 1));
        this.timer = setTimeout(() => {
            if (!this.playing) return;
            const advanced = this.model.next();
            if (!advanced || !this.model.canNext()) {
                this._pause();
            } else {
                this._scheduleNext();
            }
        }, delays[idx]);
    }

    _step() {
        this.model.next();
    }

    _reset() {
        this.model.reset();
        this.view.btnPlay.textContent = '▶ Play';
    }
}