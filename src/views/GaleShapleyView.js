/**
 * GaleShapleyView - MVC View Component
 * 
 * Handles all rendering and DOM manipulation for Gale-Shapley visualization.
 * Uses the shared AnimationRenderer for common operations.
 */

class GaleShapleyView {
    constructor(containerId, renderer) {
        this.container = document.getElementById(containerId);
        this.renderer = renderer || new AnimationRenderer(containerId);
        this.elements = {};
        this.buildLayout();
    }

    /**
     * Build the complete UI layout
     */
    buildLayout() {
        this.container.innerHTML = `
            <div class="animation-container">
                <h1>Gale-Shapley Stable Matching Algorithm</h1>
                <p class="subtitle">Interactive visualization showing how the algorithm finds stable marriages</p>
                
                <div id="metrics-grid" class="metrics"></div>
                
                <div id="controls" class="controls"></div>

                <div id="current-step" class="current-step-box">
                    Waiting to start...
                </div>
                
                <div id="stage" class="stage-container">
                    <div class="column">
                        <h3 class="proposers">Proposers</h3>
                        <div id="proposers" class="people-list"></div>
                    </div>
                    <div class="column">
                        <h3 class="receivers">Receivers</h3>
                        <div id="receivers" class="people-list"></div>
                    </div>
                    <div id="lines"></div>
                </div>
                
                <div id="log" class="log"></div>
            </div>
        `;

        // Store references to key elements
        this.elements = {
            metricsGrid: document.getElementById('metrics-grid'),
            controls: document.getElementById('controls'),
            currentStep: document.getElementById('current-step'),
            proposers: document.getElementById('proposers'),
            receivers: document.getElementById('receivers'),
            lines: document.getElementById('lines'),
            log: document.getElementById('log'),
            stage: document.getElementById('stage')
        };

        this.buildMetrics();
    }

    /**
     * Build metrics display
     */
    buildMetrics() {
        const metrics = [
            { id: 'step-count', label: 'Step', value: '0' },
            { id: 'proposal-count', label: 'Proposals made', value: '0' },
            { id: 'match-count', label: 'Matched pairs', value: '0 / 0' },
            { id: 'status', label: 'Status', value: 'Ready' }
        ];

        this.elements.metricsGrid.innerHTML = '';
        metrics.forEach(m => {
            const metric = this.renderer.createMetric(m.label, m.value);
            metric.id = m.id;
            this.elements.metricsGrid.appendChild(metric);
        });
    }

    /**
     * Build control buttons
     * @param {Object} handlers - Object containing button click handlers
     */
    buildControls(handlers) {
        this.elements.controls.innerHTML = `
            <button id="step-btn">Step forward</button>
            <button id="run-btn">Run to completion</button>
            <button id="reset-btn">Reset</button>
            <label>
                <input type="checkbox" id="auto-step">
                Auto-step
            </label>
            <label>
                Speed
                <input type="range" id="speed" min="100" max="2000" value="1000" step="100">
            </label>
        `;

        // Attach handlers
        document.getElementById('step-btn').onclick = handlers.onStep;
        document.getElementById('run-btn').onclick = handlers.onRun;
        document.getElementById('reset-btn').onclick = handlers.onReset;
        document.getElementById('auto-step').onchange = (e) => handlers.onAutoToggle(e.target.checked);
    }

    /**
     * Update metrics display
     * @param {Object} stats - Statistics object from model
     */
    updateMetrics(stats) {
        const stepMetric = document.getElementById('step-count');
        const proposalMetric = document.getElementById('proposal-count');
        const matchMetric = document.getElementById('match-count');
        const statusMetric = document.getElementById('status');

        if (stepMetric) this.renderer.updateMetric(stepMetric, stats.stepCount);
        if (proposalMetric) this.renderer.updateMetric(proposalMetric, stats.proposalCount);
        if (matchMetric) this.renderer.updateMetric(matchMetric, `${stats.matchCount} / ${stats.totalPairs}`);
        if (statusMetric) this.renderer.updateMetric(statusMetric, stats.isComplete ? 'Complete' : 'Running');
    }

    /**
     * Render all people boxes
     * @param {Object} state - Full state from model
     */
    renderPeople(state) {
        this.renderProposers(state);
        this.renderReceivers(state);
        
        // Redraw lines after DOM update
        setTimeout(() => this.drawLines(state), 10);
    }

    /**
     * Render proposer boxes
     * @param {Object} state
     */
    renderProposers(state) {
        this.elements.proposers.innerHTML = '';
        
        state.proposers.forEach(p => {
            const partner = Object.entries(state.matches).find(([r, prop]) => prop === p)?.[0];
            const isFree = state.free.includes(p);
            const isActive = state.animationState.currentProposer === p;
            const prefs = state.proposerPrefs[p];
            const nextIdx = state.nextProposal[p];

            const box = this.createPersonBox({
                name: p,
                type: 'proposer',
                partner: partner,
                isFree: isFree,
                isActive: isActive,
                preferences: prefs,
                nextIndex: nextIdx
            });

            this.elements.proposers.appendChild(box);
        });
    }

    /**
     * Render receiver boxes
     * @param {Object} state
     */
    renderReceivers(state) {
        this.elements.receivers.innerHTML = '';
        
        state.receivers.forEach(r => {
            const partner = state.matches[r];
            const isActive = state.animationState.currentReceiver === r;
            const prefs = state.receiverPrefs[r];

            const box = this.createPersonBox({
                name: r,
                type: 'receiver',
                partner: partner,
                isFree: !partner,
                isActive: isActive,
                preferences: prefs
            });

            this.elements.receivers.appendChild(box);
        });
    }

    /**
     * Create a person box element
     * @param {Object} person
     * @returns {HTMLElement}
     */
    createPersonBox(person) {
        const box = document.createElement('div');
        box.className = `person-box ${person.type}`;
        box.dataset.person = person.name;
        
        if (person.isActive) box.classList.add('active');
        if (person.partner) box.classList.add('matched');

        const statusText = person.partner 
            ? `Matched with ${person.partner}` 
            : (person.isFree ? 'Free' : 'Waiting');

        let prefsHtml = '';
        if (person.type === 'proposer' && person.nextIndex !== undefined) {
            prefsHtml = person.preferences.map((r, i) => {
                if (i < person.nextIndex) return `<span class="tried">${r}</span>`;
                if (i === person.nextIndex) return `<span class="current">${r}</span>`;
                return r;
            }).join(' ');
        } else {
            prefsHtml = person.preferences.join(' ');
        }

        box.innerHTML = `
            <div class="person-name">${person.name}</div>
            <div class="person-status">${statusText}</div>
            <div class="prefs-list">Prefs: ${prefsHtml}</div>
        `;

        return box;
    }

    /**
     * Draw lines between matched pairs
     * @param {Object} state
     */
    drawLines(state) {
        this.elements.lines.innerHTML = '';

        // Draw stable match lines
        Object.entries(state.matches).forEach(([receiver, proposer]) => {
            const fromBox = this.elements.proposers.querySelector(`[data-person="${proposer}"]`);
            const toBox = this.elements.receivers.querySelector(`[data-person="${receiver}"]`);
            
            if (fromBox && toBox) {
                const line = this.renderer.drawLine(fromBox, toBox, {
                    container: this.elements.stage,
                    className: 'match-line',
                    color: '#42b72a'
                });
                this.elements.lines.appendChild(line);
            }
        });

        // Draw proposal line if active
        if (state.animationState.currentProposer && state.animationState.currentReceiver) {
            const fromBox = this.elements.proposers.querySelector(`[data-person="${state.animationState.currentProposer}"]`);
            const toBox = this.elements.receivers.querySelector(`[data-person="${state.animationState.currentReceiver}"]`);
            
            if (fromBox && toBox) {
                const line = this.renderer.drawLine(fromBox, toBox, {
                    container: this.elements.stage,
                    className: 'proposal-line',
                    color: '#f59e0b',
                    styles: {
                        borderTop: '3px dashed #f59e0b',
                        animation: 'pulse 1s ease-in-out infinite'
                    }
                });
                this.elements.lines.appendChild(line);
            }
        }
    }

    /**
     * Update the current step explanation box
     * @param {string} message
     */
    updateCurrentStep(message) {
        if (this.elements.currentStep) {
            this.elements.currentStep.textContent = message || 'Waiting to start...';
        }
    }

    /**
     * Add entry to execution log
     * @param {Object} step - Step result from algorithm
     */
    addLogEntry(step) {
        this.updateCurrentStep(step.message);

        let type = 'info';
        if (step.type === 'accept_free' || step.type === 'accept_better') type = 'accept';
        if (step.type === 'reject') type = 'reject';
        
        this.renderer.appendToLog(this.elements.log, step.message, type);
    }

    /**
     * Clear log
     */
    clearLog() {
        this.elements.log.innerHTML = '';
        this.updateCurrentStep('Waiting to start...');
    }

    /**
     * Enable/disable controls
     * @param {Object} enabled - Which controls to enable
     */
    setControlsEnabled(enabled) {
        const stepBtn = document.getElementById('step-btn');
        const runBtn = document.getElementById('run-btn');
        
        if (stepBtn) stepBtn.disabled = !enabled.step;
        if (runBtn) runBtn.disabled = !enabled.run;
    }

    /**
     * Get speed slider value
     * @returns {number}
     */
    getSpeed() {
        const speedSlider = document.getElementById('speed');
        return speedSlider ? parseInt(speedSlider.value) : 1000;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GaleShapleyView;
}