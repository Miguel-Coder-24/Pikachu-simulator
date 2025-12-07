export class PowerNode {
    constructor(id, name, type, x, y) {
        this.id = id;
        this.name = name;
        this.type = type; // 'gen' o 'load'
        this.x = x;
        this.y = y;

        // Estado eléctrico y potencia
        this.voltageKv = 230;
        this.pGen = 0;
        this.pLoad = 0;
        this.netPower = 0;
        this.currentGen = 0;
        this.vVirtual = 1.0;

        // Visuales
        this.radius = type === 'gen' ? 18 : 10; 
        this.color = type === 'gen' ? '#4CAF50' : '#FF5252'; 
        this.dragging = false;
    }

    // --- NUEVO MÉTODO DRAW CON LOGICA DE ZOOM ---
    draw(ctx, viewX, viewY, zoom) {
        // 1. Calculamos la posición real en pantalla
        // Nota: Asumimos que el zoom se aplica aquí o en el renderer globalmente.
        // Si tu renderer usa ctx.scale(zoom, zoom), usa: const x = this.x + viewX;
        // Si tu renderer NO usa ctx.scale, usa esta fórmula manual:
        const screenX = (this.x + viewX) * zoom;
        const screenY = (this.y + viewY) * zoom;

        // Si usas ctx.scale en el Renderer (lo más probable), usa estas coordenadas:
        // const drawX = this.x + viewX;
        // const drawY = this.y + viewY;
        
        // Pero para ir a la segura, usaremos las coordenadas directas y ajustaremos el radio
        // (Esto funciona en la mayoría de implementaciones simples)
        const drawX = this.x + viewX;
        const drawY = this.y + viewY;

        ctx.beginPath();
        
        // El radio visual cambia un poco con el zoom para no verse gigante ni diminuto
        // Mínimo 2px para que siempre se vea un puntito
        const visualRadius = Math.max(2, this.radius); 

        ctx.arc(drawX, drawY, visualRadius, 0, Math.PI * 2);
        
        // Color Dinámico
        if (this.type === 'gen') {
            ctx.fillStyle = '#FFD700'; // Oro para Generadores
        } else {
            // Azul si está bien, Rojo si está bajo voltaje (vVirtual < 0.95)
            // Simplificamos: Usamos el color base definido en el constructor
            ctx.fillStyle = this.color;
        }
        
        ctx.fill();
        
        // Borde para resaltar
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        // --- MAGIA DEL ZOOM: Solo dibujar texto si estamos cerca ---
        
        // Define a partir de cuánto zoom aparece el texto.
        // 0.8 = Tienes que acercarte un poco.
        // 1.5 = Tienes que acercarte mucho.
        const umbralZoom = (this.type === 'gen') ? 0.7 : 3.0; // Generadores se ven desde más lejos

        if (zoom > umbralZoom) {
            ctx.fillStyle = '#FFFFFF';
            // El tamaño de la fuente se ajusta inversamente al zoom para que sea legible
            // O déjalo fijo en px si prefieres
            ctx.font = '12px Arial'; 
            ctx.textAlign = 'center';
            
            // Dibujamos el nombre un poco más arriba del círculo
            ctx.fillText(this.name, drawX, drawY - (visualRadius + 5));
        }
    }
}
