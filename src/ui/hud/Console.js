export class LogConsole {
    constructor() {
        this.container = null;
    }

    init() {
        const container = document.getElementById('app-container');
        if (!container) return;

        this.container = document.createElement('div');
        this.container.id = 'log-console';

        const header = document.createElement('div');
        header.className = 'log-console__header';
        header.textContent = 'Consola';

        const body = document.createElement('div');
        body.className = 'log-console__body';

        this.container.appendChild(header);
        this.container.appendChild(body);
        container.appendChild(this.container);
    }

    log(message) {
        if (!this.container) return;
        const body = this.container.querySelector('.log-console__body');
        const line = document.createElement('div');
        line.textContent = message;
        body.appendChild(line);
        body.scrollTop = body.scrollHeight;
    }
}
