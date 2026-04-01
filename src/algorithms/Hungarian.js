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
        this.coveredRows = new Array(this.size).fill(false);
        this.coveredCols = new Array(this.size).fill(false);
        this.highlightedCells = [];
        this.highlightedRow = null;
        this.highlightedCol = null;
        this.rowReductions = new Array(this.size).fill(0);
        this.colReductions = new Array(this.size).fill(0);
        this.currentRow = 0;
        this.currentCol = 0;
        this.isDone = false;

        this.maskMatrix = Array.from({ length: this.size }, () =>
            new Array(this.size).fill(0));

        this.starScanRow = 0;
        this.starScanCol = 0;

        this.pathStart = null;
        this.path = [];
        this.lastAdjustmentValue = null;
    }

    isComplete() {
        return this.isDone;
    }

    executeStep() {
        if (this.isDone) return null;

        let stepResult = null;

        switch (this.phase) {
            case 'start':
                this.clearHighlights();
                stepResult = {
                    type: 'info',
                    message: 'Starting Hungarian algorithm with the original cost matrix.'
                };
                this.phase = 'row_reduction';
                break;

            case 'row_reduction':
                if (this.currentRow < this.size) {
                    const minVal = Math.min(...this.workingMatrix[this.currentRow]);
                    this.rowReductions[this.currentRow] = minVal;

                    this.highlightedRow = this.currentRow;
                    this.highlightedCol = null;
                    this.highlightedCells = [];
                    for (let j = 0; j < this.size; j++) {
                        this.highlightedCells.push([this.currentRow, j]);
                        this.workingMatrix[this.currentRow][j] -= minVal;
                    }

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
                    this.clearHighlights();
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

                    this.highlightedCol = this.currentCol;
                    this.highlightedRow = null;
                    this.highlightedCells = [];
                    for (let i = 0; i < this.size; i++) {
                        this.highlightedCells.push([i, this.currentCol]);
                        this.workingMatrix[i][this.currentCol] -= minVal;
                    }

                    stepResult = {
                        type: 'col_reduce',
                        col: this.currentCol,
                        value: minVal,
                        message: `Column ${this.currentCol + 1}: subtract ${minVal} from every value in the column.`
                    };

                    this.currentCol++;
                } else {
                    this.phase = 'star_zeros';
                    this.starScanRow = 0;
                    this.starScanCol = 0;
                    this.clearHighlights();
                    stepResult = {
                        type: 'info',
                        message: 'Column reduction complete. Now starring independent zeros.'
                    };
                }
                break;

            case 'star_zeros': {
                const nextStar = this.findNextStarCandidate();
                if (nextStar) {
                    const [r, c] = nextStar;
                    this.maskMatrix[r][c] = 1;
                    this.highlightedCells = [[r, c]];
                    this.highlightedRow = r;
                    this.highlightedCol = c;
                    this.updateAssignmentsFromStars();

                    stepResult = {
                        type: 'star_zero',
                        row: r,
                        col: c,
                        message: `Star zero at row ${r + 1}, column ${c + 1} because its row and column do not already contain a starred zero.`
                    };
                } else {
                    this.phase = 'cover_starred_columns';
                    this.clearHighlights();
                    stepResult = {
                        type: 'info',
                        message: 'Initial starring complete. Covering columns that contain starred zeros.'
                    };
                }
                break;
            }

            case 'cover_starred_columns': {
                this.coverColumnsWithStars();
                this.updateAssignmentsFromStars();
                this.clearHighlights();

                const coveredCount = this.coveredCols.filter(Boolean).length;

                if (coveredCount === this.size) {
                    this.phase = 'complete';
                    stepResult = {
                        type: 'cover',
                        message: `All ${this.size} columns are covered by starred zeros. A complete assignment has been found.`
                    };
                } else {
                    this.phase = 'find_uncovered_zero';
                    stepResult = {
                        type: 'cover',
                        message: `Covered ${coveredCount} of ${this.size} columns. Need more zeros, so search for an uncovered zero.`
                    };
                }
                break;
            }

            case 'find_uncovered_zero': {
                const zero = this.findUncoveredZero();

                if (zero) {
                    const [r, c] = zero;
                    this.maskMatrix[r][c] = 2; // prime
                    this.highlightedCells = [[r, c]];
                    this.highlightedRow = r;
                    this.highlightedCol = c;

                    const starCol = this.findStarInRow(r);

                    if (starCol !== -1) {
                        this.coveredRows[r] = true;
                        this.coveredCols[starCol] = false;

                        stepResult = {
                            type: 'prime',
                            row: r,
                            col: c,
                            message: `Prime uncovered zero at row ${r + 1}, column ${c + 1}. Row ${r + 1} already has a starred zero, so cover this row and uncover column ${starCol + 1}.`
                        };
                    } else {
                        this.pathStart = { row: r, col: c };
                        this.phase = 'augment_path';

                        stepResult = {
                            type: 'prime',
                            row: r,
                            col: c,
                            message: `Prime uncovered zero at row ${r + 1}, column ${c + 1}. This row has no starred zero, so begin an augmenting path.`
                        };
                    }
                } else {
                    this.phase = 'adjust_matrix';
                    this.clearHighlights();

                    stepResult = {
                        type: 'info',
                        message: 'No uncovered zero exists. Adjusting the matrix to create new zeros.'
                    };
                }
                break;
            }

            case 'augment_path': {
                this.buildAugmentingPath();
                this.flipAugmentingPath();

                this.clearAllPrimes();
                this.coveredRows.fill(false);
                this.coveredCols.fill(false);
                this.updateAssignmentsFromStars();

                const pathCells = this.path.map(p => [p.row, p.col]);
                this.highlightedCells = pathCells;
                this.highlightedRow = null;
                this.highlightedCol = null;

                this.phase = 'cover_starred_columns';

                stepResult = {
                    type: 'augment',
                    message: `Built an augmenting path of length ${this.path.length}. Flipped starred and primed zeros along the path, then cleared all covers and primes.`
                };
                break;
            }

            case 'adjust_matrix': {
                const minVal = this.findSmallestUncoveredValue();
                this.lastAdjustmentValue = minVal;

                for (let i = 0; i < this.size; i++) {
                    for (let j = 0; j < this.size; j++) {
                        if (!this.coveredRows[i] && !this.coveredCols[j]) {
                            this.workingMatrix[i][j] -= minVal;
                        } else if (this.coveredRows[i] && this.coveredCols[j]) {
                            this.workingMatrix[i][j] += minVal;
                        }
                    }
                }

                this.highlightedCells = this.getUncoveredCells();
                this.highlightedRow = null;
                this.highlightedCol = null;
                this.phase = 'find_uncovered_zero';

                stepResult = {
                    type: 'adjust',
                    value: minVal,
                    message: `Smallest uncovered value is ${minVal}. Subtract it from all uncovered cells and add it to cells covered twice.`
                };
                break;
            }

            case 'complete':
                this.isDone = true;
                this.updateAssignmentsFromStars();

                stepResult = {
                    type: 'complete',
                    message: 'Hungarian algorithm complete. A full optimal assignment was found.'
                };
                break;
        }

        this.stepCount++;
        if (stepResult) {
            this.executionTrace.push(stepResult);
        }
        return stepResult;
    }

    clearHighlights() {
        this.highlightedCells = [];
        this.highlightedRow = null;
        this.highlightedCol = null;
    }

    rowHasStar(row) {
        for (let j = 0; j < this.size; j++) {
            if (this.maskMatrix[row][j] === 1) return true;
        }
        return false;
    }

    colHasStar(col) {
        for (let i = 0; i < this.size; i++) {
            if (this.maskMatrix[i][col] === 1) return true;
        }
        return false;
    }

    findNextStarCandidate() {
        while (this.starScanRow < this.size) {
            while (this.starScanCol < this.size) {
                const r = this.starScanRow;
                const c = this.starScanCol;
                this.starScanCol++;

                if (
                    this.workingMatrix[r][c] === 0 &&
                    !this.rowHasStar(r) &&
                    !this.colHasStar(c)
                ) {
                    return [r, c];
                }
            }
            this.starScanRow++;
            this.starScanCol = 0;
        }
        return null;
    }

    coverColumnsWithStars() {
        this.coveredCols.fill(false);
        this.coveredRows.fill(false);

        for (let j = 0; j < this.size; j++) {
            for (let i = 0; i < this.size; i++) {
                if (this.maskMatrix[i][j] === 1) {
                    this.coveredCols[j] = true;
                    break;
                }
            }
        }
    }

    findUncoveredZero() {
        for (let i = 0; i < this.size; i++) {
            if (this.coveredRows[i]) continue;
            for (let j = 0; j < this.size; j++) {
                if (!this.coveredCols[j] && this.workingMatrix[i][j] === 0) {
                    return [i, j];
                }
            }
        }
        return null;
    }

    findStarInRow(row) {
        for (let j = 0; j < this.size; j++) {
            if (this.maskMatrix[row][j] === 1) return j;
        }
        return -1;
    }

    findStarInCol(col) {
        for (let i = 0; i < this.size; i++) {
            if (this.maskMatrix[i][col] === 1) return i;
        }
        return -1;
    }

    findPrimeInRow(row) {
        for (let j = 0; j < this.size; j++) {
            if (this.maskMatrix[row][j] === 2) return j;
        }
        return -1;
    }

    buildAugmentingPath() {
        this.path = [];
        this.path.push({ row: this.pathStart.row, col: this.pathStart.col });

        let done = false;
        while (!done) {
            const last = this.path[this.path.length - 1];
            const starRow = this.findStarInCol(last.col);

            if (starRow !== -1) {
                this.path.push({ row: starRow, col: last.col });

                const primeCol = this.findPrimeInRow(starRow);
                this.path.push({ row: starRow, col: primeCol });
            } else {
                done = true;
            }
        }
    }

    flipAugmentingPath() {
        for (const cell of this.path) {
            if (this.maskMatrix[cell.row][cell.col] === 1) {
                this.maskMatrix[cell.row][cell.col] = 0;
            } else if (this.maskMatrix[cell.row][cell.col] === 2) {
                this.maskMatrix[cell.row][cell.col] = 1;
            }
        }
    }

    clearAllPrimes() {
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.maskMatrix[i][j] === 2) {
                    this.maskMatrix[i][j] = 0;
                }
            }
        }
    }

    findSmallestUncoveredValue() {
        let minVal = Infinity;

        for (let i = 0; i < this.size; i++) {
            if (this.coveredRows[i]) continue;
            for (let j = 0; j < this.size; j++) {
                if (!this.coveredCols[j] && this.workingMatrix[i][j] < minVal) {
                    minVal = this.workingMatrix[i][j];
                }
            }
        }

        return minVal;
    }

    getUncoveredCells() {
        const cells = [];
        for (let i = 0; i < this.size; i++) {
            if (this.coveredRows[i]) continue;
            for (let j = 0; j < this.size; j++) {
                if (!this.coveredCols[j]) {
                    cells.push([i, j]);
                }
            }
        }
        return cells;
    }

    updateAssignmentsFromStars() {
        this.assignments = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.maskMatrix[i][j] === 1) {
                    this.assignments.push({ row: i, col: j });
                }
            }
        }
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
            highlightedCol: this.highlightedCol,
            maskMatrix: this.maskMatrix.map(row => [...row]),
            path: this.path.map(p => ({ row: p.row, col: p.col })),
            lastAdjustmentValue: this.lastAdjustmentValue
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HungarianAlgorithm;
}
