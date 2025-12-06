import { CONFIG } from '../config.js';

export class Interactions {
    constructor(canvas, simulation) {
        this.canvas = canvas;
        this.simulation = simulation;
        
        this.dragNode = null;
        this.mode = 'normal'; // 'normal' (arrastrar) o 'cut' (tijeras)
    }

    initListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
    }

    // Cambiar entre modos
    setMode(mode) {
        this.mode = mode;
        if (mode === 'cut') {
            this.canvas.classList.add('cursor-cut');
        } else {
            this.canvas.classList.remove('cursor-cut');
        }
    }

    // Matemáticas: Distancia de un punto (p) a un segmento de línea (v-w)
    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        
        const projectionX = v.x + t * (w.x - v.x);
        const projectionY = v.y + t * (w.y - v.y);
        
        return Math.hypot(p.x - projectionX, p.y - projectionY);
    }

    findLineAt(x, y) {
        // Tolerancia de 10 píxeles para "atinarle" a la línea
        const threshold = 10; 
        
        return this.simulation.lines.find(line => {
            // Solo detectar líneas activas
            if (!line.status) return false;
            
            const dist = this.distToSegment(
                {x, y}, 
                {x: line.from.x, y: line.from.y}, 
                {x: line.to.x, y: line.to.y}
            );
            return dist < threshold;
        });
    }

    findNodeAt(x, y) {
        return this.simulation.nodes.find(n => Math.hypot(x - n.x, y - n.y) < n.radius + 5);
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.mode === 'cut') {
            // MODO TIJERAS: Buscar línea y cortarla
            const line = this.findLineAt(x, y);
            if (line) {
                this.simulation.cutLine(line);
            }
        } else {
            // MODO NORMAL: Arrastrar nodos
            this.dragNode = this.findNodeAt(x, y) || null;
        }
    }

    onMouseMove(e) {
        // Solo arrastramos si estamos en modo normal
        if (this.mode === 'normal' && this.dragNode) {
            const rect = this.canvas.getBoundingClientRect();
            this.dragNode.x = e.clientX - rect.left;
            this.dragNode.y = e.clientY - rect.top;
            this.simulation.solvePowerFlow(); // Recalcular en tiempo real
        }
    }

    onMouseUp() {
        this.dragNode = null;
    }
}