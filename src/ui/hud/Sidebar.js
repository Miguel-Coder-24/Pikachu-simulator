export class SidebarUI {
    constructor(simulation) {
        this.simulation = simulation;
    }

    init() {
        const btnPeak = document.getElementById('btn-peak');
        const btnTrip = document.getElementById('btn-trip');
        const btnReset = document.getElementById('btn-reset');

        if (btnPeak) btnPeak.addEventListener('click', () => this.simulation.triggerPeakLoad());
        if (btnTrip) btnTrip.addEventListener('click', () => this.simulation.tripRandomLine());
        if (btnReset) btnReset.addEventListener('click', () => {
            const canvas = document.getElementById('grid-canvas');
            this.simulation.resetGrid(canvas?.width, canvas?.height);
        });
    }
}
