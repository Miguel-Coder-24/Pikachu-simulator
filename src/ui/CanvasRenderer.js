import { CONFIG } from '../config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    clear() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, width, height);
    }

    drawGrid() {
        const step = 40;
        const { width, height } = this.canvas;

        // Grid fino
        this.ctx.strokeStyle = CONFIG.GRID_LINE_COLOR;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += step) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }
        this.ctx.stroke();

        // Grid grueso cada 5 celdas para referencia rápida
        this.ctx.strokeStyle = CONFIG.COLORS.GRID_ACCENT || CONFIG.GRID_LINE_COLOR;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        const boldStep = step * 5;
        for (let x = 0; x <= width; x += boldStep) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += boldStep) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
        }
        this.ctx.stroke();
    }

    drawLines(lines) {
        lines.forEach(line => {
            const start = line.from;
            const end = line.to;

            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);

            if (!line.status) {
                this.ctx.setLineDash([5, 5]);
                this.ctx.strokeStyle = '#333';
                this.ctx.lineWidth = 1;
            } else {
                this.ctx.setLineDash([]);
                const loadPct = (line.currentLoadMva / line.capacityMva) * 100;
                let color = '#4CAF50';
                let width = 1.5;

                if (loadPct > 100) {
                    const blink = Math.sin(Date.now() / 100) > 0 ? 255 : 100;
                    color = `rgb(255, ${blink}, 0)`;
                    width = 3;
                } else if (loadPct > 85) {
                    color = '#FF9800';
                    width = 2.5;
                }

                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = width;
            }
            this.ctx.stroke();
        });
    }

    drawNodes(nodes) {
        nodes.forEach(node => {
            this.ctx.beginPath();
            if (node.type === 'gen') {
                this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            } else {
                this.ctx.rect(node.x - node.radius, node.y - node.radius, node.radius * 2, node.radius * 2);
            }
            this.ctx.fillStyle = node.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.stroke();

            this.ctx.fillStyle = '#aaa';
            this.ctx.font = '10px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.name, node.x, node.y - node.radius - 4);
        });
    }

    render(simulation) {
        this.clear();
        this.drawGrid();
        this.drawLines(simulation.lines);
        this.drawNodes(simulation.nodes);
    }
}
