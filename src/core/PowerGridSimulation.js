import { PowerNode } from './PowerNode.js';
import { TransmissionLine } from './TransmissionLine.js';
import { CONFIG } from '../config.js';

export class PowerGridSimulation {
    constructor(renderer, logger, ui) {
        this.renderer = renderer;
        this.logger = logger;
        this.ui = ui;

        this.nodes = [];
        this.lines = [];
        this.currentTime = 0;
        this.timeStep = 0.05;
        this.accumulator = 0;
        this.lastTime = performance.now();

        this.dragNode = null;

        this.cityNames = [
            'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
            'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
            'Pasto', 'Manizales', 'Neiva', 'Villavicencio', 'Armenia'
        ];
        this.plantNames = [
            'Hidroituango', 'Guavio', 'San Carlos', 'Chivor', 'Guatapé',
            'Termozipa', 'Termosierra', 'Sogamoso', 'Porce III', 'Betania'
        ];
    }

    resetGrid(canvasWidth, canvasHeight) {
        this.currentTime = 0;
        this.nodes = [];
        this.lines = [];
        this.accumulator = 0;

        this.logger.log('Generando nueva topología nacional...', 'info');

        const w = canvasWidth || 800;
        const h = canvasHeight || 600;
        const margin = 50;

        // Generadores
        for (let i = 0; i < 10; i++) {
            const name = this.plantNames[i % this.plantNames.length];
            const x = margin + Math.random() * (w - 2 * margin);
            const y = margin + Math.random() * (h - 2 * margin);
            const node = new PowerNode(`G${i + 1}`, name, 'gen', x, y);
            node.pGen = 150 + Math.random() * 200;
            this.nodes.push(node);
        }

        // Ciudades
        for (let i = 0; i < 15; i++) {
            const name = this.cityNames[i % this.cityNames.length];
            let x, y, safe;
            let attempts = 0;
            do {
                safe = true;
                x = margin + Math.random() * (w - 2 * margin);
                y = margin + Math.random() * (h - 2 * margin);
                for (const n of this.nodes) {
                    const d = Math.hypot(n.x - x, n.y - y);
                    if (d < 50) safe = false;
                }
                attempts++;
            } while (!safe && attempts < 50);

            const node = new PowerNode(`C${i + 1}`, name, 'load', x, y);
            node.pLoad = 80 + Math.random() * 120;
            this.nodes.push(node);
        }

        // Conectar nodos
        this.nodes.forEach((nodeA) => {
            const distances = this.nodes
                .filter(nodeB => nodeA !== nodeB)
                .map(nodeB => ({
                    node: nodeB,
                    dist: Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y)
                }))
                .sort((a, b) => a.dist - b.dist);

            const connections = 2 + (Math.random() > 0.8 ? 1 : 0);

            for (let i = 0; i < Math.min(connections, distances.length); i++) {
                const neighbor = distances[i].node;
                const exists = this.lines.find(l =>
                    (l.from === nodeA && l.to === neighbor) ||
                    (l.from === neighbor && l.to === nodeA)
                );
                if (!exists) {
                    const id = `L-${this.lines.length + 1}`;
                    this.lines.push(new TransmissionLine(id, nodeA, neighbor));
                }
            }
        });

        this.logger.log(`Sistema listo: ${this.nodes.length} nodos activos.`, 'info');
        this.solvePowerFlow();
        this.updateUI();
    }

    solvePowerFlow() {
        let totalLoad = 0;
        let totalGenCapacity = 0;

        this.nodes.forEach(n => {
            if (n.type === 'load') totalLoad += n.pLoad;
            if (n.type === 'gen') totalGenCapacity += n.pGen;
        });

        const systemStress = Math.min(1.5, totalLoad / Math.max(1, totalGenCapacity));

        this.nodes.forEach(n => {
            if (n.type === 'gen') {
                n.currentGen = n.pGen * systemStress;
                n.netPower = n.currentGen;
            } else {
                n.netPower = -n.pLoad;
            }
            n.vVirtual = 1.0 + (n.netPower / 2000);
        });

        this.lines.forEach(line => {
            if (!line.status) {
                line.currentLoadMva = 0;
                return;
            }
            const vDiff = line.from.vVirtual - line.to.vVirtual;
            const flow = (vDiff / line.impedance) * 10;
            const loadPull = line.to.type === 'load' ? line.to.pLoad : 0;
            line.currentLoadMva = Math.abs(flow) + (loadPull * 0.4);
        });

        this.updateUI(totalLoad, totalGenCapacity, systemStress);
    }

    triggerPeakLoad() {
        this.nodes.forEach(n => {
            if (n.type === 'load') {
                n.pLoad *= 1.2;
                n.radius += 3;
            }
        });
        this.logger.log('ALERTA: Pico de demanda (+20%)', 'warn');
        setTimeout(() => {
            this.nodes.filter(n => n.type === 'load').forEach(n => n.radius -= 3);
            this.solvePowerFlow();
        }, 300);
    }

    tripRandomLine() {
        const active = this.lines.filter(l => l.status);
        if (!active.length) return;
        const randomLine = active[Math.floor(Math.random() * active.length)];
        randomLine.status = false;
        this.logger.log(`FALLA: Línea ${randomLine.id} fuera de servicio.`, 'error');
        this.solvePowerFlow();
    }

    update(deltaTime) {
        this.accumulator += deltaTime;
        while (this.accumulator >= this.timeStep) {
            this.currentTime += this.timeStep;
            this.solvePowerFlow();

            let trippedCount = 0;
            this.lines.forEach(line => {
                const tripped = line.updateThermal(this.timeStep);
                if (tripped && line.status) {
                    line.status = false;
                    trippedCount++;
                    this.logger.log(`PROTECCIÓN: ${line.id} disparo térmico!`, 'error');
                }
            });

            this.updateUI();
            this.accumulator -= this.timeStep;
        }
    }

    updateUI(totalLoad, totalGenCapacity, systemStress) {
        if (this.ui.clock) {
            this.ui.clock.textContent = `T = ${this.currentTime.toFixed(1)}s`;
        }

        const load = totalLoad ?? this.nodes.filter(n => n.type === 'load').reduce((a, n) => a + n.pLoad, 0);
        const gen = totalGenCapacity ?? this.nodes.filter(n => n.type === 'gen').reduce((a, n) => a + n.pGen, 0);
        const stress = systemStress ?? Math.min(1.5, load / Math.max(1, gen));

        if (this.ui.metrics) {
            this.ui.metrics.innerHTML = `
                Demanda Total: <strong>${load.toFixed(0)} MW</strong><br>
                Generación Activa: ${(gen * stress).toFixed(0)} MW<br>
                Estrés Red: <span style="color:${stress > 1 ? 'red' : CONFIG.COLORS.SOURCE}">${(stress * 100).toFixed(0)}%</span>
            `;
        }

        if (this.ui.linesStatus) {
            const critical = this.lines
                .filter(l => l.status && l.currentLoadMva > 0)
                .sort((a, b) => (b.currentLoadMva / b.capacityMva) - (a.currentLoadMva / a.capacityMva))
                .slice(0, 5);

            let html = '<table style="width:100%; font-size:0.75rem;">';
            critical.forEach(l => {
                const pct = ((l.currentLoadMva / l.capacityMva) * 100).toFixed(0);
                const color = pct > 90 ? '#ff5252' : '#4CAF50';
                html += `<tr style="color:${color}"><td>${l.id}</td><td>${pct}%</td></tr>`;
            });
            html += '</table>';
            this.ui.linesStatus.innerHTML = html;
        }

        if (this.ui.overlay) {
            this.ui.overlay.textContent = stress > 1
                ? 'Alerta: Sobrecarga detectada\nMonitoreando protección térmica.'
                : 'Sistema estable\nArrastra nodos para reorganizar.';
        }
    }

    cutLine(line) {
        if (!line || !line.status) return;
        
        line.status = false; // Desactivar línea
        this.logger.log(`MANUAL: Corte de línea ${line.id}`, 'warn');
        
        // Recalcular flujo eléctrico inmediatamente
        this.solvePowerFlow();
        this.updateUI();
    }
}
