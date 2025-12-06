export const CONFIG = {
    // Metadatos
    VERSION: '0.2.0 (High Voltage)',
    SEED_SAMPLE: true,

    // Configuración visual
    GRID_SIZE: 40,
    BACKGROUND_COLOR: '#0a0a0f', // Negro azulado muy oscuro
    GRID_LINE_COLOR: '#1a1a25',
    
    COLORS: {
        // Amarillo Eléctrico para Generadores (Pikachu Style)
        SOURCE: '#FFD700', 
        SOURCE_GLOW: '#FFC107',
        
        // Azul Cian Neón para las Cargas (Ciudades)
        LOAD: '#00E5FF',
        LOAD_GLOW: '#00B8D4',
        
        // Colores de cables
        LINE_OFF: '#2c2c3a',
        LINE_NORMAL: '#FFD700', // El cable toma el color de la energía
        LINE_CRITICAL: '#FF3D00', // Rojo anaranjado brillante
        
        GRID_ACCENT: '#233042'
    },

    UI: {
        SIDEBAR_WIDTH: 320,
        CONSOLE_HEIGHT: 200
    },

    // Configuración del sistema
    DEBUG_MODE: true
};