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
}
