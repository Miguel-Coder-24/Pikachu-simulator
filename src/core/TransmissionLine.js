export class TransmissionLine {
    constructor(id, fromNode, toNode) {
        this.id = id;
        this.from = fromNode;
        this.to = toNode;

        const dist = Math.hypot(fromNode.x - toNode.x, fromNode.y - toNode.y);

        this.capacityMva = 350;
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
        const overloadRatio = Math.max(0, loadPct / 95 - 1.0);

        if (overloadRatio > 0) {
            this.thermalLoad += (overloadRatio * 10) * this.thermalK * dt;
        } else {
            this.thermalLoad *= Math.exp(-dt * 0.5);
        }

        return this.thermalLoad >= this.thermalThreshold;
    }
}
