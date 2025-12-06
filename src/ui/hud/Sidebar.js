// src/ui/hud/Sidebar.js

export class SidebarUI {
    constructor(simulation) {
        this.simulation = simulation;
        this.controls = null;
        
        this.btnPeak = document.getElementById('btn-peak');
        this.btnTrip = document.getElementById('btn-trip');
        this.btnReset = document.getElementById('btn-reset');
        
        // 1. Referencia al nuevo botón
        this.btnCut = document.getElementById('btn-cut'); 
    }

    setControls(controls) {
        this.controls = controls;
    }

    init() {
        if (this.btnPeak) {
            this.btnPeak.addEventListener('click', () => this.simulation.triggerPeakLoad());
        }

        if (this.btnTrip) {
            this.btnTrip.addEventListener('click', () => this.simulation.tripRandomLine());
        }

        if (this.btnReset) {
            this.btnReset.addEventListener('click', () => this.simulation.resetGrid());
        }

        // 2. Lógica de la Tijera
        if (this.btnCut) {
            this.btnCut.addEventListener('click', () => {
                if (!this.controls) return;

                // Alternar entre modo 'cut' y 'normal'
                if (this.controls.mode === 'normal') {
                    this.controls.setMode('cut');
                    this.btnCut.textContent = 'Cancelar Corte (Esc)';
                    this.btnCut.classList.add('active');
                } else {
                    this.controls.setMode('normal');
                    this.btnCut.textContent = '✂️ Cortar Línea (Manual)';
                    this.btnCut.classList.remove('active');
                }
            });
        }
    }
}