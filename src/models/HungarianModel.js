/**
 * HungarianModel - MVC Model Component
 *
 * Manages state and animation data for the Hungarian algorithm visualization.
 */

class HungarianModel {
    constructor(algorithm) {
        this.algorithm = algorithm;
        this.observers = [];
        this.animationState = {
            highlightedCells: [],
            highlightedRow: null,
            highlightedCol: null
        };
    }

    addObserver(callback) {
        this.observers.push(callback);
    }

    notifyObservers() {
        const state = this.getFullState();
        this.observers.forEach(callback => callback(state));
    }

    reset() {
        this.algorithm.reset();
        this.animationState = {
            highlightedCells: [],
            highlightedRow: null,
            highlightedCol: null
        };
        this.notifyObservers();
    }

    step() {
        const stepResult = this.algorithm.executeStep();

        if (stepResult) {
            const algoState = this.algorithm.getState();
            this.animationState.highlightedCells = [...algoState.highlightedCells];
            this.animationState.highlightedRow = algoState.highlightedRow;
            this.animationState.highlightedCol = algoState.highlightedCol;

            this.notifyObservers();
        }

        return stepResult;
    }

    async runToCompletion(delay = 0, onComplete = null) {
        while (!this.algorithm.isComplete()) {
            this.step();
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        if (onComplete) onComplete();
    }

    getFullState() {
        const algoState = this.algorithm.getState();
        return {
            ...algoState,
            executionTrace: this.algorithm.executionTrace,
            animationState: { ...this.animationState }
        };
    }

    getStatistics() {
        return {
            stepCount: this.algorithm.stepCount,
            assignmentCount: this.algorithm.assignments.length,
            totalAssignments: this.algorithm.size,
            phase: this.algorithm.phase,
            isComplete: this.algorithm.isComplete()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HungarianModel;
}