// src/core/AssetLoader.js

// Iconos SVG Base64 (Ya los tenías, los mantenemos igual)
const ICONS = {
    load: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMEU1RkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyA5bDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAyMiA5IDEyIDE1IDEyIDE1IDIyIj48L3BvbHlsaW5lPjwvc3ZnPg==',
    gen: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkQ3MDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTMgMkwwIDE0aDEybDMgOUwyNCAxMGgtMTJ6Ii8+PC9zdmc+'
};

// URL de datos abiertos con el contorno de Colombia de alta precisión
const GEOJSON_URL = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/COL.geo.json';

export class AssetLoader {
    constructor() {
        this.assets = {};
        this.mapData = null; // Aquí guardaremos el GeoJSON
    }

    async loadAll() {
        console.log("🔄 Cargando recursos...");

        // 1. Cargar Imágenes
        const imagePromises = Object.entries(ICONS).map(([key, src]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => { this.assets[key] = img; resolve(); };
                img.onerror = () => { console.warn(`Fallo icono ${key}`); resolve(); };
                img.src = src;
            });
        });

        // 2. Cargar Mapa GeoJSON (Fetch)
        const mapPromise = fetch(GEOJSON_URL)
            .then(response => response.json())
            .then(data => {
                this.mapData = data;
                console.log("🗺️ Mapa de Colombia de alta precisión descargado.");
            })
            .catch(err => {
                console.error("Error descargando mapa:", err);
                this.mapData = null; // Fallback a nulo si no hay internet
            });

        await Promise.all([...imagePromises, mapPromise]);
        
        return { images: this.assets, mapGeoJSON: this.mapData };
    }
}