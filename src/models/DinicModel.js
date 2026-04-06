// =============================================================================
// src/models/DinicsModel.js
// Wraps DinicsAlgorithm and tracks current step index.
// Notifies listeners when state changes (observer pattern).
// =============================================================================

class DinicsModel {
    constructor(algorithm) {
        this.algorithm   = algorithm;
        this.steps       = algorithm.getSteps();
        this.currentStep = 0;
        this.listeners   = [];
    }

    // ── Observer ──────────────────────────────────────────────────────────────

    addListener(fn) {
        this.listeners.push(fn);
    }

    _notify() {
        for (const fn of this.listeners) fn(this.getState());
    }

    // ── State access ──────────────────────────────────────────────────────────

    getState() {
        const step = this.steps[this.currentStep];
        return {
            ...step,
            stepIndex:  this.currentStep,
            totalSteps: this.steps.length,
            isFirst:    this.currentStep === 0,
            isLast:     this.currentStep === this.steps.length - 1,
            isDone:     step.type === 'DONE',
        };
    }

    // ── Navigation ────────────────────────────────────────────────────────────

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this._notify();
            return true;
        }
        return false;
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this._notify();
            return true;
        }
        return false;
    }

    reset() {
        this.currentStep = 0;
        this._notify();
    }

    goTo(index) {
        if (index >= 0 && index < this.steps.length) {
            this.currentStep = index;
            this._notify();
        }
    }

    canNext() { return this.currentStep < this.steps.length - 1; }
    canPrev() { return this.currentStep > 0; }
    isDone()  { return this.getState().isDone; }
}