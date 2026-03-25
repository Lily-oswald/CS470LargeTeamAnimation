/**
 * GaleShapleyController - MVC Controller Component
 * 
 * Coordinates between Model and View.
 * Handles user interactions and application flow.
 */

class GaleShapleyController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.autoInterval = null;

        this.init();
    }

    /**
     * Initialize controller
     */
    init() {
        // Register model observer
        this.model.addObserver((state) => this.onStateChange(state));

        // Build controls with handlers
        this.view.buildControls({
            onStep: () => this.handleStep(),
            onRun: () => this.handleRun(),
            onReset: () => this.handleReset(),
            onAutoToggle: (enabled) => this.handleAutoToggle(enabled)
        });

        // Initial render
        this.render();
    }

    /**
     * Handle state changes from model
     * @param {Object} state
     */
    onStateChange(state) {
        this.render();
    }

    /**
     * Render current state
     */
    render() {
        const state = this.model.getFullState();
        const stats = this.model.getStatistics();

        this.view.updateMetrics(stats);
        this.view.renderPeople(state);

        // Update control states
        this.view.setControlsEnabled({
            step: !stats.isComplete,
            run: !stats.isComplete
        });
    }

    /**
     * Handle step button click
     */
    handleStep() {
        const stepResult = this.model.step();
        
        if (stepResult) {
            this.view.addLogEntry(stepResult);
        }
    }

    /**
     * Handle run to completion button click
     */
    async handleRun() {
        this.view.setControlsEnabled({ step: false, run: false });
        
        await this.model.runToCompletion(400, () => {
            this.view.setControlsEnabled({ 
                step: false, 
                run: false 
            });
        });
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        // Stop auto-stepping if active
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

    /**
     * Handle auto-step toggle
     * @param {boolean} enabled
     */
    handleAutoToggle(enabled) {
        if (enabled) {
            const speedValue = this.view.getSpeed();
            // Invert: higher slider value = faster = lower delay
            const delay = 2100 - speedValue; // Range: 100ms (fast) to 2000ms (slow)
            
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

    /**
     * Verify final matching stability
     * @returns {Object}
     */
    verifyStability() {
        return this.model.algorithm.verifyStability();
    }

    /**
     * Get final matching
     * @returns {Array}
     */
    getFinalMatching() {
        return this.model.algorithm.getFinalMatching();
    }

    /**
     * Get execution trace
     * @returns {Array}
     */
    getExecutionTrace() {
        return this.model.algorithm.executionTrace;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaleShapleyController;
}
