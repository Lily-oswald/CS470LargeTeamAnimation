/**
 * GaleShapleyModel - MVC Model Component
 * 
 * Manages the state and data for the Gale-Shapley visualization.
 * Separates business logic from view concerns.
 */

class GaleShapleyModel {
    constructor(algorithm) {
        this.algorithm = algorithm;
        this.observers = [];
        this.animationState = {
            currentProposer: null,
            currentReceiver: null,
            highlightedMatch: null
        };
    }

    /**
     * Observer pattern - register callback for state changes
     * @param {Function} callback - Called when state changes
     */
    addObserver(callback) {
        this.observers.push(callback);
    }

    /**
     * Notify all observers of state change
     */
    notifyObservers() {
        const state = this.getFullState();
        this.observers.forEach(callback => callback(state));
    }

    /**
     * Reset the model to initial state
     */
    reset() {
        this.algorithm.reset();
        this.animationState = {
            currentProposer: null,
            currentReceiver: null,
            highlightedMatch: null
        };
        this.notifyObservers();
    }

    /**
     * Execute one step and update animation state
     * @returns {Object|null} Step result
     */
    step() {
        const stepResult = this.algorithm.executeStep();
        
        if (stepResult) {
            // Set animation state for visual feedback
            this.animationState.currentProposer = stepResult.proposer;
            this.animationState.currentReceiver = stepResult.receiver;
            
            // Notify immediately for proposal animation
            this.notifyObservers();
            
            // Clear animation state after delay
            setTimeout(() => {
                this.animationState.currentProposer = null;
                this.animationState.currentReceiver = null;
                this.notifyObservers();
            }, 300);
        }
        
        return stepResult;
    }

    /**
     * Run algorithm to completion with optional delay between steps
     * @param {number} delay - Milliseconds between steps
     * @param {Function} onComplete - Callback when finished
     */
    async runToCompletion(delay = 0, onComplete = null) {
        while (!this.algorithm.isComplete()) {
            this.step();
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        if (onComplete) onComplete();
    }

    /**
     * Get complete state for rendering
     * @returns {Object}
     */
    getFullState() {
        const algoState = this.algorithm.getState();
        return {
            ...algoState,
            proposers: this.algorithm.proposers,
            receivers: this.algorithm.receivers,
            proposerPrefs: this.algorithm.proposerPrefs,
            receiverPrefs: this.algorithm.receiverPrefs,
            executionTrace: this.algorithm.executionTrace,
            animationState: { ...this.animationState }
        };
    }

    /**
     * Get statistics about the algorithm execution
     * @returns {Object}
     */
    getStatistics() {
        return {
            stepCount: this.algorithm.stepCount,
            proposalCount: this.algorithm.proposalCount,
            matchCount: Object.keys(this.algorithm.matches).length,
            totalPairs: this.algorithm.receivers.length,
            isComplete: this.algorithm.isComplete(),
            stability: this.algorithm.verifyStability()
        };
    }

    /**
     * Get proposer status for rendering
     * @param {string} proposer
     * @returns {Object}
     */
    getProposerStatus(proposer) {
        const partner = Object.entries(this.algorithm.matches)
            .find(([r, p]) => p === proposer)?.[0];
        
        return {
            name: proposer,
            partner: partner,
            isFree: this.algorithm.free.includes(proposer),
            isActive: this.animationState.currentProposer === proposer,
            nextProposalIndex: this.algorithm.nextProposal[proposer],
            preferences: this.algorithm.proposerPrefs[proposer]
        };
    }

    /**
     * Get receiver status for rendering
     * @param {string} receiver
     * @returns {Object}
     */
    getReceiverStatus(receiver) {
        const partner = this.algorithm.matches[receiver];
        
        return {
            name: receiver,
            partner: partner,
            isFree: !partner,
            isActive: this.animationState.currentReceiver === receiver,
            preferences: this.algorithm.receiverPrefs[receiver]
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaleShapleyModel;
}