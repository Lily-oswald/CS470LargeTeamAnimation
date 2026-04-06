// =============================================================================
// src/views/DinicsView.js
// Builds DOM inside a container div and renders canvas from model state.
// Never modifies the model.
// =============================================================================

class DinicsView {
    constructor(containerId) {
        this.containerId = containerId;
        this.canvas      = null;
        this.ctx         = null;
        this._buildDOM();
    }

    // ── DOM setup ─────────────────────────────────────────────────────────────

    _buildDOM() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = '';
        container.style.cssText = 'max-width:1200px;margin:20px auto;';

        // Main card
        const card = document.createElement('div');
        card.style.cssText = 'background:white;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;';
        container.appendChild(card);

        // Status row
        const statusRow = document.createElement('div');
        statusRow.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 2fr;gap:12px;margin-bottom:20px;';
        card.appendChild(statusRow);

        this._phaseEl  = this._statBox(statusRow, 'Phase', 'Ready', '#378add');
        this._flowEl   = this._statBox(statusRow, 'Max Flow', '0', '#42b72a');
        this._actionEl = this._statBox(statusRow, 'Action', 'Press Play or Step to begin.', '#2c2c2c', true);

        // Canvas
        const canvasWrap = document.createElement('div');
        canvasWrap.style.cssText = 'border:0.5px solid #d3d1c7;border-radius:8px;overflow:hidden;margin-bottom:16px;background:#f9f9f9;';
        card.appendChild(canvasWrap);

        this.canvas = document.createElement('canvas');
        this.canvas.width  = 736;
        this.canvas.height = 360;
        this.canvas.style.cssText = 'display:block;width:100%;';
        this.ctx = this.canvas.getContext('2d');
        canvasWrap.appendChild(this.canvas);

        // Controls
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap;';
        card.appendChild(controls);

        this.btnPlay  = this._btn(controls, 'Play',   true);
        this.btnStep  = this._btn(controls, 'Step →', false);
        this.btnReset = this._btn(controls, '↺ Reset',false);

        const speedWrap = document.createElement('div');
        speedWrap.style.cssText = 'margin-left:auto;display:flex;align-items:center;gap:8px;font-size:13px;color:#65676b;';
        speedWrap.innerHTML = 'Speed <input type="range" id="dinics-speed" min="1" max="5" value="3" style="accent-color:#378add;width:90px;"> Fast';
        controls.appendChild(speedWrap);
        this.speedSlider = speedWrap.querySelector('input');

        // Step counter
        this._stepCounterEl = document.createElement('div');
        this._stepCounterEl.style.cssText = 'font-size:12px;color:#888780;margin-bottom:16px;';
        card.appendChild(this._stepCounterEl);

        // Legend
        const legend = document.createElement('div');
        legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:12px;margin-bottom:20px;padding:12px 16px;border:0.5px solid #d3d1c7;border-radius:8px;background:#f9f9f9;';
        legend.innerHTML = `
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:11px;height:11px;border-radius:50%;background:#378add;flex-shrink:0;display:inline-block;"></span> Source / Sink</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:11px;height:11px;border-radius:50%;background:#fff;border:1.5px solid #d1d5db;flex-shrink:0;display:inline-block;"></span> Unvisited</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:11px;height:11px;border-radius:50%;background:#e7f3ff;border:1.5px solid #378add;flex-shrink:0;display:inline-block;"></span> In level graph</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:20px;height:3px;background:#378add;border-radius:2px;flex-shrink:0;display:inline-block;"></span> Level-graph edge</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:20px;height:3px;background:#f59e0b;border-radius:2px;flex-shrink:0;display:inline-block;"></span> DFS path</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:20px;height:3px;background:#42b72a;border-radius:2px;flex-shrink:0;display:inline-block;"></span> Augmenting path</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;color:#65676b;"><span style="width:20px;height:3px;background:#e4e6eb;border:1px solid #bcc0c4;border-radius:2px;flex-shrink:0;display:inline-block;"></span> Saturated</span>
        `;
        card.appendChild(legend);

        // Pseudocode
        const pseudoWrap = document.createElement('div');
        pseudoWrap.style.cssText = 'border:0.5px solid #d3d1c7;border-radius:8px;overflow:hidden;';
        card.appendChild(pseudoWrap);

        const pseudoHeader = document.createElement('div');
        pseudoHeader.style.cssText = 'background:#f0f2f5;padding:10px 16px;font-size:12px;font-weight:600;color:#65676b;text-transform:uppercase;letter-spacing:.05em;border-bottom:0.5px solid #d3d1c7;font-family:-apple-system,sans-serif;';
        pseudoHeader.textContent = 'Pseudocode';
        pseudoWrap.appendChild(pseudoHeader);

        const pseudoBody = document.createElement('div');
        pseudoBody.style.cssText = 'padding:14px 16px;font-family:"Courier New",monospace;font-size:13px;color:#65676b;line-height:2;';
        pseudoBody.innerHTML = `
            <div style="color:#bcc0c4;">// Dinic's Algorithm</div>
            <div id="pc0" class="pc-line">while BFS(G, s, t) builds a level graph:</div>
            <div id="pc1" class="pc-line">&nbsp;&nbsp;while path = DFS(G_L, s, t) exists:</div>
            <div id="pc2" class="pc-line">&nbsp;&nbsp;&nbsp;&nbsp;bottleneck = min capacity along path</div>
            <div id="pc3" class="pc-line">&nbsp;&nbsp;&nbsp;&nbsp;push bottleneck flow along path</div>
            <div id="pc4" class="pc-line">&nbsp;&nbsp;&nbsp;&nbsp;update residual graph</div>
            <div id="pc5" class="pc-line">&nbsp;&nbsp;<span style="color:#bcc0c4;">// blocking flow complete for this level graph</span></div>
            <div id="pc6" class="pc-line"><span style="color:#bcc0c4;">// BFS cannot reach t → max flow achieved</span></div>
        `;
        pseudoWrap.appendChild(pseudoBody);
    }

    _statBox(parent, label, value, valueColor, wide) {
        const box = document.createElement('div');
        box.style.cssText = 'border:0.5px solid #d3d1c7;border-radius:8px;padding:12px 16px;' + (wide ? 'grid-column:span 1;' : '');
        box.innerHTML = `
            <div style="font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:.05em;color:#65676b;margin-bottom:4px;">${label}</div>
            <div style="font-size:${wide?'13px':'18px'};font-weight:${wide?'400':'600'};color:${valueColor};line-height:1.4;">${value}</div>
        `;
        parent.appendChild(box);
        return box.querySelector('div:last-child');
    }

    _btn(parent, label, isPrimary) {
        const btn = document.createElement('button');
        btn.textContent = label;
        if (isPrimary) {
            btn.style.cssText = 'padding:8px 20px;border-radius:6px;border:none;font-size:14px;font-weight:500;cursor:pointer;background:#378add;color:white;transition:all .15s;';
        } else {
            btn.style.cssText = 'padding:8px 20px;border-radius:6px;border:0.5px solid #d3d1c7;font-size:14px;font-weight:500;cursor:pointer;background:white;color:#1c1e21;transition:all .15s;';
        }
        parent.appendChild(btn);
        return btn;
    }

    // ── Render ────────────────────────────────────────────────────────────────

    render(state) {
        this._updateStatus(state);
        this._drawCanvas(state);
    }

    _updateStatus(state) {
        const phaseLabels = {
            BFS_START:   'BFS — level graph',
            BFS_VISIT:   'BFS — level graph',
            BFS_DONE:    'BFS complete',
            DFS_MOVE:    'DFS — blocking flow',
            DFS_BACKTRACK:'DFS — backtrack',
            PUSH:        'Pushing flow',
            PHASE_DONE:  'Phase complete',
            DONE:        'Done ✓',
        };
        this._phaseEl.textContent  = phaseLabels[state.type] || 'Ready';
        this._flowEl.textContent   = state.totalFlow;
        this._actionEl.textContent = state.message;
        this._stepCounterEl.textContent = 'Step ' + (state.stepIndex + 1) + ' of ' + state.totalSteps;

        // Pseudocode highlight
        ['pc0','pc1','pc2','pc3','pc4','pc5','pc6'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            if (id === state.pcLine) {
                el.style.cssText = 'padding:1px 8px;border-radius:4px;background:#e7f3ff;color:#378add;font-weight:600;';
            } else {
                el.style.cssText = 'padding:1px 8px;border-radius:4px;';
            }
        });

        this.btnPlay.disabled  = state.isDone;
        this.btnStep.disabled  = state.isLast;
    }

    _drawCanvas(state) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 736, 360);
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, 736, 360);
        this._drawEdges(ctx, state);
        this._drawNodes(ctx, state);
    }

    _drawEdges(ctx, state) {
        const augSet = new Set((state.highlightEdges || []).map(e => e[0]+','+e[1]));
        const dfsSet = new Set((state.dfsEdges || []).map(e => e[0]+','+e[1]));
        const flow   = state.flow || [];

        for (const [u, v] of DINICS_EDGE_DEFS) {
            const pu  = DINICS_NODE_POS[u], pv = DINICS_NODE_POS[v];
            const key = u + ',' + v;
            const isDead  = state.deadEdges && state.deadEdges.has(key);
            const isLevel = state.levelEdges && state.levelEdges.has(key) && !isDead;
            const isDfs   = dfsSet.has(key);
            const isAug   = augSet.has(key);

            let color = '#d3d1c7', width = 1.5;
            if      (isAug)   { color = '#42b72a'; width = 4; }
            else if (isDfs)   { color = '#f59e0b'; width = 3; }
            else if (isLevel) { color = '#378add'; width = 2; }
            else if (isDead)  { color = '#e4e6eb'; width = 1.5; }

            this._drawArrow(ctx, pu.x, pu.y, pv.x, pv.y, color, width);

            const pushed  = flow[u] ? flow[u][v] || 0 : 0;
            const origCap = DINICS_EDGE_DEFS.find(e => e[0]===u && e[1]===v)[2];
            const mx = (pu.x+pv.x)/2, my = (pu.y+pv.y)/2;
            const dx = pv.x-pu.x, dy = pv.y-pu.y;
            const len = Math.sqrt(dx*dx+dy*dy)||1;
            const ox = -dy/len*15, oy = dx/len*15;

            ctx.font         = '11px -apple-system, sans-serif';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle    = isAug ? '#42b72a' : isLevel ? '#378add' : '#9ca3af';
            ctx.globalAlpha  = isDead ? 0.4 : 1;
            ctx.fillText(pushed > 0 ? pushed + '/' + origCap : '' + origCap, mx+ox, my+oy);
            ctx.globalAlpha  = 1;
        }

        // Faint back-edges
        if (flow.length) {
            for (const [u,v] of DINICS_EDGE_DEFS) {
                if (flow[u] && flow[u][v] > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.12;
                    this._drawArrow(ctx, DINICS_NODE_POS[v].x, DINICS_NODE_POS[v].y, DINICS_NODE_POS[u].x, DINICS_NODE_POS[u].y, '#888780', 1);
                    ctx.restore();
                }
            }
        }
    }

    _drawArrow(ctx, x1, y1, x2, y2, color, width) {
        const NODE_R = 22;
        const dx = x2-x1, dy = y2-y1;
        const len = Math.sqrt(dx*dx+dy*dy)||1;
        const ux = dx/len, uy = dy/len;
        const sx = x1+ux*NODE_R, sy = y1+uy*NODE_R;
        const ex = x2-ux*(NODE_R+7), ey = y2-uy*(NODE_R+7);

        ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(ex,ey);
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.stroke();

        const angle = Math.atan2(ey-sy, ex-sx);
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex-9*Math.cos(angle-0.4), ey-9*Math.sin(angle-0.4));
        ctx.lineTo(ex-9*Math.cos(angle+0.4), ey-9*Math.sin(angle+0.4));
        ctx.closePath(); ctx.fillStyle = color; ctx.fill();
    }

    _drawNodes(ctx, state) {
        const dfsSet = new Set(state.dfsPath || []);
        const augSet = new Set(state.highlightPath || []);

        for (let i = 0; i < DINICS_NODE_COUNT; i++) {
            const {x, y} = DINICS_NODE_POS[i];
            const lv = state.level ? state.level[i] : -1;

            let fill = '#ffffff', ring = '#d3d1c7', ringW = 1.5, textColor = '#1c1e21';
            if (i === DINICS_S || i === DINICS_T)         { fill='#378add'; ring='#378add'; ringW=2; textColor='#ffffff'; }
            if (augSet.has(i))                            { fill='#eaf3de'; ring='#42b72a'; ringW=2.5; textColor='#1c1e21'; }
            else if (dfsSet.has(i))                       { fill='#fff8e1'; ring='#f59e0b'; ringW=2.5; textColor='#1c1e21'; }
            else if (lv >= 0 && i !== DINICS_S && i !== DINICS_T) { fill='#e7f3ff'; ring='#378add'; ringW=2; }

            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.07)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
            ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2);
            ctx.fillStyle = fill; ctx.fill();
            ctx.restore();

            ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI*2);
            ctx.strokeStyle = ring; ctx.lineWidth = ringW; ctx.stroke();

            ctx.font = 'bold 13px -apple-system, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = textColor;
            ctx.fillText(i === DINICS_S ? 'S' : i === DINICS_T ? 'T' : String(i), x, y);

            if (lv >= 0) {
                ctx.font = '10px -apple-system, sans-serif';
                ctx.fillStyle = '#378add';
                ctx.fillText('L' + lv, x, y + 22 + 13);
            }
        }
    }
}