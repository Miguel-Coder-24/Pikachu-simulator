export class GameLoop {
    constructor(updateCallback) {
        this.updateCallback = updateCallback;
        this.lastTime = 0;
        this.isRunning = false;
        this.frameId = null;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        this.loop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
        if (this.frameId) cancelAnimationFrame(this.frameId);
    }

    loop(currentTime) {
        if (!this.isRunning) return;

        // Calcular delta (tiempo que pasó desde el último frame)
        const deltaTime = (currentTime - this.lastTime) / 1000; // en segundos
        this.lastTime = currentTime;

        // Ejecutar la lógica del juego
        this.updateCallback(deltaTime);

        // Pedir el siguiente frame
        this.frameId = requestAnimationFrame((t) => this.loop(t));
    }
}