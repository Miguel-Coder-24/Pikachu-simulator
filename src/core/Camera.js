// src/core/Camera.js

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.x = 0;      // Desplazamiento X (Pan)
        this.y = 0;      // Desplazamiento Y (Pan)
        this.zoom = 1;   // Nivel de Zoom
        
        // Configuración inicial para centrar Colombia aprox
        this.width = canvasWidth;
        this.height = canvasHeight;
    }

    // Convierte coordenada de Pantalla (Mouse) a Mundo (Simulación)
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.x) / this.zoom,
            y: (screenY - this.y) / this.zoom
        };
    }

    // Convierte coordenada de Mundo a Pantalla (Para dibujar)
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX * this.zoom) + this.x,
            y: (worldY * this.zoom) + this.y
        };
    }

    // Manejar Zoom (Rueda del mouse)
    handleZoom(delta, mouseX, mouseY) {
        const zoomIntensity = 0.1;
        const oldZoom = this.zoom;
        
        // Calcular nuevo zoom
        if (delta < 0) this.zoom *= (1 + zoomIntensity);
        else this.zoom *= (1 - zoomIntensity);

        // Limites de zoom
        this.zoom = Math.max(0.5, Math.min(this.zoom, 10));

        // Ajustar Pan (x,y) para hacer zoom hacia donde está el mouse
        this.x = mouseX - (mouseX - this.x) * (this.zoom / oldZoom);
        this.y = mouseY - (mouseY - this.y) * (this.zoom / oldZoom);
    }

    // Manejar Pan (Arrastrar clic derecho/rueda)
    handlePan(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}