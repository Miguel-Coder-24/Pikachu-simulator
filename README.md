# ⚡ Pikachu Simulator — Digital Twin de la Red Eléctrica Colombiana

**Pikachu Simulator** es un *Digital Twin* interactivo que modela en tiempo real una red eléctrica basada en nodos georreferenciados de Colombia.  
Combina visualización avanzada, física simplificada de flujos eléctricos, fallas térmicas automáticas y herramientas de análisis para entender el comportamiento dinámico de una red de transmisión a gran escala.

El objetivo es ofrecer una plataforma moderna, visual y altamente intuitiva para explorar conceptos de ingeniería eléctrica, análisis de redes y operación del sistema.

---

## 🚀 Características Principales

- **Mapa georreferenciado de Colombia** (GeoJSON de alta precisión).
- **Nodos reales** de generación y carga: hidroeléctricas, ciudades, centros de demanda.
- **Simulación de flujos eléctricos** basada en diferencias de potencial virtual.
- **Líneas de transmisión con capacidad, impedancia y sobrecalentamiento térmico**.
- **Disparos automáticos por sobrecarga** (protección térmica en tiempo real).
- **Interfaz estilo SCADA/Control Room**, moderna y responsiva.
- **Cámara dinámica** con zoom, paneo y navegación fluida.
- **Interacción total**:
  - Arrastrar nodos.
  - Cortar líneas manualmente.
  - Falla aleatoria.
  - Simular picos nacionales de demanda.
- **Sistema de registro de eventos** para auditoría operacional.

---

## 🎮 Controles

- **Clic izquierdo**: seleccionar y arrastrar nodos.  
- **Clic derecho / rueda presionada**: panear el mapa.  
- **Rueda del mouse**: zoom suave.  
- **Botón ✂️**: cortar líneas manualmente.  
- **Botones laterales**: pico de demanda, falla aleatoria, regenerar topología.

---

## 🛠️ Tecnologías

- **JavaScript ES Modules**
- **Canvas 2D Rendering**
- **Sistema modular personalizado**
- **GeoJSON + proyección manual**
- **CSS moderno (glassmorphism + neon)**

---

## 📦 Cómo usar

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Miguel-Coder-24/Pikachu-simulator
2. Abre un servidor local (recomendado):
   ```bash
   python3 -m http.server 8000
3. Entra a:
   ```arduino
   http://localhost:8000

🌩️ Objetivo del proyecto

Crear un simulador visualmente atractivo y técnicamente sólido que permita explorar, entender y experimentar con el comportamiento dinámico de una red eléctrica real, combinando ingeniería, computación gráfica y diseño intuitivo.

👨‍💻 Autores
Estudiantes de Ingeniería y Ciencias de la Universidad Nacional de Colombia
