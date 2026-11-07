# KABERT TREASURE
## Videojuego 3D Voxel de Aventura, Exploración, Combate y Desafíos Educativos

**Desarrollador:** KABERT LAB by LMKE  
**Autor:** Luis Miguel Kapa Escobar  
**WhatsApp:** +591 65596602  
**Eslogan:** Explora. Descubre. Responde. ¡Conquista!

---

### 1. DESCRIPCIÓN GENERAL
**KABERT TREASURE** es un videojuego tridimensional completo ambientado en un universo enteramente voxel estilo Minecraft. El jugador explora cinco grandes mundos, conduce vehículos, busca tesoros ocultos, resuelve acertijos educativos con tiempo límite, utiliza poderes especiales y combate contra criaturas y cinco colosales jefes finales.

---

### 2. EJECUCIÓN DIRECTA CON DOBLE CLIC (PORTABILIDAD TOTAL)
Este juego fue diseñado para ejecutarse sin requerir terminal, Node.js ni servidores externos:
1. Descarga el archivo `KABERT-TREASURE.zip` pulsando el botón correspondiente dentro del menú del juego.
2. Descomprímelo en cualquier carpeta de tu ordenador.
3. Haz **doble clic en `index.html`**.
4. ¡El juego comenzará inmediatamente en tu navegador!

---

### 3. PUBLICACIÓN EN GITHUB PAGES
Para tener tu videojuego publicado en la web gratis y de forma permanente:
1. Crea un repositorio en GitHub.
2. Sube todos los archivos (asegurándote de que `index.html` esté en la raíz).
3. Dirígete a **Settings -> Pages**.
4. En **Branch**, selecciona `main` y la carpeta `/root`.
5. Guarda los cambios. Tu juego estará disponible en la URL de GitHub Pages.

---

### 4. LOS CINCO GRANDES MUNDOS Y JEFES
1. **Mundo 1: Isla del Tesoro**: Playas, palmeras, piratas y templos antiguos.  
   *Jefe:* **Kraken, el Guardián del Abismo** (Criatura marina gigante con 4 tentáculos articulados).
2. **Mundo 2: Ciudad Perdida**: Avenidas, rascacielos explorables, puentes elevados y drones mecánicos.  
   *Jefe:* **Titán X-9, el Coloso Mecánico** (Robot colosal con cañones láser).
3. **Mundo 3: Bosque Misterioso**: Árboles secuoya gigantes, flora luminosa y lobos espectrales.  
   *Jefe:* **Malgor, el Señor de las Sombras** (Señor de la oscuridad con cuernos de vacío).
4. **Mundo 4: Reino Nocturno**: Castillos góticos, murallas, criptas y caballeros oscuros.  
   *Jefe:* **Noctar, el Rey de la Oscuridad** (Monarca acorazado con manto y gran espada).
5. **Mundo 5: Fortaleza del Tesoro**: Ríos de magma, ciudadela de obsidiana y guardianes de lava.  
   *Jefe:* **Dragón Omega, el Guardián del Tesoro Supremo** (Enorme dragón alado que escupe fuego).

---

### 5. SISTEMA DE AUDIO Y MÚSICA
La carpeta `audio/` gestiona las cuatro pistas musicales en formato MP3:
- `audio/menu.mp3`: Pantalla de inicio y creador de personajes.
- `audio/juego1.mp3`: Mundos 1 y 2.
- `audio/juego2.mp3`: Mundos 3 y 4.
- `audio/final.mp3`: Mundo 5 y secuencia final de victoria.

*Nota técnica:* Si no cuentas con los archivos MP3, el motor de sonido sintetiza música chiptune en tiempo real mediante **Web Audio API**. Todos los efectos de sonido (disparos, impactos, explosiones, motores, pisadas, fanfarrias) son generados 100% por código de síntesis de osciladores y filtros sin dependencias externas.

---

### 6. BANCO DE PREGUNTAS EDUCATIVAS (.kab)
El archivo `data/preguntas.kab` contiene las preguntas del juego. Formato:

```txt
P: ¿Cuánto vale una blanca en música?
A: 1 tiempo
B: 2 tiempos R
C: 3 tiempos
D: 4 tiempos
```
- La letra `R` al final de la opción indica la respuesta correcta (nunca se le muestra al jugador).
- Cada pregunta debe contener 4 alternativas (A, B, C, D) y exactamente una opción correcta marcada con `R`.
- El juego incluye un gestor interactivo que permite cargar cualquier archivo `.kab` desde el ordenador con validación automática de errores.

---

### 7. CONTROLES

#### En Computadora (Teclado y Ratón):
- **W, A, S, D**: Moverse
- **Espacio**: Saltar / Ascender en modo vuelo
- **Shift**: Correr
- **Clic Izquierdo**: Disparar láser (Inicias con 10 disparos exactos)
- **Clic Derecho**: Apuntar
- **V**: Alternar entre 1ª y 3ª persona
- **F**: Entrar / Salir de vehículos (Coches deportivos, buggies, motos)
- **E**: Abrir cofres de preguntas e interactuar
- **M**: Abrir mapa táctico del mundo
- **Esc**: Pausar juego y menú de ajustes

#### En Dispositivos Móviles y Tabletas:
- **Joystick virtual** en pantalla para movimiento analógico.
- **Zona táctil derecha** para rotar la cámara.
- Botones de acción semitransparentes para saltar, disparar, apuntar, vehículo, cámara e interactuar.

---

### 8. CRÉDITOS Y CONTACTO
- **Videojuego:** KABERT TREASURE
- **Desarrollador:** KABERT LAB by LMKE
- **Autor:** Luis Miguel Kapa Escobar
- **WhatsApp:** +591 65596602
