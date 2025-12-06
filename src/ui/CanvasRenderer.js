// src/ui/CanvasRenderer.js

import { CONFIG } from '../config.js';

export class CanvasRenderer {
    // 1. Recibimos los assets en el constructor
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets; // Guardamos las imágenes
    }

    clear() {
        // (Igual que antes...)
        const { width, height } = this.canvas;
        this.ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, width, height);
        const gradient = this.ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0,0,width,height);
    }

    drawGrid() {
        // (Igual que antes...)
        const step = 40;
        const { width, height } = this.canvas;
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
    }

    drawLines(lines) {
        // 1. Dibujar cables base (Igual que antes)
        lines.forEach(line => {
            const { from, to, status } = line;
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);

            if (!status) {
                this.ctx.strokeStyle = CONFIG.COLORS.LINE_OFF;
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]);
                this.ctx.shadowBlur = 0;
                this.ctx.stroke();
            } else {
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([]);
                this.ctx.stroke();
            }
        });

        // 2. NUEVO: Dibujar "Rayos" de energía
        this.ctx.setLineDash([]);
        this.ctx.lineCap = 'round'; // Puntas redondeadas para los rayos

        lines.forEach(line => {
            if (!line.status) return;

            const loadPct = (line.currentLoadMva / line.capacityMva);
            let color = CONFIG.COLORS.LINE_NORMAL;
            let rayLength = 15; // Longitud del rayo
            let speed = 1;
            let glowSize = 10;
            
            if (loadPct > 1.0) {
                color = CONFIG.COLORS.LINE_CRITICAL;
                speed = 2.5;
                rayLength = 25; // Rayos más largos si hay peligro
                glowSize = 20;
            } else {
                speed = 0.5 + (loadPct * 2.0); 
            }

            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = glowSize;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;

            // Cálculos vectoriales para dirección del rayo
            const dx = line.to.x - line.from.x;
            const dy = line.to.y - line.from.y;
            const dist = Math.hypot(dx, dy);
            // Vectores unitarios normalizados (dirección)
            const nx = dx / dist;
            const ny = dy / dist;

            const time = Date.now() / 1000;
            // Menos partículas pero más impactantes
            const numParticles = Math.max(1, Math.floor(dist / 60)); 

            for(let i=0; i<numParticles; i++) {
                const offset = i / numParticles; 
                let t = (time * speed + offset) % 1; 

                // Posición de la cabeza del rayo
                const headX = line.from.x + dx * t;
                const headY = line.from.y + dy * t;

                // Posición de la cola del rayo (hacia atrás según la dirección)
                const tailX = headX - nx * rayLength;
                const tailY = headY - ny * rayLength;

                // Dibujar el rayo como una línea brillante
                this.ctx.beginPath();
                this.ctx.moveTo(tailX, tailY);
                this.ctx.lineTo(headX, headY);
                
                // Truco visual: el núcleo es blanco, el borde es el color
                this.ctx.strokeStyle = '#FFF'; 
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // Segunda pasada para el color exterior (el glow lo hace el shadowBlur)
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });

        this.ctx.shadowBlur = 0;
        this.ctx.lineCap = 'butt'; // Reset
    }

    // 3. NUEVO: Dibujar Nodos usando IMÁGENES
    drawNodes(nodes) {
        nodes.forEach(node => {
            const isGen = node.type === 'gen';
            // Seleccionar la imagen correcta
            const img = isGen ? this.assets.gen : this.assets.load;
            const glowColor = isGen ? CONFIG.COLORS.SOURCE_GLOW : CONFIG.COLORS.LOAD_GLOW;
            
            // Tamaño del ícono
            const size = isGen ? 40 : 32; 

            // Glow intenso detrás del ícono
            this.ctx.shadowBlur = 25;
            this.ctx.shadowColor = glowColor;
            
            // Dibujar imagen centrada en las coordenadas del nodo
            // drawImage(imagen, x - mitad_ancho, y - mitad_alto, ancho, alto)
            this.ctx.drawImage(img, node.x - size/2, node.y - size/2, size, size);

            // Reset glow para el texto
            this.ctx.shadowBlur = 0;

            // Texto
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px "Consolas"';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(node.name, node.x, node.y + size/2 + 12);
        });
    }

    render(simulation) {
        this.clear();
        this.drawGrid();
        this.drawLines(simulation.lines);
        this.drawNodes(simulation.nodes);
    }
}