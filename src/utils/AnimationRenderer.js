/**
 * AnimationRenderer - Shared Graphics Library
 * 
 * Reusable rendering utilities for all algorithm animations.
 * Handles DOM manipulation, line drawing, and animation timing.
 */

class AnimationRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container element with id '${containerId}' not found`);
        }
    }

    /**
     * Clear all content from container
     */
    clear() {
        this.container.innerHTML = '';
    }

    /**
     * Create a styled box element
     * @param {Object} options - Box styling options
     * @returns {HTMLElement}
     */
    createBox(options = {}) {
        const box = document.createElement('div');
        box.className = options.className || 'box';
        
        const styles = {
            background: options.background || 'white',
            border: options.border || '0.5px solid #d3d1c7',
            borderRadius: options.borderRadius || '8px',
            padding: options.padding || '12px',
            textAlign: options.textAlign || 'center',
            transition: 'all 0.3s',
            ...options.styles
        };
        
        Object.assign(box.style, styles);
        
        if (options.content) {
            box.innerHTML = options.content;
        }
        
        if (options.onClick) {
            box.style.cursor = 'pointer';
            box.addEventListener('click', options.onClick);
        }
        
        return box;
    }

    /**
     * Create a metric display box
     * @param {string} label
     * @param {string|number} value
     * @returns {HTMLElement}
     */
    createMetric(label, value) {
        const metric = document.createElement('div');
        metric.className = 'metric';
        metric.innerHTML = `
            <div class="metric-label">${label}</div>
            <div class="metric-value">${value}</div>
        `;
        return metric;
    }

    /**
     * Update existing metric value
     * @param {HTMLElement} metric
     * @param {string|number} value
     */
    updateMetric(metric, value) {
        const valueEl = metric.querySelector('.metric-value');
        if (valueEl) {
            valueEl.textContent = value;
        }
    }

    /**
     * Draw a line between two elements
     * @param {HTMLElement} from - Source element
     * @param {HTMLElement} to - Target element
     * @param {Object} options - Line styling options
     * @returns {HTMLElement}
     */
    drawLine(from, to, options = {}) {
        const container = options.container || this.container;
        const containerRect = container.getBoundingClientRect();
        
        const fromRect = from.getBoundingClientRect();
        const toRect = to.getBoundingClientRect();
        
        // Calculate connection points (center of right edge to center of left edge)
        const x1 = fromRect.right - containerRect.left;
        const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
        const x2 = toRect.left - containerRect.left;
        const y2 = toRect.top + toRect.height / 2 - containerRect.top;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        const line = document.createElement('div');
        line.className = options.className || 'line';
        
        const styles = {
            position: 'absolute',
            left: x1 + 'px',
            top: y1 + 'px',
            width: length + 'px',
            height: options.thickness || '2px',
            background: options.color || '#639922',
            transformOrigin: 'left center',
            transform: `rotate(${angle}deg)`,
            transition: options.transition || 'all 0.3s',
            pointerEvents: 'none',
            ...options.styles
        };
        
        Object.assign(line.style, styles);
        
        return line;
    }

    /**
     * Create a log entry element
     * @param {string} message
     * @param {string} type - 'step', 'proposal', 'accept', 'reject', 'info'
     * @returns {HTMLElement}
     */
    createLogEntry(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = message;
        return entry;
    }

    /**
     * Add entry to scrollable log container
     * @param {HTMLElement} logContainer
     * @param {string} message
     * @param {string} type
     * @param {number} maxEntries
     */
    appendToLog(logContainer, message, type = 'info', maxEntries = 15) {
        const entry = this.createLogEntry(message, type);
        logContainer.insertBefore(entry, logContainer.firstChild);
        
        // Limit number of entries
        while (logContainer.children.length > maxEntries) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    /**
     * Create a button with standard styling
     * @param {string} text
     * @param {Function} onClick
     * @param {Object} options
     * @returns {HTMLElement}
     */
    createButton(text, onClick, options = {}) {
        const button = document.createElement('button');
        button.textContent = text;
        button.onclick = onClick;
        
        if (options.id) button.id = options.id;
        if (options.className) button.className = options.className;
        if (options.disabled) button.disabled = true;
        
        return button;
    }

    /**
     * Animate element with CSS classes
     * @param {HTMLElement} element
     * @param {string} className
     * @param {number} duration
     */
    animateClass(element, className, duration = 300) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }

    /**
     * Fade in an element
     * @param {HTMLElement} element
     * @param {number} duration
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms`;
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }

    /**
     * Highlight element temporarily
     * @param {HTMLElement} element
     * @param {number} duration
     */
    highlight(element, duration = 500) {
        const originalBorder = element.style.border;
        element.style.border = '2px solid #378add';
        element.style.boxShadow = '0 0 0 2px #378add';
        
        setTimeout(() => {
            element.style.border = originalBorder;
            element.style.boxShadow = '';
        }, duration);
    }

    /**
     * Create grid layout container
     * @param {Object} options
     * @returns {HTMLElement}
     */
    createGrid(options = {}) {
        const grid = document.createElement('div');
        grid.className = options.className || 'grid';
        
        const styles = {
            display: 'grid',
            gridTemplateColumns: options.columns || 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: options.gap || '12px',
            ...options.styles
        };
        
        Object.assign(grid.style, styles);
        return grid;
    }

    /**
     * Create flex container
     * @param {Object} options
     * @returns {HTMLElement}
     */
    createFlex(options = {}) {
        const flex = document.createElement('div');
        flex.className = options.className || 'flex';
        
        const styles = {
            display: 'flex',
            flexDirection: options.direction || 'row',
            gap: options.gap || '12px',
            alignItems: options.align || 'center',
            justifyContent: options.justify || 'flex-start',
            ...options.styles
        };
        
        Object.assign(flex.style, styles);
        return flex;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimationRenderer;
}