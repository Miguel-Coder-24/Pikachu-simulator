export class SidebarUI {
    constructor(simulation, interactions) {
        this.simulation = simulation;
        this.interactions = interactions;
        this.activeType = 'source';
        this.sidebarEl = null;
    }

    init() {
        const container = document.getElementById('app-container');
        if (!container) return;

        this.sidebarEl = document.createElement('aside');
        this.sidebarEl.id = 'sidebar';

        const title = document.createElement('h1');
        title.textContent = 'Pikachu Simulator';

        const subtitle = document.createElement('p');
        subtitle.textContent = 'Elige qué colocar y haz clic en la grilla.';

        const buttonsWrapper = document.createElement('div');
        buttonsWrapper.className = 'sidebar__buttons';

        const sourceBtn = this.createButton('Generador ⚡', 'source');
        const loadBtn = this.createButton('Consumo 🏠', 'load');
        const resetBtn = this.createResetButton();

        buttonsWrapper.appendChild(sourceBtn);
        buttonsWrapper.appendChild(loadBtn);
        buttonsWrapper.appendChild(resetBtn);

        const tips = document.createElement('small');
        tips.textContent = 'Clic izquierdo: tipo seleccionado. Clic derecho: consumo rápido.';

        this.sidebarEl.appendChild(title);
        this.sidebarEl.appendChild(subtitle);
        this.sidebarEl.appendChild(buttonsWrapper);
        this.sidebarEl.appendChild(tips);

        container.prepend(this.sidebarEl);
        this.setActiveButton(sourceBtn);
    }

    createButton(label, type) {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.dataset.type = type;
        btn.addEventListener('click', () => {
            this.activeType = type;
            this.interactions.setPlacementType(type);
            this.setActiveButton(btn);
        });
        return btn;
    }

    createResetButton() {
        const btn = document.createElement('button');
        btn.textContent = 'Limpiar todo';
        btn.className = 'ghost';
        btn.addEventListener('click', () => {
            if (this.simulation.reset) {
                this.simulation.reset();
            } else {
                this.simulation.nodes.length = 0;
                this.simulation.cables.length = 0;
                this.simulation.nodeIdCounter = 0;
                this.simulation.isDirty = true;
            }
        });
        return btn;
    }

    setActiveButton(activeBtn) {
        if (!this.sidebarEl) return;
        this.sidebarEl.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }
}
