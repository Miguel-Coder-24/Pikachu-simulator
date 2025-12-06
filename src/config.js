export const CONFIG = {
    // Metadatos
    VERSION: '0.2.0 (High Voltage)',
    SEED_SAMPLE: true,

    // Mundo virtual donde se renderiza Colombia
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 2500,

    // Configuración visual
    GRID_SIZE: 40,
    BACKGROUND_COLOR: '#0a0a0f',
    GRID_LINE_COLOR: '#1a1a25',
    
    COLORS: {
        // Generadores
        SOURCE: '#FFD700',
        SOURCE_GLOW: '#FFC107',

        // Cargas
        LOAD: '#00E5FF',
        LOAD_GLOW: '#00B8D4',

        // Líneas
        LINE_OFF: '#2c2c3a',
        LINE_NORMAL: '#FFD700',
        LINE_CRITICAL: '#FF3D00',

        // Accento de grilla
        GRID_ACCENT: '#233042'
    },

    // UI
    UI: {
        SIDEBAR_WIDTH: 320,
        CONSOLE_HEIGHT: 200
    },

    // Modo depuración
    DEBUG_MODE: true
};
