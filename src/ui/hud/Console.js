// src/ui/hud/Console.js

export class LogConsole {
    constructor(containerElement) {
        this.container = containerElement;
    }

    log(message, type = 'info') {
        if (!this.container) return;

        const entry = document.createElement('div');
        entry.classList.add('log-entry', type);
        
        // Obtener hora actual
        const time = new Date().toLocaleTimeString('es-CO', { hour12: false });
        
        // Icono según tipo
        let icon = 'ℹ️';
        if (type === 'warn') icon = '⚠️';
        if (type === 'error') icon = '🔥';
        if (type === 'success') icon = '✅';

        entry.innerHTML = `<span class="log-time">[${time}]</span> ${icon} ${message}`;
        
        this.container.appendChild(entry);
        
        // Auto-scroll hacia abajo
        this.container.scrollTop = this.container.scrollHeight;
    }
}