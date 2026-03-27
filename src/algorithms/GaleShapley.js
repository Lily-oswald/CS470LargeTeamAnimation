/**
 * Gale-Shapley Stable Matching Algorithm
 * 
 * Pure algorithm implementation with no UI dependencies.
 * Returns step-by-step execution trace for animation purposes.
 */

class GaleShapleyAlgorithm {
    /**
     * @param {Array<string>} proposers - Array of proposer identifiers
     * @param {Array<string>} receivers - Array of receiver identifiers
     * @param {Object} proposerPreferences - Map of proposer -> ordered preference list
     * @param {Object} receiverPreferences - Map of receiver -> ordered preference list
     */
    constructor(proposers, receivers, proposerPreferences, receiverPreferences) {
        this.proposers = proposers;
        this.receivers = receivers;
        this.proposerPrefs = proposerPreferences;
        this.receiverPrefs = receiverPreferences;
        
        this.reset();
    }

    /**
     * Reset algorithm state to initial conditions
     */
    reset() {
        this.matches = {}; // receiver -> proposer
        this.nextProposal = {}; // proposer -> next index to propose to
        this.free = [...this.proposers]; // list of free proposers
        this.stepCount = 0;
        this.proposalCount = 0;
        this.executionTrace = [];
        
        // Initialize proposal indices
        this.proposers.forEach(p => this.nextProposal[p] = 0);
    }

    /**
     * Check if algorithm has completed
     * @returns {boolean}
     */
    isComplete() {
        return this.free.length === 0;
    }

    /**
     * Execute a single step of the algorithm
     * @returns {Object|null} Step result or null if complete
     */
    executeStep() {
        if (this.isComplete()) {
            return null;
        }

        this.stepCount++;
        const proposer = this.free[0];
        const receiverIdx = this.nextProposal[proposer];

        // Check if proposer has exhausted all preferences
        if (receiverIdx >= this.proposerPrefs[proposer].length) {
            this.free.shift();
            const step = {
                type: 'exhausted',
                stepNumber: this.stepCount,
                proposer: proposer,
                message: `${proposer} has exhausted all preferences`
            };
            this.executionTrace.push(step);
            return step;
        }

        const receiver = this.proposerPrefs[proposer][receiverIdx];
        this.proposalCount++;

        const currentMatch = this.matches[receiver];
        let step;

        if (!currentMatch) {
            // Receiver is free - accept proposal
            this.matches[receiver] = proposer;
            this.free = this.free.filter(p => p !== proposer);
            
            step = {
                type: 'accept_free',
                stepNumber: this.stepCount,
                proposer: proposer,
                receiver: receiver,
                previousMatch: null,
                message: `${receiver} accepts ${proposer} (was free)`
            };
        } else {
            // Receiver is matched - compare preferences
            const currentRank = this.receiverPrefs[receiver].indexOf(currentMatch);
            const newRank = this.receiverPrefs[receiver].indexOf(proposer);

            if (newRank < currentRank) {
                // Prefer new proposer
                this.matches[receiver] = proposer;
                this.free = this.free.filter(p => p !== proposer);
                this.free.push(currentMatch);
                
                step = {
                    type: 'accept_better',
                    stepNumber: this.stepCount,
                    proposer: proposer,
                    receiver: receiver,
                    previousMatch: currentMatch,
                    rejectedProposer: currentMatch,
                    message: `${receiver} accepts ${proposer}, rejects ${currentMatch}`
                };
            } else {
                // Keep current match
                step = {
                    type: 'reject',
                    stepNumber: this.stepCount,
                    proposer: proposer,
                    receiver: receiver,
                    previousMatch: currentMatch,
                    message: `${receiver} rejects ${proposer} (prefers ${currentMatch})`
                };
            }
        }

        this.nextProposal[proposer]++;
        this.executionTrace.push(step);
        return step;
    }

    /**
     * Run algorithm to completion
     * @returns {Array} Complete execution trace
     */
    runToCompletion() {
        while (!this.isComplete()) {
            this.executeStep();
        }
        return this.executionTrace;
    }

    /**
     * Get current state snapshot
     * @returns {Object} Current algorithm state
     */
    getState() {
        return {
            matches: { ...this.matches },
            nextProposal: { ...this.nextProposal },
            free: [...this.free],
            stepCount: this.stepCount,
            proposalCount: this.proposalCount,
            isComplete: this.isComplete()
        };
    }

    /**
     * Verify if current matching is stable
     * @returns {Object} Stability verification result
     */
    verifyStability() {
        const blockingPairs = [];

        for (const proposer of this.proposers) {
            const currentReceiver = Object.entries(this.matches)
                .find(([r, p]) => p === proposer)?.[0];
            
            if (!currentReceiver) continue;

            for (const receiver of this.proposerPrefs[proposer]) {
                // If proposer prefers this receiver to current match
                const proposerRankCurrent = this.proposerPrefs[proposer].indexOf(currentReceiver);
                const proposerRankOther = this.proposerPrefs[proposer].indexOf(receiver);
                
                if (proposerRankOther < proposerRankCurrent) {
                    // Check if receiver also prefers proposer to current match
                    const currentMatch = this.matches[receiver];
                    const receiverRankCurrent = this.receiverPrefs[receiver].indexOf(currentMatch);
                    const receiverRankProposer = this.receiverPrefs[receiver].indexOf(proposer);
                    
                    if (receiverRankProposer < receiverRankCurrent) {
                        blockingPairs.push({
                            proposer: proposer,
                            receiver: receiver,
                            reason: `Both prefer each other to current matches`
                        });
                    }
                }
            }
        }

        return {
            isStable: blockingPairs.length === 0,
            blockingPairs: blockingPairs
        };
    }

    /**
     * Get final matching as array of pairs
     * @returns {Array} Array of [proposer, receiver] pairs
     */
    getFinalMatching() {
        return Object.entries(this.matches).map(([receiver, proposer]) => ({
            proposer: proposer,
            receiver: receiver
        }));
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaleShapleyAlgorithm;
}