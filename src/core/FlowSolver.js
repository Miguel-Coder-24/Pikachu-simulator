export class FlowSolver {
    calculateFlow(simulation) {
        console.log("Recalculando flujo eléctrico...");
        
        // 1. Resetear todo a apagado
        simulation.nodes.forEach(n => n.isPowered = false);

        // 2. Encontrar fuentes de energía (Generadores)
        const sources = simulation.nodes.filter(n => n.type === 'source');

        // 3. Lógica simple de propagación (Fake Flow por ahora)
        // Si es una fuente, está encendida y propaga por los cables.
        const nodeMap = new Map(simulation.nodes.map(n => [n.id, n]));
        const getNode = (ref) => typeof ref === 'number' ? nodeMap.get(ref) : ref;

        const visited = new Set();
        const queue = [];

        sources.forEach(source => {
            source.isPowered = true;
            visited.add(source.id);
            queue.push(source);
        });

        while (queue.length) {
            const current = queue.shift();
            const connectedCables = simulation.cables.filter(c => {
                const fromId = typeof c.from === 'number' ? c.from : c.from?.id;
                const toId = typeof c.to === 'number' ? c.to : c.to?.id;
                return fromId === current.id || toId === current.id;
            });

            connectedCables.forEach(cable => {
                const neighborRef = (typeof cable.from === 'number' ? cable.from : cable.from?.id) === current.id ? cable.to : cable.from;
                const neighbor = getNode(neighborRef);
                if (!neighbor || visited.has(neighbor.id)) return;
                neighbor.isPowered = true;
                visited.add(neighbor.id);
                queue.push(neighbor);
            });
        }
    }
}
