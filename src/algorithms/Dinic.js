// =============================================================================
// src/algorithms/Dinic.js
// Pure algorithm logic — no DOM, no canvas.
// Precomputes every animation step upfront so the model can replay them.
// =============================================================================

const DINICS_NODE_COUNT = 7;
const DINICS_S = 0;
const DINICS_T = 6;

const DINICS_NODE_POS = [
    { x: 70,  y: 180 }, // 0 source
    { x: 210, y:  90 }, // 1
    { x: 210, y: 270 }, // 2
    { x: 370, y:  90 }, // 3
    { x: 370, y: 270 }, // 4
    { x: 530, y: 180 }, // 5
    { x: 660, y: 180 }, // 6 sink
];

const DINICS_EDGE_DEFS = [
    [0,1,10],[0,2,10],
    [1,3, 4],[1,4, 8],
    [2,3, 9],[2,4, 6],
    [3,5,10],[4,5,10],
    [5,6,20],
];

class DinicsAlgorithm {
    constructor() {
        this.nodeCount = DINICS_NODE_COUNT;
        this.nodePOS   = DINICS_NODE_POS;
        this.edgeDefs  = DINICS_EDGE_DEFS;
        this.S         = DINICS_S;
        this.T         = DINICS_T;
        this._buildSteps();
    }

    _buildSteps() {
        this.steps = [];

        const cap  = Array.from({length: this.nodeCount}, () => new Array(this.nodeCount).fill(0));
        const flow = Array.from({length: this.nodeCount}, () => new Array(this.nodeCount).fill(0));
        for (const [u,v,c] of this.edgeDefs) cap[u][v] = c;

        const rcap = (u,v) => cap[u][v] - flow[u][v];
        let totalFlow  = 0;
        let phaseCount = 0;

        while (true) {
            // ── BFS: build level graph ──────────────────────────────────────
            const level = new Array(this.nodeCount).fill(-1);
            level[this.S] = 0;
            const queue      = [this.S];
            const levelEdges = new Set();

            this.steps.push({
                type:           'BFS_START',
                phaseCount:     phaseCount + 1,
                totalFlow,
                level:          level.slice(),
                levelEdges:     new Set(levelEdges),
                deadEdges:      new Set(),
                dfsPath:        [],
                dfsEdges:       [],
                highlightPath:  [],
                highlightEdges: [],
                flow:           flow.map(r => r.slice()),
                message:        'Phase ' + (phaseCount + 1) + ': BFS — building level graph from source.',
                pcLine:         'pc0',
            });

            let qi = 0;
            while (qi < queue.length) {
                const u = queue[qi++];
                for (let v = 0; v < this.nodeCount; v++) {
                    if (rcap(u,v) > 0 && level[v] < 0) {
                        level[v] = level[u] + 1;
                        queue.push(v);
                        levelEdges.add(u + ',' + v);
                        this.steps.push({
                            type:           'BFS_VISIT',
                            totalFlow,
                            level:          level.slice(),
                            levelEdges:     new Set(levelEdges),
                            deadEdges:      new Set(),
                            dfsPath:        [],
                            dfsEdges:       [],
                            highlightPath:  [],
                            highlightEdges: [],
                            flow:           flow.map(r => r.slice()),
                            message:        'BFS: node ' + u + ' (L' + level[u] + ') → neighbor ' + v + ' assigned level ' + level[v] + '.',
                            pcLine:         'pc0',
                        });
                    }
                }
            }

            if (level[this.T] < 0) {
                this.steps.push({
                    type:           'DONE',
                    totalFlow,
                    level:          level.slice(),
                    levelEdges:     new Set(levelEdges),
                    deadEdges:      new Set(),
                    dfsPath:        [],
                    dfsEdges:       [],
                    highlightPath:  [],
                    highlightEdges: [],
                    flow:           flow.map(r => r.slice()),
                    message:        'BFS cannot reach sink. Max flow = ' + totalFlow + '.',
                    pcLine:         'pc6',
                });
                break;
            }

            this.steps.push({
                type:           'BFS_DONE',
                totalFlow,
                level:          level.slice(),
                levelEdges:     new Set(levelEdges),
                deadEdges:      new Set(),
                dfsPath:        [],
                dfsEdges:       [],
                highlightPath:  [],
                highlightEdges: [],
                flow:           flow.map(r => r.slice()),
                message:        'Level graph built! Sink is at level ' + level[this.T] + '. Starting DFS for blocking flow.',
                pcLine:         'pc1',
            });

            // ── DFS: find blocking flow ─────────────────────────────────────
            const iter      = new Array(this.nodeCount).fill(0);
            const deadEdges = new Set();

            const dfs = (u, pushed, path, pathEdges) => {
                if (u === this.T) return pushed;
                for (let v = iter[u]; v < this.nodeCount; v++) {
                    iter[u] = v;
                    if (rcap(u,v) > 0 && level[v] === level[u] + 1) {
                        const newPath      = path.concat([v]);
                        const newPathEdges = pathEdges.concat([[u,v]]);

                        this.steps.push({
                            type:           'DFS_MOVE',
                            totalFlow,
                            level:          level.slice(),
                            levelEdges:     new Set(levelEdges),
                            deadEdges:      new Set(deadEdges),
                            dfsPath:        newPath.slice(),
                            dfsEdges:       newPathEdges.slice(),
                            highlightPath:  [],
                            highlightEdges: [],
                            flow:           flow.map(r => r.slice()),
                            message:        'DFS: moving ' + u + ' → ' + v + ' (L' + level[u] + ' → L' + level[v] + ')',
                            pcLine:         'pc1',
                        });

                        const d = dfs(v, Math.min(pushed, rcap(u,v)), newPath, newPathEdges);
                        if (d > 0) return d;
                    }
                }
                level[u] = -1;
                this.steps.push({
                    type:           'DFS_BACKTRACK',
                    totalFlow,
                    level:          level.slice(),
                    levelEdges:     new Set(levelEdges),
                    deadEdges:      new Set(deadEdges),
                    dfsPath:        path.slice(),
                    dfsEdges:       pathEdges.slice(),
                    highlightPath:  [],
                    highlightEdges: [],
                    flow:           flow.map(r => r.slice()),
                    message:        'Dead end at node ' + u + ' — backtracking.',
                    pcLine:         'pc1',
                });
                return 0;
            };

            while (true) {
                const pathFlow = dfs(this.S, Infinity, [this.S], []);
                if (pathFlow === 0) break;

                let augPath = [], augEdges = [];
                for (let i = this.steps.length - 1; i >= 0; i--) {
                    const s = this.steps[i];
                    if (s.type === 'DFS_MOVE' && s.dfsPath[s.dfsPath.length - 1] === this.T) {
                        augPath  = s.dfsPath.slice();
                        augEdges = s.dfsEdges.slice();
                        break;
                    }
                }

                for (const [u,v] of augEdges) {
                    flow[u][v] += pathFlow;
                    flow[v][u] -= pathFlow;
                    if (rcap(u,v) === 0) deadEdges.add(u + ',' + v);
                }
                totalFlow += pathFlow;

                this.steps.push({
                    type:           'PUSH',
                    totalFlow,
                    level:          level.slice(),
                    levelEdges:     new Set(levelEdges),
                    deadEdges:      new Set(deadEdges),
                    dfsPath:        [],
                    dfsEdges:       [],
                    highlightPath:  augPath.slice(),
                    highlightEdges: augEdges.slice(),
                    flow:           flow.map(r => r.slice()),
                    pushAmount:     pathFlow,
                    message:        'Pushed ' + pathFlow + ' units along path. Total flow: ' + totalFlow + '.',
                    pcLine:         'pc3',
                });
            }

            this.steps.push({
                type:           'PHASE_DONE',
                totalFlow,
                level:          level.slice(),
                levelEdges:     new Set(levelEdges),
                deadEdges:      new Set(deadEdges),
                dfsPath:        [],
                dfsEdges:       [],
                highlightPath:  [],
                highlightEdges: [],
                flow:           flow.map(r => r.slice()),
                message:        'Blocking flow complete for phase ' + (phaseCount + 1) + '. Total flow: ' + totalFlow + '. Re-running BFS.',
                pcLine:         'pc5',
            });

            phaseCount++;
        }
    }

    getSteps()      { return this.steps; }
    getTotalSteps() { return this.steps.length; }
}