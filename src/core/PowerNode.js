export class PowerNode {
    constructor(id, x, y, type = 'generic') {
        this.id = id;
        this.x = x; // Coordenada en la GRILLA (no píxeles)
        this.y = y;
        this.type = type; // 'source', 'load', 'battery'
        
        // Estado eléctrico
        this.voltage = 0;
        this.isPowered = false;
    }
}