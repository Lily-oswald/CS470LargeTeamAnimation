/**
 * HungarianAlgorithm - starter step-by-step implementation
 *
 * This is a working educational scaffold:
 * - shows original matrix
 * - row reduction
 * - column reduction
 * - zero discovery
 * - greedy zero assignment
 *
 * It is not yet a full final Hungarian implementation with line-cover adjustment rounds.
 */

class HungarianAlgorithm {
    constructor(matrix) {
        this.originalMatrix = matrix.map(row => [...row]);
        this.size = matrix.length;
        this.reset();
    }

    reset() {
        this.workingMatrix = this.originalMatrix.map(row => [...row]);
        this.stepCount = 0;
        this.phase = 'start';
        this.executionTrace = [];
        this.assignments = [];
        this.coveredRows = [];
        this.coveredCols = [];
        this.highlightedCells = [];
        this.highlightedRow = null;
        this.highlightedCol = null;
        this.rowReductions = new Array(this.size).fill(0);
        this.colReductions = new Array(this.size).fill(0);
        this.currentRow = 0;
        this.currentCol = 0;
        this.isDone = false;
    }

    isComplete() {
        return this.isDone;
    }

    executeStep() {
        if (this.isDone) return null;

        let stepResult = null;

        switch (this.phase) {
            case 'start':
                stepResult = {
                    type: 'info',
                    message: 'Starting Hungarian algorithm with the original cost matrix.'
                };
                this.phase = 'row_reduction';
                break;

            case 'row_reduction':
                if (this.currentRow < this.size) {
                    const row = this.workingMatrix[this.currentRow];
                    const minVal = Math.min(...row);
                    this.rowReductions[this.currentRow] = minVal;

                    for (let j = 0; j < this.size; j++) {
                        this.workingMatrix[this.currentRow][j] -= minVal;
                    }

                    this.highlightedRow = this.currentRow;
                    this.highlightedCol = null;
                    this.highlightedCells = row.map((_, j) => [this.currentRow, j]);

                    stepResult = {
                        type: 'row_reduce',
                        row: this.currentRow,
                        value: minVal,
                        message: `Row ${this.currentRow + 1}: subtract ${minVal} from every value in the row.`
                    };

                    this.currentRow++;
                } else {
                    this.phase = 'column_reduction';
                    this.currentCol = 0;
                    this.highlightedRow = null;
                    this.highlightedCells = [];
                    stepResult = {
                        type: 'info',
                        message: 'Row reduction complete. Moving to column reduction.'
                    };
                }
                break;

            case 'column_reduction':
                if (this.currentCol < this.size) {
                    const columnValues = this.workingMatrix.map(row => row[this.currentCol]);
                    const minVal = Math.min(...columnValues);
                    this.colReductions[this.currentCol] = minVal;

                    for (let i = 0; i < this.size; i++) {
                        this.workingMatrix[i][this.currentCol] -= minVal;
                    }

                    this.highlightedCol = this.currentCol;
                    this.highlightedRow = null;
                    this.highlightedCells = this.workingMatrix.map((_, i) => [i, this.currentCol]);

                    stepResult = {
                        type: 'col_reduce',
                        col: this.currentCol,
                        value: minVal,
                        message: `Column ${this.currentCol + 1}: subtract ${minVal} from every value in the column.`
                    };

                    this.currentCol++;
                } else {
                    this.phase = 'mark_zeros';
                    this.highlightedCol = null;
                    this.highlightedCells = [];
                    stepResult = {
                        type: 'info',
                        message: 'Column reduction complete. Identifying zeros in the reduced matrix.'
                    };
                }
                break;

            case 'mark_zeros':
                this.highlightedCells = [];
                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < this.size; j++) {
                        if (this.workingMatrix[i][j] === 0) {
                            this.highlightedCells.push([i, j]);
                        }
                    }
                }

                stepResult = {
                    type: 'zeros',
                    message: `Found ${this.highlightedCells.length} zero entries. Now selecting independent zeros.`
                };

                this.phase = 'assign_zeros';
                break;

            case 'assign_zeros':
                this.assignments = this.greedyIndependentZeros();
                this.highlightedCells = this.assignments.map(a => [a.row, a.col]);

                stepResult = {
                    type: 'assign',
                    message: `Selected ${this.assignments.length} independent zero(s) as tentative assignments.`
                };

                this.phase = 'complete';
                break;

            case 'complete':
                this.isDone = true;
                stepResult = {
                    type: 'complete',
                    message: this.assignments.length === this.size
                        ? 'Algorithm complete. A full zero assignment was found.'
                        : 'Starter animation complete. A partial zero assignment was found; full line-cover adjustment is not yet implemented.'
                };
                break;
        }

        this.stepCount++;
        if (stepResult) {
            this.executionTrace.push(stepResult);
        }
        return stepResult;
    }

    greedyIndependentZeros() {
        const assignments = [];
        const usedRows = new Set();
        const usedCols = new Set();

        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (
                    this.workingMatrix[i][j] === 0 &&
                    !usedRows.has(i) &&
                    !usedCols.has(j)
                ) {
                    assignments.push({ row: i, col: j });
                    usedRows.add(i);
                    usedCols.add(j);
                }
            }
        }

        return assignments;
    }

    getState() {
        return {
            originalMatrix: this.originalMatrix.map(row => [...row]),
            workingMatrix: this.workingMatrix.map(row => [...row]),
            size: this.size,
            phase: this.phase,
            assignments: [...this.assignments],
            coveredRows: [...this.coveredRows],
            coveredCols: [...this.coveredCols],
            highlightedCells: [...this.highlightedCells],
            highlightedRow: this.highlightedRow,
            highlightedCol: this.highlightedCol
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HungarianAlgorithm;
}