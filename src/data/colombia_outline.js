// src/data/colombia_outline.js

// Contorno simplificado de Colombia (Longitud, Latitud)
export const COLOMBIA_OUTLINE = [
    [-71.7, 12.5], [-71.1, 11.8], [-72.1, 11.5], [-72.9, 11.3], 
    [-74.8, 11.1], [-75.3, 10.3], [-76.4, 9.4], [-77.0, 8.5],
    [-77.4, 7.2],  [-77.9, 6.5],  [-77.4, 5.0], [-77.5, 4.0],
    [-78.5, 2.5],  [-79.0, 1.6],  [-78.8, 1.2], [-76.0, 0.5],
    [-75.2, -0.1], [-74.0, -2.0], [-72.0, -3.0], [-70.0, -4.2],
    [-69.4, -1.0], [-67.8, 1.5],  [-67.4, 4.0],  [-67.5, 6.1],
    [-70.5, 6.5],  [-71.0, 7.0],  [-72.0, 8.5],  [-72.5, 9.5],
    [-73.0, 10.5], [-71.7, 12.5]
];

// Nodos Reales
export const REAL_NODES_DATA = [
    { id: 'GEN-01', name: 'Hidroituango', type: 'gen', lat: 7.13, lon: -75.64, mw: 2400 },
    { id: 'GEN-02', name: 'Guavio',       type: 'gen', lat: 4.69, lon: -73.50, mw: 1200 },
    { id: 'LOAD-01', name: 'Bogotá',       type: 'load', lat: 4.61, lon: -74.08, mw: 2000 },
    { id: 'LOAD-02', name: 'Medellín',     type: 'load', lat: 6.24, lon: -75.56, mw: 1500 },
    { id: 'LOAD-03', name: 'Cali',         type: 'load', lat: 3.45, lon: -76.53, mw: 1200 },
    { id: 'LOAD-04', name: 'Barranquilla', type: 'load', lat: 10.96, lon: -74.80, mw: 1100 },
    { id: 'LOAD-05', name: 'Bucaramanga',  type: 'load', lat: 7.11, lon: -73.12, mw: 800 }
];