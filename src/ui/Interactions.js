// src/ui/Interactions.js

export class Interactions {
    constructor(canvas, simulation, camera) {
        this.canvas = canvas;
        this.simulation = simulation;
        this.camera = camera;
        
        this.dragNode = null;
        this.mode = 'normal'; // 'normal' | 'cut'
        
        // Variables para el Paneo (Mover mapa)
        this.isPanning = false;
        this.lastMouse = { x: 0, y: 0 };
    }

    initListeners() {
        // Desactivar menú contextual (clic derecho) para usarlo para mover el mapa
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        
        // Escuchar rueda del mouse (Zoom)
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
    }

    setMode(mode) {
        this.mode = mode;
        this.canvas.style.cursor = mode === 'cut' ? 'crosshair' : 'default';
    }

    // Transformar coordenadas del mouse usando la cámara
    getMouseWorldPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        return this.camera.screenToWorld(screenX, screenY);
    }

    onMouseDown(e) {
        const worldPos = this.getMouseWorldPos(e);

        // 1. Clic Derecho o Rueda presionada: Iniciar Paneo
        if (e.button === 2 || e.button === 1) {
            this.isPanning = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
            return;
        }

        // 2. Modo CORTAR (Tijeras)
        if (this.mode === 'cut') {
            const line = this.findLineAt(worldPos);
            if (line) {
                this.simulation.cutLine(line);
                // Volver a modo normal después de cortar (opcional)
                this.setMode('normal');
            }
            return;
        }

        // 3. Modo NORMAL: Arrastrar nodos
        const node = this.findNodeAt(worldPos);
        if (node) {
            this.dragNode = node;
            node.dragging = true;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    onMouseMove(e) {
        // A. Manejar Paneo de Cámara
        if (this.isPanning) {
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.camera.handlePan(dx, dy);
            this.lastMouse = { x: e.clientX, y: e.clientY };
            return;
        }

        const worldPos = this.getMouseWorldPos(e);

        // B. Arrastrar Nodo
        if (this.dragNode) {
            this.dragNode.x = worldPos.x;
            this.dragNode.y = worldPos.y;
            // Actualizar lógica eléctrica si fuera necesario en tiempo real
            return;
        }

        // C. Hover effects (Visual)
        const hoverNode = this.findNodeAt(worldPos);
        const hoverLine = this.findLineAt(worldPos);

        if (this.mode === 'cut') {
            this.canvas.style.cursor = hoverLine ? 'crosshair' : 'default';
        } else {
            this.canvas.style.cursor = hoverNode ? 'grab' : 'default';
        }
    }

    onMouseUp() {
        this.isPanning = false;
        
        if (this.dragNode) {
            this.dragNode.dragging = false;
            this.dragNode = null;
        }
        
        if (this.mode !== 'cut') {
            this.canvas.style.cursor = 'default';
        }
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Delegar lógica de zoom a la cámara
        this.camera.handleZoom(e.deltaY, mouseX, mouseY);
    }

    // --- Helpers de Colisión ---

    findNodeAt(pos) {
        // Busca si el mouse está sobre un nodo (considerando su radio y el zoom inverso si se quiere precisión)
        // Usamos un radio de detección un poco más grande (20px en mundo virtual)
        const hitRadius = 25; 
        return this.simulation.nodes.find(n => {
            const dist = Math.hypot(n.x - pos.x, n.y - pos.y);
            return dist < hitRadius;
        });
    }

    findLineAt(pos) {
        // Distancia de un punto a un segmento de línea
        const threshold = 15; // Grosor de detección
        return this.simulation.lines.find(l => {
            if (!l.status) return false;
            return this.pointToSegmentDist(pos.x, pos.y, l.from.x, l.from.y, l.to.x, l.to.y) < threshold;
        });
    }

    pointToSegmentDist(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;

        if (param < 0) {
            xx = x1; yy = y1;
        } else if (param > 1) {
            xx = x2; yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.hypot(dx, dy);
    }
}