// src/ui/Interactions.js

export class Interactions {
    constructor(canvas, simulation, camera) {
        this.canvas = canvas;
        this.simulation = simulation;
        this.camera = camera;
        
        this.dragNode = null;
        this.mode = 'normal'; // 'normal' | 'cut'
        
        this.isPanning = false;
        this.lastMouse = { x: 0, y: 0 };
    }

    initListeners() {
        // Desactivar menú contextual
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        
        // Zoom
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // --- AQUI VA EL CÓDIGO NUEVO (DENTRO DE LA FUNCIÓN) ---
        
        // Agregar funcionalidad a la tecla ESC
        window.addEventListener('keydown', (e) => {
            // Usamos arrow function (=>) para que 'this' siga siendo la clase
            if (e.key === 'Escape' && this.mode === 'cut') {
                this.setMode('normal');
                
                // Actualizar el texto del botón visualmente
                const btnCut = document.getElementById('btn-cut');
                if (btnCut) {
                    btnCut.textContent = '✂️ Cortar Línea (Manual)';
                    btnCut.classList.remove('active');
                }
            }
        });
    }

    setMode(mode) {
        this.mode = mode;
        this.canvas.style.cursor = mode === 'cut' ? 'crosshair' : 'default';
    }

    // ... (El resto de métodos getMouseWorldPos, onMouseDown, etc. se quedan igual) ...

    getMouseWorldPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        return this.camera.screenToWorld(screenX, screenY);
    }

    onMouseDown(e) {
        // 1. Obtener la posición del ratón en coordenadas de PANTALLA
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // 2. Obtener la posición del ratón en coordenadas del MUNDO
        const worldPos = this.camera.screenToWorld(screenX, screenY);

        if (e.button === 0) { // Clic Izquierdo

            // A. Lógica de selección de nodo (el arrastre de nodo está DESHABILITADO)
            this.selectedNode = this.findNodeAt(worldPos);

            if (this.selectedNode) {
                // El nodo está seleccionado, pero no se inicia isDraggingNode
                // Por lo tanto, el control pasa al pan
            }

            // B. Iniciar el Panning con el clic izquierdo
            this.isPanning = true;
            
            // Almacenar la posición de PANTALLA para el cálculo correcto del movimiento
            this.lastScreenX = screenX; 
            this.lastScreenY = screenY;
        }
        
        // Evitar que el menú contextual aparezca con el botón derecho (si aplica)
        if (e.button === 2) { 
            e.preventDefault();
        }
    }

    onMouseMove(e) {
        // 1. Obtener la posición actual del ratón en coordenadas de PANTALLA
        const rect = this.canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // 2. Lógica de Panning (Movimiento de la Cámara)
        if (this.isPanning) {
            
            // Calcular la diferencia de movimiento en píxeles de PANTALLA
            const dx_screen = screenX - this.lastScreenX;
            const dy_screen = screenY - this.lastScreenY;

            // Mover la cámara usando el desplazamiento de pantalla
            this.camera.handlePan(dx_screen, dy_screen);

            // Actualizar la última posición de PANTALLA para el siguiente frame
            this.lastScreenX = screenX;
            this.lastScreenY = screenY;

        }

        const worldPos = this.getMouseWorldPos(e);
        this.hoverNode = this.findNodeAt(worldPos);

        if (this.dragNode) {
            this.dragNode.x = worldPos.x;
            this.dragNode.y = worldPos.y;
            return;
        }

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
        this.camera.handleZoom(e.deltaY, mouseX, mouseY);
    }

    findNodeAt(pos) {
        const hitRadius = 25; 
        return this.simulation.nodes.find(n => {
            const dist = Math.hypot(n.x - pos.x, n.y - pos.y);
            return dist < hitRadius;
        });
    }

    findLineAt(pos) {
        const threshold = 15; 
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