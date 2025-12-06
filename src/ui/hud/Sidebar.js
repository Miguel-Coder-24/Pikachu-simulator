// src/ui/hud/Sidebar.js

export class SidebarUI {
    constructor(simulation) {
        this.simulation = simulation;
        // Necesitamos acceso a los controles (Interactions) para cambiar el modo
        // Lo asignaremos en el main.js
        this.controls = null; 
    }

    setControls(controls) {
        this.controls = controls;
    }

    init() {
        const btnPeak = document.getElementById('btn-peak');
        const btnTrip = document.getElementById('btn-trip');
        const btnReset = document.getElementById('btn-reset');

        // Referencia al contenedor de controles globales
        const panel = document.querySelector('.panel'); 

        // 1. Crear botón de Tijeras dinámicamente
        const btnCut = document.createElement('button');
        btnCut.innerHTML = '✂️ Cortar Líneas';
        btnCut.style.marginTop = '10px';
        btnCut.style.border = '1px solid #FF3D00';
        
        // Insertarlo después de los otros botones
        panel.appendChild(btnCut);

        // --- Listeners ---

        if (btnPeak) btnPeak.addEventListener('click', () => this.simulation.triggerPeakLoad());
        
        if (btnTrip) btnTrip.addEventListener('click', () => this.simulation.tripRandomLine());
        
        if (btnReset) btnReset.addEventListener('click', () => {
            const canvas = document.getElementById('grid-canvas');
            this.simulation.resetGrid(canvas?.width, canvas?.height);
        });

        // Lógica del botón Tijeras (Toggle)
        btnCut.addEventListener('click', () => {
            if (!this.controls) return;

            if (this.controls.mode === 'normal') {
                this.controls.setMode('cut');
                btnCut.classList.add('active-tool');
                btnCut.innerHTML = '✂️ MODO CORTE ACTIVO';
            } else {
                this.controls.setMode('normal');
                btnCut.classList.remove('active-tool');
                btnCut.innerHTML = '✂️ Cortar Líneas';
            }
        });
    }
}