// 1. Importamos la Configuración Global
import { CONFIG } from './config.js';

// 2. Importamos el Core (Lógica)
import { PowerGridSimulation } from './core/PowerGridSimulation.js';
import { GameLoop } from './core/GameLoop.js';

// 3. Importamos la UI (Presentación)
import { CanvasRenderer } from './ui/CanvasRenderer.js';
import { Interactions } from './ui/Interactions.js';
import { SidebarUI } from './ui/hud/Sidebar.js';
import { LogConsole } from './ui/hud/Console.js';

// Función de inicialización principal
const init = () => {
    console.log(`⚡ Iniciando Pikachu-Simulator v${CONFIG.VERSION}...`);

    // A. Referencias al DOM
    const canvas = document.getElementById('grid-canvas');
    const metrics = document.getElementById('system-metrics');
    const linesStatus = document.getElementById('lines-status');
    const overlay = document.getElementById('status-overlay');
    const clock = document.getElementById('clock');
    const logContainer = document.getElementById('log-console');

    if (!canvas || !logContainer) {
        console.error('Error: elementos base no encontrados');
        return;
    }

    const resizeCanvas = () => {
        const container = document.getElementById('canvas-container');
        if (!container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
    };
    resizeCanvas();

    const renderer = new CanvasRenderer(canvas);
    const logger = new LogConsole(logContainer);
    const simulation = new PowerGridSimulation(renderer, logger, { metrics, linesStatus, overlay, clock });
    const controls = new Interactions(canvas, simulation);
    const sidebar = new SidebarUI(simulation);

    simulation.resetGrid(canvas.width, canvas.height);

    const gameLoop = new GameLoop((deltaTime) => {
        simulation.update(deltaTime);
        renderer.render(simulation);
    });

    controls.initListeners();
    sidebar.init();
    logger.log('Listo. Arrastra nodos o usa los controles para ver eventos.');

    gameLoop.start();

    window.addEventListener('resize', () => {
        resizeCanvas();
        simulation.resetGrid(canvas.width, canvas.height);
    });
};

// Esperar a que el HTML cargue completo antes de iniciar
window.addEventListener('DOMContentLoaded', init);
