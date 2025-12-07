export class TransmissionLine {
    constructor(id, fromNode, toNode, capacity = 350) {
        this.id = id;
        this.from = fromNode;
        this.to = toNode;

        const dist = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y);

        // AHORA USAMOS EL VALOR QUE NOS PASAN
        this.capacityMva = capacity; 
        
        this.impedance = Math.max(0.01, dist / 1000);

        this.status = true;
        this.currentLoadMva = 0;
        this.thermalLoad = 0;
        this.thermalThreshold = 100;
        this.thermalK = 8.0;
    }

    updateThermal(dt) {
        if (!this.status) {
            this.thermalLoad = 0;
            return false;
        }

        const loadPct = (this.currentLoadMva / this.capacityMva) * 100;
        
        // CAMBIO: Aumentamos la tolerancia. 
        // Antes empezaba a calentarse al 95%. Ahora al 105%.
        // Esto permite picos transitorios sin disparar la línea.
        const overloadRatio = Math.max(0, loadPct / 105 - 1.0);

        if (overloadRatio > 0) {
            // CAMBIO: Reducimos la velocidad de calentamiento (* 3 en vez de * 10)
            // Esto te da más tiempo para reaccionar antes de que se corte.
            this.thermalLoad += (overloadRatio * 3) * this.thermalK * dt;
        } else {
            // Enfriamiento rápido
            this.thermalLoad *= Math.exp(-dt * 0.8);
        }

        return this.thermalLoad >= this.thermalThreshold;
    }
    // --- AGREGA ESTE MÉTODO PARA CONTROLAR LA VISUALIZACIÓN ---
    draw(ctx, viewX, viewY, time) {
        // Coordenadas ajustadas a la cámara
        const x1 = this.from.x + viewX;
        const y1 = this.from.y + viewY;
        const x2 = this.to.x + viewX;
        const y2 = this.to.y + viewY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        // 1. Definir Color según Estado y Carga
        if (!this.status) {
            // Línea cortada (Gris y punteada fija)
            ctx.strokeStyle = '#444'; 
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
        } else {
            // Línea activa
            const loadPct = (this.currentLoadMva / this.capacityMva) * 100;
            
            // Colores: Verde (<50%), Amarillo (50-85%), Naranja (85-100%), Rojo (>100%)
            if (loadPct > 100) ctx.strokeStyle = '#ff3333'; // Rojo (Sobrecarga)
            else if (loadPct > 85) ctx.strokeStyle = '#ff9933'; // Naranja
            else if (loadPct > 50) ctx.strokeStyle = '#ffdd33'; // Amarillo
            else ctx.strokeStyle = '#4caf50'; // Verde

            // Grosor según carga (más grueso = más carga)
            ctx.lineWidth = 2 + (loadPct / 100) * 2;

            // 2. CONFIGURACIÓN DE ANIMACIÓN (Aquí reducimos la velocidad)
            // Calculamos una velocidad basada en la carga (0 a 1)
            const ratio = this.currentLoadMva / this.capacityMva;
            
            // AJUSTE DE VELOCIDAD:
            // Base: 10 px/s. Máximo adicional: 30 px/s.
            // Antes esto era probablemente 100+ lo que lo hacía ver frenético.
            const speed = 10 + (ratio * 30); 

            ctx.setLineDash([10, 10]); // Tamaño de los guiones
            
            // Multiplicamos el tiempo por la velocidad reducida
            ctx.lineDashOffset = -time * speed;
        }

        ctx.stroke();
        ctx.setLineDash([]); // Limpiar dash para lo siguiente que se dibuje
    }
}
