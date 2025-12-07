import { CONFIG } from '../config.js';
// Importamos el contorno simple como respaldo por si falla el GeoJSON
import { COLOMBIA_OUTLINE } from '../data/colombia_outline.js';

export class CanvasRenderer {
    constructor(canvas, assets, camera) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.assets = assets.images;
        this.mapData = assets.mapGeoJSON; 
        
        this.camera = camera;
        
        // Coincide con PowerGridSimulation
        this.geoBounds = { 
            minLon: -82.0, maxLon: -66.0, 
            minLat: -4.5,  maxLat: 13.5 
        };
    }

    // --- PROYECCIÓN UNIFICADA ---
    project(lat, lon) {
        const xPct = (lon - this.geoBounds.minLon) / (this.geoBounds.maxLon - this.geoBounds.minLon);
        const yPct = (this.geoBounds.maxLat - lat) / (this.geoBounds.maxLat - this.geoBounds.minLat);

        return {
            x: xPct * CONFIG.WORLD_WIDTH,
            y: yPct * CONFIG.WORLD_HEIGHT
        };
    }

    render(simulation) {
        this.clear();

        this.ctx.save();
        // Aplicar Cámara
        this.ctx.translate(this.camera.x, this.camera.y);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);

        // Dibujar Mundo
        this.drawMapLayer();
        this.drawGrid();
        this.drawLines(simulation.lines);
        this.drawNodes(simulation.nodes);

        this.ctx.restore();
    }

    clear() {
        const { width, height } = this.canvas;
        this.ctx.fillStyle = CONFIG.BACKGROUND_COLOR;
        this.ctx.fillRect(0, 0, width, height);
    }

    drawMapLayer() {
        // Opción A: Intentar dibujar GeoJSON (Alta calidad)
        if (this.mapData) {
            this.drawGeoJSON();
        } 
        // Opción B: Fallback a contorno simple (Si falló la descarga)
        else {
            this.drawSimpleOutline();
        }
    }

    drawGeoJSON() {
        this.ctx.beginPath();
        this.mapData.features.forEach(feature => {
            const geometry = feature.geometry;
            if (geometry.type === 'Polygon') {
                this.drawPolygonPath(geometry.coordinates);
            } else if (geometry.type === 'MultiPolygon') {
                geometry.coordinates.forEach(poly => this.drawPolygonPath(poly));
            }
        });
        this.styleMap();
    }

    drawSimpleOutline() {
        if (!COLOMBIA_OUTLINE) return;
        this.ctx.beginPath();
        // COLOMBIA_OUTLINE es un array simple de coords [lon, lat]
        COLOMBIA_OUTLINE.forEach((coord, i) => {
            const p = this.project(coord[1], coord[0]); // lat, lon
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        });
        this.ctx.closePath();
        this.styleMap();
    }

    drawPolygonPath(coordinates) {
        const ring = coordinates[0]; 
        ring.forEach((coord, i) => {
            const [lon, lat] = coord;
            const p = this.project(lat, lon);
            if (i === 0) this.ctx.moveTo(p.x, p.y);
            else this.ctx.lineTo(p.x, p.y);
        });
    }

    styleMap() {
        this.ctx.fillStyle = 'rgba(0, 40, 50, 0.3)'; 
        this.ctx.fill();
        this.ctx.lineWidth = 1.5 / this.camera.zoom; 
        this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
        this.ctx.stroke();
    }

    drawLines(lines) {
        const baseWidth = Math.max(0.5, 2 / this.camera.zoom);

        // Cables fondo
        lines.forEach(line => {
            const { from, to, status } = line;
            this.ctx.beginPath();
            this.ctx.moveTo(from.x, from.y);
            this.ctx.lineTo(to.x, to.y);
            this.ctx.lineWidth = status ? baseWidth : baseWidth * 0.5;
            this.ctx.strokeStyle = status ? '#333' : '#222';
            if (!status) this.ctx.setLineDash([5 / this.camera.zoom, 5 / this.camera.zoom]);
            else this.ctx.setLineDash([]);
            this.ctx.stroke();
        });

        // Energía
        this.ctx.setLineDash([]);
        this.ctx.lineCap = 'round';
        const time = Date.now() / 1000;

        lines.forEach(line => {
            if (!line.status) return;
            const loadPct = line.currentLoadMva / line.capacityMva;
            let color = CONFIG.COLORS.LINE_NORMAL;
            let speed = 1;
            if (loadPct > 1.0) { color = CONFIG.COLORS.LINE_CRITICAL; speed = 3.0; } 
            else { speed = 0.5 + (loadPct * 2.5); }

            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = baseWidth;

            const dx = line.to.x - line.from.x;
            const dy = line.to.y - line.from.y;
            const dist = Math.hypot(dx, dy);
            const numParticles = Math.max(1, Math.floor(dist / 100)); 
            const rayLength = 20 / this.camera.zoom;

            for (let i = 0; i < numParticles; i++) {
                const offset = i / numParticles;
                let t = (time * speed + offset) % 1;
                const headX = line.from.x + dx * t;
                const headY = line.from.y + dy * t;
                const tailX = headX - (dx / dist) * rayLength;
                const tailY = headY - (dy / dist) * rayLength;

                this.ctx.beginPath();
                this.ctx.moveTo(tailX, tailY);
                this.ctx.lineTo(headX, headY);
                this.ctx.stroke();
            }
        });
        this.ctx.shadowBlur = 0;
        this.ctx.lineCap = 'butt';
    }

    drawNodes(nodes) {
        // Obtenemos el zoom actual para usarlo en la lógica
        const currentZoom = this.camera.zoom;
        const invScale = 1 / currentZoom;
        const iconSize = 32; 

        nodes.forEach(node => {
            const isGen = node.type === 'gen';
            const img = isGen ? this.assets.gen : this.assets.load;
            
            if (!img) return; 

            this.ctx.save();
            this.ctx.translate(node.x, node.y);
            
            // Mantiene el icono del mismo tamaño sin importar el zoom
            this.ctx.scale(invScale, invScale);

            if (isGen) {
                const pulse = 1 + Math.sin(Date.now() / 300) * 0.1;
                this.ctx.scale(pulse, pulse);
            }

            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = node.glowColor;
            this.ctx.drawImage(img, -iconSize/2, -iconSize/2, iconSize, iconSize);

            // --- INICIO DE LA MODIFICACIÓN ---
            
            // Definimos cuándo debe aparecer el texto
            // Si es 'gen', aparece casi siempre (0.5)
            // Si es municipio/carga, solo aparece si el zoom es mayor a 2.5 (tienes que acercarte)
            const umbralTexto = isGen ? 0.5 : 6.0;

            if (currentZoom > umbralTexto) {
                this.ctx.font = 'bold 12px Consolas';
                this.ctx.fillStyle = '#fff';
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = '#000';
                
                // Dibujamos el texto
                this.ctx.fillText(node.name, 0, iconSize/2 + 12);
            }
            // --- FIN DE LA MODIFICACIÓN ---

            this.ctx.restore();
        });
    }

    drawGrid() {
        if (this.camera.zoom < 0.8) return; 
        const step = 200; 
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1 / this.camera.zoom;
        this.ctx.beginPath();
        for (let x = 0; x <= CONFIG.WORLD_WIDTH; x += step) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, CONFIG.WORLD_HEIGHT);
        }
        for (let y = 0; y <= CONFIG.WORLD_HEIGHT; y += step) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(CONFIG.WORLD_WIDTH, y);
        }
        this.ctx.stroke();
    }
}