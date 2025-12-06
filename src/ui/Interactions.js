export class Interactions {
    constructor(canvas, simulation) {
        this.canvas = canvas;
        this.simulation = simulation;
        this.dragNode = null;
    }

    initListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
    }

    findNodeAt(x, y) {
        return this.simulation.nodes.find(n => Math.hypot(x - n.x, y - n.y) < n.radius + 5);
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.dragNode = this.findNodeAt(x, y) || null;
    }

    onMouseMove(e) {
        if (!this.dragNode) return;
        const rect = this.canvas.getBoundingClientRect();
        this.dragNode.x = e.clientX - rect.left;
        this.dragNode.y = e.clientY - rect.top;
        this.simulation.solvePowerFlow();
    }

    onMouseUp() {
        this.dragNode = null;
    }
}
