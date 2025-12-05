import { CONFIG } from '../config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        this.ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawGrid() {
        this.ctx.strokeStyle = CONFIG.GRID_LINE_COLOR;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        // Líneas Verticales
        for (let x = 0; x <= this.canvas.width; x += CONFIG.GRID_SIZE) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        // Líneas Horizontales
        for (let y = 0; y <= this.canvas.height; y += CONFIG.GRID_SIZE) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }

    drawNodes(nodes) {
        nodes.forEach(node => {
            const x = node.x * CONFIG.GRID_SIZE;
            const y = node.y * CONFIG.GRID_SIZE;
            
            // Elegir color según tipo
            this.ctx.fillStyle = node.type === 'source' ? CONFIG.COLORS.SOURCE : CONFIG.COLORS.LOAD;
            
            // Dibujar un cuadrado simple (luego pondremos imágenes)
            // Dejamos un margen de 4px para que se vea bonito
            this.ctx.fillRect(x + 4, y + 4, CONFIG.GRID_SIZE - 8, CONFIG.GRID_SIZE - 8);
            
            // Borde si tiene energía
            if (node.isPowered) {
                this.ctx.strokeStyle = '#FFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(x + 4, y + 4, CONFIG.GRID_SIZE - 8, CONFIG.GRID_SIZE - 8);
            }
        });
    }

    drawCables(cables, nodes = []) {
        if (!cables.length) return;
        this.ctx.strokeStyle = CONFIG.COLORS.CABLE_OFF;
        this.ctx.lineWidth = 4;

        const drawLine = (from, to, isPowered) => {
            const startX = from.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
            const startY = from.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
            const endX = to.x * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;
            const endY = to.y * CONFIG.GRID_SIZE + CONFIG.GRID_SIZE / 2;

            this.ctx.strokeStyle = isPowered ? CONFIG.COLORS.CABLE_ON : CONFIG.COLORS.CABLE_OFF;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        };

        const findNode = (ref) => {
            if (typeof ref === 'number') return nodes.find(n => n.id === ref);
            return ref;
        };

        cables.forEach(cable => {
            const fromNode = findNode(cable.from);
            const toNode = findNode(cable.to);
            if (!fromNode || !toNode) return;
            const energized = fromNode.isPowered || toNode.isPowered;
            drawLine(fromNode, toNode, energized);
        });
    }
    
    drawEffects() {
        // Espacio para chispas
    }
    
    drawDebugInfo(simulation) {
        this.ctx.fillStyle = 'lime';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Nodos: ${simulation.nodes.length}`, 10, 20);
    }
}
