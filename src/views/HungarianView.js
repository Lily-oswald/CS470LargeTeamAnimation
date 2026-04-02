/**
 * HungarianView - MVC View Component
 *
 * Handles rendering for Hungarian matrix visualization.
 */

class HungarianView {
    constructor(containerId, renderer) {
        this.container = document.getElementById(containerId);
        this.renderer = renderer || new AnimationRenderer(containerId);
        this.elements = {};
        this.buildLayout();
    }

    buildLayout() {
        this.container.innerHTML = `
            <div class="animation-container">
                <h1>Hungarian Algorithm</h1>
                <p class="subtitle">Interactive visualization showing matrix reduction and assignment selection</p>

                <div id="metrics-grid" class="metrics"></div>

                <div id="controls" class="controls"></div>

                <div id="current-step" class="current-step-box">
                    Waiting to start...
                </div>

                <div id="stage" class="stage-container single-stage">
                    <div class="column full-width">
                        <h3 class="proposers">Cost Matrix</h3>
                        <div id="matrix-container" class="matrix-container"></div>
                    </div>
                </div>

                <div id="assignment-summary" class="assignment-summary"></div>

                <div id="log" class="log"></div>
            </div>
        `;

        this.elements = {
            metricsGrid: document.getElementById('metrics-grid'),
            controls: document.getElementById('controls'),
            currentStep: document.getElementById('current-step'),
            matrixContainer: document.getElementById('matrix-container'),
            assignmentSummary: document.getElementById('assignment-summary'),
            log: document.getElementById('log'),
            stage: document.getElementById('stage')
        };

        this.buildMetrics();
    }

    buildMetrics() {
        const metrics = [
            { id: 'step-count', label: 'Step', value: '0' },
            { id: 'phase-name', label: 'Phase', value: 'start' },
            { id: 'assignment-count', label: 'Assignments', value: '0 / 0' },
            { id: 'status', label: 'Status', value: 'Ready' }
        ];

        this.elements.metricsGrid.innerHTML = '';
        metrics.forEach(m => {
            const metric = this.renderer.createMetric(m.label, m.value);
            metric.id = m.id;
            this.elements.metricsGrid.appendChild(metric);
        });
    }

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

        document.getElementById('step-btn').onclick = handlers.onStep;
        document.getElementById('run-btn').onclick = handlers.onRun;
        document.getElementById('reset-btn').onclick = handlers.onReset;
        document.getElementById('auto-step').onchange = (e) => handlers.onAutoToggle(e.target.checked);
    }

    updateMetrics(stats) {
        const stepMetric = document.getElementById('step-count');
        const phaseMetric = document.getElementById('phase-name');
        const assignmentMetric = document.getElementById('assignment-count');
        const statusMetric = document.getElementById('status');

        if (stepMetric) this.renderer.updateMetric(stepMetric, stats.stepCount);
        if (phaseMetric) this.renderer.updateMetric(phaseMetric, stats.phase);
        if (assignmentMetric) this.renderer.updateMetric(assignmentMetric, `${stats.assignmentCount} / ${stats.totalAssignments}`);
        if (statusMetric) this.renderer.updateMetric(statusMetric, stats.isComplete ? 'Complete' : 'Running');
    }

    renderMatrix(state) {
        const matrix = state.workingMatrix;
        const size = state.size;
        const highlightedCells = state.animationState.highlightedCells || [];
        const assignments = state.assignments || [];

        let html = `<table class="hungarian-matrix"><thead><tr><th></th>`;

        for (let j = 0; j < size; j++) {
            html += `<th>C${j + 1}</th>`;
        }
        html += `</tr></thead><tbody>`;

        for (let i = 0; i < size; i++) {
            html += `<tr>`;
            html += `<th>R${i + 1}</th>`;

            for (let j = 0; j < size; j++) {
                const isHighlighted = highlightedCells.some(([r, c]) => r === i && c === j);
                const isAssigned = assignments.some(a => a.row === i && a.col === j);
                const isRowHighlight = state.animationState.highlightedRow === i;
                const isColHighlight = state.animationState.highlightedCol === j;

                const isStarred = state.maskMatrix?.[i]?.[j] === 1;
                const isPrimed = state.maskMatrix?.[i]?.[j] === 2;
                const isCoveredRow = state.coveredRows?.[i];
                const isCoveredCol = state.coveredCols?.[j];
                const isPath = state.path?.some(p => p.row === i && p.col === j);

                let className = 'matrix-cell';

                if (isHighlighted) className += ' highlighted';
                if (isAssigned) className += ' assigned';
                if (isRowHighlight) className += ' row-active';
                if (isColHighlight) className += ' col-active';
                if (matrix[i][j] === 0) className += ' zero-cell';

                if (isStarred) className += ' starred';
                if (isPrimed) className += ' primed';
                if (isCoveredRow || isCoveredCol) className += ' covered';
                if (isPath) className += ' path-cell';

                html += `<td class="${className}">${matrix[i][j]}</td>`;
            }

            html += `</tr>`;
        }

        html += `</tbody></table>`;
        this.elements.matrixContainer.innerHTML = html;

        this.renderAssignmentSummary(assignments);
    }

    renderAssignmentSummary(assignments) {
        if (!assignments || assignments.length === 0) {
            this.elements.assignmentSummary.innerHTML = `
                <div class="assignment-card">
                    <strong>Assignments:</strong> None selected yet
                </div>
            `;
            return;
        }

        const items = assignments
            .map(a => `R${a.row + 1} → C${a.col + 1}`)
            .join(', ');

        this.elements.assignmentSummary.innerHTML = `
            <div class="assignment-card">
                <strong>Assignments:</strong> ${items}
            </div>
        `;
    }

    updateCurrentStep(message) {
        if (this.elements.currentStep) {
            this.elements.currentStep.textContent = message || 'Waiting to start...';
        }
    }

    addLogEntry(step) {
        this.updateCurrentStep(step.message);

        let type = 'info';
        if (step.type === 'row_reduce' || step.type === 'col_reduce') type = 'proposal';
        if (step.type === 'assign') type = 'accept';
        if (step.type === 'complete') type = 'success';

        this.renderer.appendToLog(this.elements.log, step.message, type);
    }

    clearLog() {
        this.elements.log.innerHTML = '';
        this.updateCurrentStep('Waiting to start...');
    }

    setControlsEnabled(enabled) {
        const stepBtn = document.getElementById('step-btn');
        const runBtn = document.getElementById('run-btn');

        if (stepBtn) stepBtn.disabled = !enabled.step;
        if (runBtn) runBtn.disabled = !enabled.run;
    }

    getSpeed() {
        const speedSlider = document.getElementById('speed');
        return speedSlider ? parseInt(speedSlider.value) : 1000;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HungarianView;
}
