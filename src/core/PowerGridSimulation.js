import { PowerNode } from './PowerNode.js';

export class PowerGridSimulation {
    constructor() {
        this.nodes = [];  // Lista de objetos PowerNode
        this.cables = []; // Lista de conexiones {from: id, to: id}
        this.isDirty = false; // Bandera para saber si hay que recalcular
        this.nodeIdCounter = 0;
    }

    // Agregar un nodo en una posición de la cuadrícula
    addNode(gridX, gridY, type) {
        // Evitar poner dos nodos en el mismo lugar
        const existing = this.nodes.find(n => n.x === gridX && n.y === gridY);
        if (existing) return null;

        const node = new PowerNode(this.nodeIdCounter++, gridX, gridY, type);
        this.nodes.push(node);
        this.isDirty = true; // ¡Algo cambió! Recalcular flujo
        
        console.log(`Nodo agregado: ${type} en (${gridX}, ${gridY})`);
        return node;
    }

    addCable(fromId, toId) {
        if (fromId === toId) return;
        const from = this.nodes.find(n => n.id === fromId);
        const to = this.nodes.find(n => n.id === toId);
        if (!from || !to) return;

        const exists = this.cables.find(c => {
            const a = typeof c.from === 'number' ? c.from : c.from?.id;
            const b = typeof c.to === 'number' ? c.to : c.to?.id;
            return (a === fromId && b === toId) || (a === toId && b === fromId);
        });
        if (exists) return;

        this.cables.push({ from, to });
        this.isDirty = true;
    }

    // Método para actualizar cosas que cambian con el tiempo (animaciones, partículas)
    update(deltaTime) {
        // Aquí iría lógica de "sobrecalentamiento" progresivo, etc.
    }

    reset() {
        this.nodes = [];
        this.cables = [];
        this.nodeIdCounter = 0;
        this.isDirty = true;
    }
}
