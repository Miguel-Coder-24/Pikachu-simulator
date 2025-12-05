import { CONFIG } from '../config.js';

export class Interactions {
    constructor(canvas, simulation, renderer) {
        this.canvas = canvas;
        this.simulation = simulation;
        this.renderer = renderer;
        this.currentType = 'source';
    }

    initListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convertir coordenadas de Píxeles a Grilla
        const gridX = Math.floor(mouseX / CONFIG.GRID_SIZE);
        const gridY = Math.floor(mouseY / CONFIG.GRID_SIZE);

        // Click izquierdo usa el tipo seleccionado en la UI
        // Click derecho sigue creando cargas para agilizar
        const type = e.button === 2 ? 'load' : this.currentType;

        this.simulation.addNode(gridX, gridY, type);
    }

    setPlacementType(type) {
        this.currentType = type;
    }
}
