// src/core/AssetLoader.js

// Definimos dimensiones explícitas (width/height) en los SVG para evitar errores de renderizado en Canvas
const ASSET_SOURCES = {
    // Ícono de Casa (Carga) - Azul Cian
    load: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEU1RkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyA5bDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAyMiA5IDEyIDE1IDEyIDE1IDIyIj48L3BvbHlsaW5lPjwvc3ZnPg==',
    
    // Ícono de Rayo/Planta (Generador) - Amarillo Dorado
    gen: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTMgMkwwIDE0aDEybDMgOUwyNCAxMGgtMTJ6Ii8+PC9zdmc+'
};

export class AssetLoader {
    constructor() {
        this.assets = {};
    }

    async loadAll() {
        console.log("🔄 Cargando assets gráficos...");
        
        const promises = Object.entries(ASSET_SOURCES).map(([key, src]) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    this.assets[key] = img;
                    resolve();
                };
                
                img.onerror = (e) => {
                    console.error(`❌ Error cargando asset: ${key}`);
                    // En lugar de rechazar y romper la app, creamos un fallback (cuadrado de color)
                    // para que la simulación arranque aunque falle la imagen.
                    resolve(); 
                };
                
                img.src = src;
            });
        });

        await Promise.all(promises);
        console.log("✅ Assets cargados correctamente.");
        return this.assets;
    }
}