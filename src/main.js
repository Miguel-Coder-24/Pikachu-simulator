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

const init = async () => {
    console.log(`⚡ Iniciando Pikachu-Simulator v${CONFIG.VERSION}...`);

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

    // B) Renderizador (AQUI ESTABA EL ERROR: FALTABA PASAR LA CÁMARA)
    const renderer = new CanvasRenderer(canvas, assets, camera); // <--- CORREGIDO

    // C) Consola de logs
    const logger = new LogConsole(logContainer);

    // D) Simulación
    const simulation = new PowerGridSimulation(renderer, logger, { metrics, linesStatus, overlay, clock });

    // E) Controles (Mouse/Teclado)
    const controls = new Interactions(canvas, simulation, camera);

    // F) Sidebar (Botones)
    const sidebar = new SidebarUI(simulation);
    sidebar.setControls(controls);
    sidebar.init();

    // 4. Iniciar Lógica
    simulation.resetGrid(); // Ya no necesita params, usa CONFIG global
    controls.initListeners();

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