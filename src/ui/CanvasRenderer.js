import { CONFIG } from '../config.js';

export class CanvasRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        // Offset para la animación de hormigas (línea punteada)
        this.dashOffset = 0; 
    }

    clear() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, width, height);
        
        // Efecto viñeta (sombra en las esquinas)
        const gradient = this.ctx.createRadialGradient(width/2, height/2, width/3, width/2, height/2, width);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0,0,width,height);
    }

    drawGrid() {
        const step = 40;
        const { width, height } = this.canvas;

        this.ctx.strokeStyle = CONFIG.GRID_LINE_COLOR;
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        
        // Dibujamos solo líneas sutiles
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
        // Actualizamos el offset global para animar líneas punteadas
        this.dashOffset -= 0.5;

        // 1. Dibujar cables base (la estructura física)
        lines.forEach(line => {
            const { from, to, status } = line;
            
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);

            if (!status) {
                // Línea caída/apagada
                this.ctx.strokeStyle = CONFIG.COLORS.LINE_OFF;
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([5, 5]);
                this.ctx.shadowBlur = 0;
                this.ctx.stroke();
            } else {
                // Línea activa - Base oscura
                this.ctx.strokeStyle = '#222';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([]);
                this.ctx.stroke();
            }
        });

        // 2. Dibujar Flujo de Energía (Partículas) sobre las líneas activas
        this.ctx.shadowBlur = 10; // Glow effect
        
        lines.forEach(line => {
            if (!line.status) return;

            const loadPct = (line.currentLoadMva / line.capacityMva);
            
            // Color según carga
            let color = CONFIG.COLORS.LINE_NORMAL; // Amarillo
            let particleSize = 2;
            let speed = 1;
            
            if (loadPct > 1.0) {
                color = CONFIG.COLORS.LINE_CRITICAL; // Rojo
                this.ctx.shadowColor = color;
                particleSize = 3;
                speed = 2.5; // Muy rápido si hay sobrecarga
            } else {
                this.ctx.shadowColor = color;
                // Más carga = más velocidad visual
                speed = 0.5 + (loadPct * 1.5); 
            }

            // Dibujar la "electricidad" como una línea delgada brillante en el centro
            this.ctx.beginPath();
            this.ctx.moveTo(line.from.x, line.from.y);
            this.ctx.lineTo(line.to.x, line.to.y);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Dibujar Partículas (Paquetes de energía)
            // Usamos el tiempo actual para calcular posición
            const time = Date.now() / 1000;
            const dist = Math.hypot(line.to.x - line.from.x, line.to.y - line.from.y);
            const numParticles = Math.max(1, Math.floor(dist / 30)); // 1 partícula cada 30px

            for(let i=0; i<numParticles; i++) {
                // offset escalonado para que no vayan todas juntas
                const offset = i / numParticles; 
                // Formula de movimiento cíclico (0 a 1)
                let t = (time * speed + offset) % 1; 

                // Interpolación lineal (Lerp) para encontrar posición (x,y)
                const px = line.from.x + (line.to.x - line.from.x) * t;
                const py = line.from.y + (line.to.y - line.from.y) * t;

                this.ctx.fillStyle = '#FFF'; // Núcleo blanco caliente
                this.ctx.beginPath();
                this.ctx.arc(px, py, particleSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.shadowBlur = 0; // Resetear glow para lo siguiente
        this.ctx.setLineDash([]);
    }

    drawNodes(nodes) {
        nodes.forEach(node => {
            // Configurar Glow según tipo
            const isGen = node.type === 'gen';
            const baseColor = isGen ? CONFIG.COLORS.SOURCE : CONFIG.COLORS.LOAD;
            const glowColor = isGen ? CONFIG.COLORS.SOURCE_GLOW : CONFIG.COLORS.LOAD_GLOW;

            // 1. Glow externo
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = glowColor;

            this.ctx.fillStyle = baseColor;
            this.ctx.beginPath();

            if (isGen) {
                // Generador: Círculo sólido brillante
                this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
            } else {
                // Carga: Cuadrado
                this.ctx.rect(node.x - node.radius, node.y - node.radius, node.radius * 2, node.radius * 2);
            }
            this.ctx.fill();

            // 2. Núcleo (Estilo UI futurista)
            this.ctx.shadowBlur = 0; // Quitar glow para el detalle
            this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 3. Texto
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 11px "Consolas"';
            this.ctx.textAlign = 'center';
            // Fondo semitransparente para el texto para legibilidad
            this.ctx.fillText(node.name, node.x, node.y - node.radius - 8);
        });
    }

    render(simulation) {
        this.clear();
        this.drawGrid();
        this.drawLines(simulation.lines);
        this.drawNodes(simulation.nodes);
    }
}