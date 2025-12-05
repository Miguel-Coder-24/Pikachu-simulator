// 1. Importamos la Configuración Global
import { CONFIG } from './config.js';

// 2. Importamos el Core (Lógica)
import { PowerGridSimulation } from './core/PowerGridSimulation.js';
import { GameLoop } from './core/GameLoop.js'; // Recomendado para manejar el tiempo
import { FlowSolver } from './core/FlowSolver.js';

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
    const container = document.getElementById('app-container');

    if (!canvas) {
        console.error("Error: No se encontró el elemento <canvas>");
        return;
    }

    // Ajustar canvas al tamaño de ventana (opcional, pero recomendado)
    canvas.width = window.innerWidth - 300; // Restamos espacio del sidebar
    canvas.height = window.innerHeight;

    // B. Instanciar el Sistema Central (El "Estado" del juego)
    // PowerGridSimulation contiene la lista de nodos, cables y el estado actual.
    const simulation = new PowerGridSimulation();
    
    // El Solver necesita acceso a la simulación para calcular flujos
    const solver = new FlowSolver();

    // C. Instanciar el Sistema de Renderizado
    // El Renderer necesita el canvas para dibujar y saber qué dibujar (simulation)
    const renderer = new CanvasRenderer(canvas);

    // D. Instanciar Interacciones (Mouse/Teclado)
    // Interactions necesita modificar la simulación y saber coordenadas del renderer
    const controls = new Interactions(canvas, simulation, renderer);

    // E. Inicializar UI del DOM (Barras laterales, botones)
    const sidebar = new SidebarUI(simulation, controls);
    const logger = new LogConsole();

    // F. Configurar el Bucle de Juego (Game Loop)
    // Este ciclo corre 60 veces por segundo (aprox)
    const gameLoop = new GameLoop((deltaTime) => {
        
        // 1. UPDATE: Actualizar lógica física y eléctrica
        // Si hay cambios en la red, recalculamos el flujo
        if (simulation.isDirty) {
            solver.calculateFlow(simulation);
            simulation.isDirty = false; // Marcar como "limpio" hasta el prox cambio
        }
        
        // Actualizar físicas (animaciones, partículas, sobrecargas)
        simulation.update(deltaTime);

        // 2. DRAW: Dibujar todo en pantalla
        renderer.clear();
        renderer.drawGrid();              // Fondo
        renderer.drawCables(simulation.cables, simulation.nodes);
        renderer.drawNodes(simulation.nodes);
        renderer.drawEffects();           // Chispas, íconos de alerta
        
        // (Opcional) Debug info
        if (CONFIG.DEBUG_MODE) {
            renderer.drawDebugInfo(simulation);
        }
    });

    // G. ¡Arrancar motores!
    controls.initListeners(); // Escuchar clics
    sidebar.init();           // Crear botones HTML
    logger.init();            // Colocar consola básica
    gameLoop.start();         // Iniciar el requestAnimationFrame
};

// Esperar a que el HTML cargue completo antes de iniciar
window.addEventListener('DOMContentLoaded', init);
