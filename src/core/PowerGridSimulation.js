import { PowerNode } from './PowerNode.js';
import { TransmissionLine } from './TransmissionLine.js';
import { CONFIG } from '../config.js';
import { REAL_NODES_DATA } from '../data/colombia_outline.js';

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
        
        // Bounding Box de Colombia
        this.geoBounds = {
            minLon: -82.0, maxLon: -66.0,
            minLat: -4.5,  maxLat: 13.5
        };
    }

    // --- CORRECCIÓN CLAVE ---
    // Ya no usamos width/height de la pantalla. Usamos el WORLD_WIDTH/HEIGHT fijo.
    projectToWorld(lat, lon) {
        const xPct = (lon - this.geoBounds.minLon) / (this.geoBounds.maxLon - this.geoBounds.minLon);
        const yPct = (this.geoBounds.maxLat - lat) / (this.geoBounds.maxLat - this.geoBounds.minLat);

        return {
            x: xPct * CONFIG.WORLD_WIDTH,
            y: yPct * CONFIG.WORLD_HEIGHT
        };
    }

    resetGrid() {
        // Nota: Ya no necesitamos recibir canvasWidth/Height aquí
        this.currentTime = 0;
        this.nodes = [];
        this.lines = [];
        this.accumulator = 0;

        this.logger.log('🌐 Cargando Topología Nacional Georreferenciada...', 'info');

        // 1. Crear Nodos Reales proyectados al Mundo Virtual
        REAL_NODES_DATA.forEach(data => {
            const coords = this.projectToWorld(data.lat, data.lon);
            
            const node = new PowerNode(data.id, data.name, data.type, coords.x, coords.y);
            
            if (data.type === 'gen') node.pGen = data.mw;
            else node.pLoad = data.mw / 10;

            this.nodes.push(node);
        });

        // 2. Conexión Automática (Vecinos cercanos)
        this.nodes.forEach((nodeA) => {
            const neighbors = this.nodes
                .filter(n => n !== nodeA)
                .map(n => ({
                    node: n,
                    dist: Math.hypot(nodeA.x - n.x, nodeA.y - n.y)
                }))
                .sort((a, b) => a.dist - b.dist)
                .slice(0, 2); // Conectar con los 2 más cercanos

            neighbors.forEach(({ node: nodeB }) => {
                const exists = this.lines.find(l => 
                    (l.from === nodeA && l.to === nodeB) || 
                    (l.from === nodeB && l.to === nodeA)
                );
                if (!exists) {
                    const id = `L-${this.lines.length + 1}`;
                    this.lines.push(new TransmissionLine(id, nodeA, nodeB));
                }
            });
        });

        this.logger.log(`Mapa cargado: ${this.nodes.length} activos. Coordenadas sincronizadas.`, 'success');
        this.solvePowerFlow();
        this.updateUI();
    }

    // ... Resto de métodos (solvePowerFlow, triggerPeakLoad, etc) IGUALES ...
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
        this.nodes.forEach(n => { if (n.type === 'load') { n.pLoad *= 1.2; n.radius += 3; } });
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

    cutLine(line) {
        if (!line || !line.status) return;
        line.status = false; 
        this.logger.log(`MANUAL: Corte de línea ${line.id}`, 'warn');
        this.solvePowerFlow();
        this.updateUI();
    }

    update(deltaTime) {
        this.accumulator += deltaTime;
        while (this.accumulator >= this.timeStep) {
            this.currentTime += this.timeStep;
            this.solvePowerFlow();
            this.lines.forEach(line => {
                const tripped = line.updateThermal(this.timeStep);
                if (tripped && line.status) {
                    line.status = false;
                    this.logger.log(`PROTECCIÓN: ${line.id} disparo térmico!`, 'error');
                }
            });
            this.updateUI();
            this.accumulator -= this.timeStep;
        }
    }

    updateUI(totalLoad, totalGenCapacity, systemStress) {
        if (this.ui.clock) this.ui.clock.textContent = `T = ${this.currentTime.toFixed(1)}s`;
        const load = totalLoad ?? this.nodes.filter(n => n.type === 'load').reduce((a, n) => a + n.pLoad, 0);
        const gen = totalGenCapacity ?? this.nodes.filter(n => n.type === 'gen').reduce((a, n) => a + n.pGen, 0);
        const stress = systemStress ?? Math.min(1.5, load / Math.max(1, gen));
        if (this.ui.metrics) {
            this.ui.metrics.innerHTML = `Demanda Total: <strong>${load.toFixed(0)} MW</strong><br>Generación Activa: ${(gen * stress).toFixed(0)} MW<br>Estrés Red: <span style="color:${stress > 1 ? 'red' : CONFIG.COLORS.SOURCE}">${(stress * 100).toFixed(0)}%</span>`;
        }
        if (this.ui.linesStatus) {
            const critical = this.lines.filter(l => l.status && l.currentLoadMva > 0).sort((a, b) => (b.currentLoadMva / b.capacityMva) - (a.currentLoadMva / a.capacityMva)).slice(0, 5);
            let html = '<table style="width:100%; font-size:0.75rem;">';
            critical.forEach(l => {
                const pct = ((l.currentLoadMva / l.capacityMva) * 100).toFixed(0);
                const color = pct > 90 ? '#ff5252' : '#4CAF50';
                html += `<tr style="color:${color}"><td>${l.id}</td><td>${pct}%</td></tr>`;
            });
            html += '</table>';
            this.ui.linesStatus.innerHTML = html;
        }
        if (this.ui.overlay) this.ui.overlay.textContent = stress > 1 ? 'Alerta: Sobrecarga detectada' : 'Sistema estable';
    }
}