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
        this.nodeMap = new Map(); // <--- IMPORTANTE: Agregado aquí
        
        this.currentTime = 0;
        this.timeStep = 0.05;
        this.accumulator = 0;
        
        // Bounding Box de Colombia
        this.geoBounds = {
            minLon: -82.0, maxLon: -66.0,
            minLat: -5.0,  maxLat: 14.0
        };
    }

    projectToWorld(lat, lon) {
        const xPct = (lon - this.geoBounds.minLon) / (this.geoBounds.maxLon - this.geoBounds.minLon);
        const yPct = (this.geoBounds.maxLat - lat) / (this.geoBounds.maxLat - this.geoBounds.minLat);
        return {
            x: xPct * CONFIG.WORLD_WIDTH,
            y: yPct * CONFIG.WORLD_HEIGHT
        };
    }

    resetGrid(generatorData, loadData, relationData) {
        this.nodes = [];
        this.lines = [];
        this.nodeMap.clear();

        // 1. Crear Nodos de Generación
        generatorData.forEach(data => {
            const id = data.ID; 
            const coords = this.projectToWorld(data.coordy, data.coordx);
            const node = new PowerNode(id, data.nombre, 'gen', coords.x, coords.y);
            node.pGen = data.capacidad; 
            this.nodes.push(node);
            this.nodeMap.set(id, node);
        });

        // 2. Crear Nodos de Carga (Municipios)
        loadData.forEach(data => {
            const id = data.ID; 
            const coords = this.projectToWorld(data.coordy, data.coordx);
            const node = new PowerNode(id, data.municipio, 'load', coords.x, coords.y);
            node.pLoad = data.consumo; 
            this.nodes.push(node);
            this.nodeMap.set(id, node);
        });

        // 3. Llamamos a la función que construye TODAS las líneas (Principal + Backbone + Malla)
        this._buildTopology(relationData);

        // Inicializar cálculos
        this.solvePowerFlow();
        this.updateUI();
    } 
    _buildTopology(relationData) {
        this.lines = [];
        this.nodes.forEach(n => n.connections = []);

        // 1. LÍNEAS DE GENERACIÓN (Las intocables)
        // Conectan Generador -> Municipio
        relationData.forEach((relation) => {
            const genId = relation.idproyecto; 
            const loadId = relation.idmunicipio;
            const nodeA = this.nodeMap.get(genId);
            const nodeB = this.nodeMap.get(loadId);

            if (nodeA && nodeB) {
                const nA = (nodeA.name || genId).toString().replace(/\s/g, '');
                const nB = (nodeB.name || loadId).toString().replace(/\s/g, '');
                // Prefijo GEN para identificar líneas de alta potencia
                const id = `GEN_${nA}_${nB}`; 
                
                // CAPACIDAD 5000 MVA (Indestructibles en condiciones normales)
                this.lines.push(new TransmissionLine(id, nodeA, nodeB, 5000)); 
            }
        });

        // 2. FILTRO ESTRICTO: SOLO MUNICIPIOS (CARGAS)
        // Corregimos el error: Sacamos a los generadores de esta lista
        const municipios = this.nodes.filter(n => n.type === 'load');

        // 3. COLUMNA VERTEBRAL (Backbone)
        // Conectamos Norte a Sur para unificar el país
        const ordenados = [...municipios].sort((a, b) => a.y - b.y);

        for (let i = 0; i < ordenados.length - 1; i++) {
            const muniA = ordenados[i];
            const muniB = ordenados[i + 1];

            const dist = Math.hypot(muniA.x - muniB.x, muniA.y - muniB.y);
            
            // Si están muy lejos, es una línea de Alta Tensión (HV)
            // Si están cerca, es un enlace regional (LINK)
            const tipo = dist > 300 ? "HV_LONG" : "LINK";
            const capacidad = dist > 300 ? 4000 : 1500; // Capacidad sobrada

            this._conectarSeguro(muniA, muniB, tipo, capacidad);
        }

        // 4. MALLA LOCAL (Barrios)
        const RADIO_VECINDAD = 200;
        
        municipios.forEach(muniA => {
            const vecinos = municipios
                .filter(muniB => muniB !== muniA)
                .map(muniB => ({
                    nodo: muniB,
                    dist: Math.hypot(muniA.x - muniB.x, muniA.y - muniB.y)
                }))
                .filter(par => par.dist < RADIO_VECINDAD)
                .sort((a, b) => a.dist - b.dist);

            // Conectamos con los 2 vecinos más cercanos
            vecinos.slice(0, 2).forEach(v => {
                // Capacidad robusta para distribución (1000)
                this._conectarSeguro(muniA, v.nodo, "DIST", 1000); 
            });
        });

        this.logger.log(`Topología Blindada: ${this.lines.length} líneas. Generadores aislados de red local.`, 'success');
    
    }


    // =========================================================
    // HELPER: Función auxiliar para crear líneas sin repetir
    // (Pega esto DENTRO de la clase PowerGridSimulation, 
    //  justo después de que termine _buildTopology)
    // =========================================================
    _conectarSeguro(nodoA, nodoB, prefijo, capacidad) {
        // 1. CHEQUEO DE SEGURIDAD: ¿Ya están conectados estos dos nodos?
        // Esto evita que pongamos una línea "DIST" donde ya hay una "GEN" o "HV"
        const yaConectados = this.lines.some(l => 
            (l.from === nodoA && l.to === nodoB) || 
            (l.from === nodoB && l.to === nodoA)
        );

        if (yaConectados) return; // Si ya existe conexión, NO hacemos nada.

        // Si no existe, procedemos a crearla
        const nA = (nodoA.name || nodoA.id).toString().replace(/\s/g, '');
        const nB = (nodoB.name || nodoB.id).toString().replace(/\s/g, '');
        const nombres = [nA, nB].sort();
        
        const lineId = `${prefijo}_${nombres[0]}_${nombres[1]}`;

        // Chequeo por ID (por si acaso)
        if (!this.lines.some(l => l.id === lineId)) {
            const linea = new TransmissionLine(lineId, nodoA, nodoB, capacidad);
            this.lines.push(linea);
        }
    }

    // ... Resto de métodos (solvePowerFlow, triggerPeakLoad, etc) IGUALES ...
    // En src/core/PowerGridSimulation.js

    solvePowerFlow() {
        // 1. Calcular DEMANDA TOTAL (Suma de consumos)
        let totalLoad = 0;
        this.nodes.forEach(n => {
            if (n.type === 'load') {
                // El (|| 0) evita errores si pLoad no está definido
                totalLoad += (n.pLoad || 0);
            }
        });

        // 2. Calcular CAPACIDAD DISPONIBLE (Suma de generadores)
        let totalCapacity = 0;
        this.nodes.forEach(n => {
            if (n.type === 'gen') {
                totalCapacity += (n.pGen || 0);
            }
        });

        // 3. CÁLCULO INTELIGENTE (Oferta vs Demanda)
        const requiredGen = totalLoad * 1.05; // +5% margen de pérdidas
        
        // Evitamos división por cero usando Math.max(1, ...)
        let utilizationFactor = requiredGen / Math.max(1, totalCapacity);
        
        // Límite físico: no se puede dar más del 100%
        utilizationFactor = Math.min(1.0, utilizationFactor);

        // =========================================================
        // 🔥 ARRANQUE SUAVE (SOFT START) - CLAVE PARA QUE NO FALLE
        // =========================================================
        // Si la simulación lleva menos de 2 segundos, forzamos
        // a que los generadores trabajen solo al 10% de lo calculado.
        // Esto evita el "latigazo" inicial que rompe las líneas.
        if (this.currentTime < 2.0) {
            utilizationFactor = utilizationFactor * 0.1;
        }

        // 4. APLICAR A LOS NODOS
        this.nodes.forEach(n => {
            if (n.type === 'gen') {
                // El generador produce según el factor calculado
                n.currentGen = (n.pGen || 0) * utilizationFactor;
                n.netPower = n.currentGen; 
            } else {
                // La carga consume lo que pide
                n.netPower = -(n.pLoad || 0); 
            }

            // Voltaje Virtual (simplificado para estabilidad)
            // Divide entre 5000 para que el cambio de voltaje sea suave
            n.vVirtual = 1.0 + (n.netPower / 5000); 
        });

        // 5. CALCULAR FLUJO EN LÍNEAS
        this.lines.forEach(line => {
            if (!line.status) {
                line.currentLoadMva = 0;
                return;
            }
            
            // Flujo basado en diferencia de voltaje virtual
            const vDiff = line.from.vVirtual - line.to.vVirtual;
            
            // Protección contra impedancia cero o nula
            const imp = Math.max(0.001, line.impedance || 0.01);
            
            const flow = (vDiff / imp) * 10;
            
            // Efecto de carga local ("jalón" del destino)
            // Verificamos que el destino sea carga para acceder a pLoad
            let loadPull = 0;
            if (line.to.type === 'load') {
                loadPull = (line.to.pLoad || 0) * 0.1;
            }
            
            line.currentLoadMva = Math.abs(flow) + loadPull;
        });

        // 6. Actualizar Interfaz (UI)
        const systemStress = totalLoad / Math.max(1, totalCapacity);
        
        // Verificamos que updateUI exista antes de llamarlo
        if (this.updateUI) {
            this.updateUI(totalLoad, totalCapacity, systemStress);
        }
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