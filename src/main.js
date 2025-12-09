// src/main.js

import { CONFIG } from './config.js';
import { PowerGridSimulation } from './core/PowerGridSimulation.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js';
import { Camera } from './core/Camera.js';

// UI Imports
import { CanvasRenderer } from './ui/CanvasRenderer.js';
import { Interactions } from './ui/Interactions.js';
import { SidebarUI } from './ui/hud/Sidebar.js';
import { LogConsole } from './ui/hud/Console.js';

// Función para cargar y parsear el archivo JSON
const getParsedData = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error de red o archivo no encontrado: ${response.status}`);
        }
        const data = await response.json();
        
        // Usamos las claves exactas de tu archivo JSON: Proyectos, Municipios, Relaciones.
        return {
            generatorData: data.Proyectos || [],  // Hoja 1: Generadores
            loadData: data.Municipios || [],      // Hoja 2: Receptores
            relationData: data.Relaciones || []   // Hoja 3: Relaciones (Líneas)
        };
    } catch (error) {
        console.error("❌ Error al cargar o parsear el JSON de datos:", error);
        alert("No se pudo cargar la data. Revisa la consola y la ruta del archivo JSON.");
        return { generatorData: [], loadData: [], relationData: [] };
    }
};

const init = async () => {
    console.log(`⚡ Iniciando Pikachu-Simulator v${CONFIG.VERSION}...`); // [cite: 1308]

    // 1. Referencias al DOM
    const canvas = document.getElementById('grid-canvas');
    const logContainer = document.getElementById('log-console');
    
    // Referencias UI HTML
    const metrics = document.getElementById('system-metrics');
    const linesStatus = document.getElementById('lines-status');
    const overlay = document.getElementById('status-overlay');
    const clock = document.getElementById('clock');

    if (!canvas || !logContainer) {
        console.error("❌ Error: No se encontró canvas o consola.");
        return;
    }

    // Ajustar tamaño del Canvas
    const resizeCanvas = () => {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    resizeCanvas();

    // 2. Cargar Recursos (Async)
    const assetLoader = new AssetLoader();
    const assets = await assetLoader.loadAll();

    // 3. Inicializar Sistema
    
    // A) Cámara
   const camera = new Camera(canvas.width, canvas.height);
    // B) Renderizador
    const renderer = new CanvasRenderer(canvas, assets, camera);
    // C) Consola de logs
    const logger = new LogConsole(logContainer);

    // D) Simulación
    const simulation = new PowerGridSimulation(renderer, logger, { metrics, linesStatus, overlay, clock }); // [cite: 1313]

    // 🛑 NUEVO PASO CRÍTICO: Cargar datos de manera asíncrona
    const JSON_PATH = './src/data/datos_json_unificados.json';
    const { generatorData, loadData, relationData } = await getParsedData(JSON_PATH); 
    
    // E) Controles
    const controls = new Interactions(canvas, simulation, camera);
    const sidebar = new SidebarUI(simulation);
    sidebar.setControls(controls);
    sidebar.init();
    // 3. Agregar Event Listener al contenedor (Delegación de eventos)
    // El contenedor es linesStatus (div id="lines-status") [cite: 1263]
    const linesStatusDiv = document.getElementById('lines-status');

    if (linesStatusDiv) {
        linesStatusDiv.addEventListener('click', (e) => {
            // Utilizamos 'closest' para encontrar el botón padre (.critical-line-button)
            const button = e.target.closest('.critical-line-button');
            
            if (button) {
                const lineId = button.dataset.lineId;
                if (lineId) {
                    zoomToLine(lineId);
                }
            }
        });
    }

    // 4. Iniciar Lógica
    simulation.resetGrid(generatorData, loadData, relationData); 
    controls.initListeners();

     const findLineById = (lineId) => {
        return simulation.lines.find(l => l.id === lineId);
    };

    const zoomToLine = (lineId) => {
        const line = findLineById(lineId);
        if (!line) {
            console.warn(`Línea no encontrada: ${lineId}`);
            return;
        }

        // Calcular punto medio de la línea
        const midX = (line.from.x + line.to.x) / 2;
        const midY = (line.from.y + line.to.y) / 2;
        
        // Verificar que las coordenadas sean válidas
        if (isNaN(midX) || isNaN(midY)) {
            console.error("Error: Coordenadas de línea no numéricas.");
            return;
        }

        // Centrar cámara en la línea con zoom
        camera.centerOnWorld(midX, midY, 5.0); 
        
        logger.log(`Zoom a línea crítica: ${lineId}`, 'info');
    };

    // --- CÓDIGO AGREGADO: Event delegation para botones de líneas críticas ---
    // Usamos event delegation porque los botones se crean dinámicamente
    document.addEventListener('click', (e) => {
        // Verificar si el click fue en un botón de línea crítica
        const button = e.target.closest('.critical-line-button');
        
        if (button) {
            const lineId = button.getAttribute('data-line-id');
            if (lineId) {
                zoomToLine(lineId);
            }
        }
    });

    // --- CÓDIGO AGREGADO: Lógica del Botón Reiniciar ---
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
        btnRestart.addEventListener('click', () => {
            // Enviamos un mensaje a la consola del juego
            logger.log("🔄 Reiniciando sistema a condiciones iniciales...", "success");
            
            // Llamamos a resetGrid con los mismos datos originales. 
            // Esto elimina líneas cortadas, reinicia las cargas y regenera la red.
            simulation.resetGrid(generatorData, loadData, relationData);
            // 2. REINICIAR EL RELOJ (Nueva línea)
            simulation.currentTime = 0;
        });
    }
    // ---------------------------------------------------

    // CENTRAR CÁMARA EN EL MAPA INICIALMENTE
    // Colombia en el mapa virtual (2000x2500) está aprox en el centro
    camera.x = -600; 
    camera.y = -800;
    camera.zoom = 0.8;

    logger.log('Sistema en línea. Renderizando...', 'success');

    // 5. Bucle de Juego
    const gameLoop = new GameLoop((deltaTime) => {
        simulation.update(deltaTime);
        renderer.render(simulation);
    });
    gameLoop.start();

    // Resize listener
    window.addEventListener('resize', () => {
        resizeCanvas();
        // Opcional: simulation.resetGrid(); si quieres regenerar al cambiar tamaño
    });
};

window.addEventListener('DOMContentLoaded', init);