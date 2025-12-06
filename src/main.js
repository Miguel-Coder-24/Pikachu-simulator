// src/main.js

import { CONFIG } from './config.js';

// --- CORE (Lógica) ---
import { PowerGridSimulation } from './core/PowerGridSimulation.js';
import { GameLoop } from './core/GameLoop.js';
import { AssetLoader } from './core/AssetLoader.js'; 

// --- UI (Presentación) ---
// Estos están directamente en /ui/
import { CanvasRenderer } from './ui/CanvasRenderer.js'; 
import { Interactions } from './ui/Interactions.js';

// --- HUD (Interfaz de Usuario sobre el canvas) ---
// Estos están dentro de /ui/hud/ según me indicaste
import { SidebarUI } from './ui/hud/Sidebar.js';
import { LogConsole } from './ui/hud/Console.js';

// Función de inicialización principal
const init = async () => {
    console.log(`⚡ Iniciando Pikachu-Simulator v${CONFIG.VERSION}...`);

    // 1. Referencias al DOM
    const canvas = document.getElementById('grid-canvas');
    const logContainer = document.getElementById('log-console');
    
    // Elementos de la UI (asegúrate de que existan en tu index.html)
    const metrics = document.getElementById('system-metrics');
    const linesStatus = document.getElementById('lines-status');
    const overlay = document.getElementById('status-overlay');
    const clock = document.getElementById('clock');

    // Validación básica
    if (!canvas || !logContainer) {
        console.error("❌ Error Crítico: No se encontraron los elementos base del DOM (canvas o consola).");
        return;
    }

    // Ajustar canvas al tamaño del contenedor
    const resizeCanvas = () => {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    resizeCanvas();

    // 2. Cargar Imágenes (Assets)
    // Esto es vital para que no falle el renderizado de iconos
    const assetLoader = new AssetLoader();
    const assets = await assetLoader.loadAll();

    // 3. Inicializar Componentes del Sistema
    
    // Renderer: Se encarga de pintar en el canvas
    const renderer = new CanvasRenderer(canvas, assets);
    
    // Logger: Maneja los mensajes en la consola visual
    const logger = new LogConsole(logContainer);
    
    // Simulation: El cerebro del sistema (contiene nodos y lógica eléctrica)
    const simulation = new PowerGridSimulation(renderer, logger, { metrics, linesStatus, overlay, clock });
    
    // Controls: Maneja el mouse (arrastrar y cortar)
    const controls = new Interactions(canvas, simulation);
    
    // Sidebar: Botones laterales
    const sidebar = new SidebarUI(simulation);

    // --- CONEXIÓN CLAVE PARA LA TIJERA ---
    // Le pasamos los controles al sidebar para que el botón "Cortar" pueda cambiar el modo del mouse
    sidebar.setControls(controls); 

    // 4. Iniciar Lógica
    // Generamos la red inicial
    simulation.resetGrid(canvas.width, canvas.height);
    
    // Iniciamos los escuchas de eventos (clics, movimiento mouse)
    controls.initListeners();
    sidebar.init();
    
    logger.log('Sistema en línea. Listo para operación.', 'success');

    // 5. Bucle de Juego (60 FPS aprox)
    const gameLoop = new GameLoop((deltaTime) => {
        simulation.update(deltaTime);
        renderer.render(simulation);
    });

    gameLoop.start();

    // Manejar redimensionado de ventana para que el canvas no se deforme
    window.addEventListener('resize', () => {
        resizeCanvas();
        simulation.resetGrid(canvas.width, canvas.height);
    });
};

// Esperar a que el HTML cargue completo antes de iniciar
window.addEventListener('DOMContentLoaded', init);