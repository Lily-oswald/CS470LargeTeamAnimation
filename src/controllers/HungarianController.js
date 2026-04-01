/**
 * HungarianController - MVC Controller Component
 *
 * Coordinates between Model and View.
 */

class HungarianController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.autoInterval = null;

        this.init();
    }

    init() {
        this.model.addObserver((state) => this.onStateChange(state));

        this.view.buildControls({
            onStep: () => this.handleStep(),
            onRun: () => this.handleRun(),
            onReset: () => this.handleReset(),
            onAutoToggle: (enabled) => this.handleAutoToggle(enabled)
        });

        this.render();
    }

    onStateChange(state) {
        this.render();
    }

    render() {
        const state = this.model.getFullState();
        const stats = this.model.getStatistics();

        this.view.updateMetrics(stats);
        this.view.renderMatrix(state);

        this.view.setControlsEnabled({
            step: !stats.isComplete,
            run: !stats.isComplete
        });
    }

    handleStep() {
        const stepResult = this.model.step();

        if (stepResult) {
            this.view.addLogEntry(stepResult);
        }
    }

    async handleRun() {
        this.view.setControlsEnabled({ step: false, run: false });

        await this.model.runToCompletion(500, () => {
            this.view.setControlsEnabled({
                step: false,
                run: false
            });
        });
    }

    handleReset() {
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = null;
            const autoCheckbox = document.getElementById('auto-step');
            if (autoCheckbox) autoCheckbox.checked = false;
        }

        this.model.reset();
        this.view.clearLog();
        this.render();
    }

    handleAutoToggle(enabled) {
        if (enabled) {
            const speedValue = this.view.getSpeed();
            const delay = 2100 - speedValue;

            this.autoInterval = setInterval(() => {
                if (this.model.algorithm.isComplete()) {
                    this.handleAutoToggle(false);
                    const autoCheckbox = document.getElementById('auto-step');
                    if (autoCheckbox) autoCheckbox.checked = false;
                    return;
                }
                this.handleStep();
            }, delay);
        } else {
            if (this.autoInterval) {
                clearInterval(this.autoInterval);
                this.autoInterval = null;
            }
        }
    }

    getExecutionTrace() {
        return this.model.algorithm.executionTrace;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HungarianController;
}