// src/ui/hud/Sidebar.js

export class SidebarUI {
    constructor(simulation) {
        this.simulation = simulation;
        this.controls = null; // Referencia a Interactions.js
        
        // Elementos del DOM
        this.btnPeak = document.getElementById('btn-peak');
        this.btnTrip = document.getElementById('btn-trip');
        this.btnReset = document.getElementById('btn-reset');
    }

    setControls(controls) {
        this.controls = controls;
    }

    init() {
        if (this.btnPeak) {
            this.btnPeak.addEventListener('click', () => {
                this.simulation.triggerPeakLoad();
            });
        }

        if (this.btnTrip) {
            this.btnTrip.addEventListener('click', () => {
                this.simulation.tripRandomLine();
            });
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => {
                // Reiniciamos con el tamaño actual del canvas (aunque simulation ya usa WORLD constants)
                this.simulation.resetGrid(); 
            });
        }
        
        // Botón extra para "Modo Corte" (Si quisieras agregarlo al HTML)
        // Por ahora simularemos que cortar líneas es con Ctrl + Click o agregamos un botón manualmente si existe
        // Como no está en el HTML original, lo dejamos simple.
    }
}