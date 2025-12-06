export class LogConsole {
    constructor(container) {
        this.container = container;
    }

    log(message, type = 'info') {
        if (!this.container) return;
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.innerText = message;
        this.container.prepend(entry);
    }
}
