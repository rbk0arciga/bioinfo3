// ==========================================================================
//  VISOR 3D INTERACTIVO CON THREE.JS
//  Ricardo Melgoza y Rebeca Arciga
// ==========================================================================

// --------------------------------------------------------------------------
// 1. ESCENA
//    La escena es el contenedor donde viven mallas, luces y cámaras.
// --------------------------------------------------------------------------
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x0d1117);
escena.fog = new THREE.Fog(0x0d1117, 14, 34);

// --------------------------------------------------------------------------
// 2. CÁMARA EN PERSPECTIVA
//    (campo de visión, relación de aspecto, plano cercano, plano lejano)
// --------------------------------------------------------------------------
const camara = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);
camara.position.set(7, 5.5, 13);

// --------------------------------------------------------------------------
// 3. RENDERER
//    Toma la escena + la cámara y dibuja el resultado en el <canvas>.
// --------------------------------------------------------------------------
const lienzo = document.getElementById('lienzo');

const renderizador = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;

// --------------------------------------------------------------------------
// 6. ILUMINACIÓN
// --------------------------------------------------------------------------
escena.add(new THREE.AmbientLight(0xffffff, 0.35));          // luz general

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 0.9);
luzPrincipal.position.set(6, 10, 6);
luzPrincipal.castShadow = true;
luzPrincipal.shadow.mapSize.set(1024, 1024);
luzPrincipal.shadow.camera.left = -12;
luzPrincipal.shadow.camera.right = 12;
luzPrincipal.shadow.camera.top = 12;
luzPrincipal.shadow.camera.bottom = -12;
escena.add(luzPrincipal);

const luzPunto = new THREE.PointLight(0x58a6ff, 0.8, 30);    // luz azul de relleno
luzPunto.position.set(-6, 4, -4);
escena.add(luzPunto);

// --------------------------------------------------------------------------
// 4 y 5. GEOMETRÍAS BÁSICAS CON MATERIALES DIFERENTES
// --------------------------------------------------------------------------
const seleccionables = [];   // lista de objetos que el raycaster puede tocar

function registrar(malla, nombre, detalle) {
    malla.userData.nombre = nombre;
    malla.userData.detalle = detalle;
    malla.userData.colorOriginal = malla.material.color.getHex();
    escena.add(malla);
    seleccionables.push(malla);
    return malla;
}

// --- PLANO (suelo) · MeshLambertMaterial ---
const plano = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshLambertMaterial({ color: 0x2d333b, side: THREE.DoubleSide })
);
plano.rotation.x = -Math.PI / 2;   // lo acostamos para que sea piso
plano.position.y = -1.6;
plano.receiveShadow = true;
registrar(plano, 'Plano', 'PlaneGeometry(24, 24) con MeshLambertMaterial. Sirve de suelo y recibe las sombras de los demás objetos.');

// --- CUBO · MeshStandardMaterial (PBR, metálico) ---
const cubo = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.8, 1.8),
    new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.6, roughness: 0.3 })
);
cubo.position.set(-4.5, 0, 0);
cubo.castShadow = true;
registrar(cubo, 'Cubo', 'BoxGeometry con MeshStandardMaterial (metalness 0.6). 6 caras · 12 aristas · 8 vértices.');

// --- ESFERA · MeshPhongMaterial (brillo especular) ---
const esfera = new THREE.Mesh(
    new THREE.SphereGeometry(1.1, 48, 32),
    new THREE.MeshPhongMaterial({ color: 0x4ecdc4, shininess: 100, specular: 0xffffff })
);
esfera.position.set(-1.5, 0, 0);
esfera.castShadow = true;
registrar(esfera, 'Esfera', 'SphereGeometry(1.1, 48, 32) con MeshPhongMaterial. Superficie curva, sin aristas ni vértices reales.');

// --- OCTAEDRO · MeshPhongMaterial con flatShading ---
const octaedro = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.3),
    new THREE.MeshPhongMaterial({ color: 0xffd93d, flatShading: true, shininess: 30 })
);
octaedro.position.set(1.5, 0, 0);
octaedro.castShadow = true;
registrar(octaedro, 'Octaedro', 'OctahedronGeometry con flatShading. 8 caras triangulares · 12 aristas · 6 vértices.');

// --- PRISMA DE 67 CARAS · MeshStandardMaterial ---
// CylinderGeometry con 65 segmentos radiales = 65 caras laterales + 2 bases = 67 caras.
const LADOS_PRISMA = 65;
const prisma = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 2.2, LADOS_PRISMA),
    new THREE.MeshStandardMaterial({ color: 0xa78bfa, metalness: 0.2, roughness: 0.45, flatShading: true })
);
prisma.position.set(4.5, 0, 0);
prisma.castShadow = true;
registrar(prisma, 'Prisma de 67 caras',
    'CylinderGeometry(1.2, 1.2, 2.2, ' + LADOS_PRISMA + '): ' + LADOS_PRISMA +
    ' caras laterales + 2 bases = 67 caras · ' + (LADOS_PRISMA * 3) + ' aristas · ' +
    (LADOS_PRISMA * 2) + ' vértices. Cumple Euler: 67 + 130 − 195 = 2.');

// --------------------------------------------------------------------------
// 7. ORBITCONTROLS
//    Rotar (clic izquierdo), zoom (rueda) y desplazar (clic derecho).
// --------------------------------------------------------------------------
const controles = new THREE.OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;      // inercia suave
controles.dampingFactor = 0.07;
controles.minDistance = 4;
controles.maxDistance = 28;
controles.maxPolarAngle = Math.PI / 2 + 0.25;   // no dejar pasar por debajo del piso
controles.target.set(0, 1, 0);

// --------------------------------------------------------------------------
// 9. CARGA DE UN MODELO 3D EN FORMATO .glb
// --------------------------------------------------------------------------
const estado = document.getElementById('estado');
let modelo = null;

const cargador = new THREE.GLTFLoader();

cargador.load(
    'models/nudo.glb',

    // éxito
    function (gltf) {
        modelo = gltf.scene;
        modelo.position.set(0, 4.3, 0);
        modelo.scale.set(1.25, 1.25, 1.25);

        // Recorremos la jerarquía del modelo para activar sombras
        // y para registrar cada malla como seleccionable.
        modelo.traverse(function (hijo) {
            if (hijo.isMesh) {
                hijo.castShadow = true;
                hijo.userData.nombre = 'Modelo .glb — Nudo toroidal';
                hijo.userData.detalle = 'Modelo cargado con GLTFLoader desde models/nudo.glb. ' +
                    hijo.geometry.attributes.position.count + ' vértices · ' +
                    (hijo.geometry.index.count / 3) + ' triángulos.';
                hijo.userData.colorOriginal = hijo.material.color.getHex();
                seleccionables.push(hijo);
            }
        });

        escena.add(modelo);
        estado.textContent = '✅ Modelo cargado: models/nudo.glb';
    },

    // progreso
    function (evento) {
        if (evento.lengthComputable) {
            const pct = Math.round((evento.loaded / evento.total) * 100);
            estado.textContent = 'Cargando modelo 3D… ' + pct + '%';
        }
    },

    // error
   // function (error) {
     //   console.error('Error al cargar el modelo:', error);
      //  estado.className = 'error';
       // estado.textContent = '⚠️ No se pudo cargar models/nudo.glb. Abre el proyecto con un servidor local (Live Server) o desde GitHub Pages, no con file://';
    //}
);

// --------------------------------------------------------------------------
// 10 y 11. RAYCASTING: seleccionar un objeto con el mouse
// --------------------------------------------------------------------------
const rayo = new THREE.Raycaster();
const puntero = new THREE.Vector2();

const infoNombre = document.getElementById('info-nombre');
const infoDetalle = document.getElementById('info-detalle');

let seleccionado = null;
const COLOR_SELECCION = 0xffffff;

function seleccionar(objeto) {
    // Devolver el objeto anterior a su color original
    if (seleccionado) {
        seleccionado.material.color.setHex(seleccionado.userData.colorOriginal);
        if (seleccionado.material.emissive) seleccionado.material.emissive.setHex(0x000000);
    }

    seleccionado = objeto;

    if (objeto) {
        // ACCIÓN VISIBLE: cambia de color, se resalta y muestra su nombre
        objeto.material.color.setHex(COLOR_SELECCION);
        if (objeto.material.emissive) objeto.material.emissive.setHex(0x444444);

        infoNombre.textContent = objeto.userData.nombre;
        infoDetalle.textContent = objeto.userData.detalle;

        // También se imprime en la consola del navegador
        console.log('Objeto seleccionado:', objeto.userData.nombre, objeto);
    } else {
        infoNombre.textContent = 'Ninguno';
        infoDetalle.textContent = 'Haz clic en un objeto para seleccionarlo';
    }
}

// Distinguimos un clic de un arrastre de OrbitControls
let xAbajo = 0, yAbajo = 0;

lienzo.addEventListener('pointerdown', function (e) {
    xAbajo = e.clientX;
    yAbajo = e.clientY;
});

lienzo.addEventListener('pointerup', function (e) {
    const movido = Math.abs(e.clientX - xAbajo) + Math.abs(e.clientY - yAbajo);
    if (movido > 5) return;     // fue un arrastre de cámara, no una selección

    // Coordenadas del mouse normalizadas al rango [-1, 1]
    puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
    puntero.y = -(e.clientY / window.innerHeight) * 2 + 1;

    rayo.setFromCamera(puntero, camara);
    const tocados = rayo.intersectObjects(seleccionables, false);

    seleccionar(tocados.length > 0 ? tocados[0].object : null);
});

// --------------------------------------------------------------------------
// Ajuste al cambiar el tamaño de la ventana
// --------------------------------------------------------------------------
window.addEventListener('resize', function () {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

// --------------------------------------------------------------------------
// 8. ANIMACIÓN CON requestAnimationFrame
// --------------------------------------------------------------------------
const reloj = new THREE.Clock();

function animar() {
    requestAnimationFrame(animar);

    const t = reloj.getElapsedTime();

    cubo.rotation.x += 0.006;
    cubo.rotation.y += 0.009;

    octaedro.rotation.y += 0.012;

    prisma.rotation.y += 0.008;

    esfera.position.y = Math.sin(t * 1.5) * 0.35;   // rebote suave

    if (modelo) {
        modelo.rotation.y += 0.01;
        modelo.position.y = 4.3 + Math.sin(t) * 0.25;
    }

    controles.update();                       // necesario por el damping
    renderizador.render(escena, camara);      // el renderer dibuja el cuadro
}

animar();