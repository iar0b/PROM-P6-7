import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const envObjects = [];
const portalMenu = document.querySelector('#portal-menu');
const portalMenuClose = document.querySelector('#portal-menu-close');
const portalMenuButtons = [...document.querySelectorAll('#portal-menu button[data-world]')];

const worldConfigs = {
  bosque: {
    texture: './textures/grass.jpg',
    models: ['./models/tree.glb', './models/tronco.glb'],
    count: 6,
    background: 0x1f4628
  },
  lava: {
    texture: './textures/lava.jpg',
    models: ['./models/rock.glb', './models/volcano.glb'],
    count: 9,
    background: 0x7f1a0e
  },
  nieve: {
    texture: './textures/snow.jpg',
    model: './models/snowman.glb',
    count: 7,
    background: 0xdceaf4
  }
};

let portalModel;

// =========================
// ESCENA
// =========================
const scene = new THREE.Scene();

scene.background = new THREE.Color(0x222244);

// =========================
// CÁMARA
// =========================
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(6, 3, 8);

// =========================
// RENDERER
// =========================
const canvas = document.querySelector('#canvas-3d');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

// Sombras
renderer.shadowMap.enabled = true;

// =========================
// CONTROLES DE CÁMARA
// =========================
const controls = new OrbitControls(
  camera,
  renderer.domElement
);

// Movimiento suave
controls.enableDamping = true;

// Punto central de la cámara
controls.target.set(0, 1, 0);

// =========================
// ILUMINACIÓN
// =========================

// Luz ambiental
const ambientLight = new THREE.AmbientLight(
  0xffffff,
  0.8
);

scene.add(ambientLight);

// Luz principal
const directionalLight = new THREE.DirectionalLight(
  0xffffff,
  1
);

directionalLight.position.set(5, 10, 5);

directionalLight.castShadow = true;

scene.add(directionalLight);

// =========================
// TEXTURAS
// =========================
const groundTexture = textureLoader.load(
  './textures/sand.jpg'
);

groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;

groundTexture.repeat.set(8, 8);

// =========================
// SUELO
// =========================
const floorRadius = 10;
const floorGeometry = new THREE.CircleGeometry(
  floorRadius,
  64
);

const floorMaterial = new THREE.MeshStandardMaterial({
  map: groundTexture
});

const floor = new THREE.Mesh(
  floorGeometry,
  floorMaterial
);

floor.rotation.x = -Math.PI / 2;

floor.receiveShadow = true;

scene.add(floor);

// =========================
// CUBO
// =========================
const cubeGeometry = new THREE.BoxGeometry(
  1,
  1,
  1
);

const cubeMaterial = new THREE.MeshStandardMaterial({
  color: 0xff4444
});

const cube = new THREE.Mesh(
  cubeGeometry,
  cubeMaterial
);

cube.position.set(0, 0.5, 0);

cube.castShadow = true;

scene.add(cube);

// =========================
// ESFERA
// =========================
const sphereGeometry = new THREE.SphereGeometry(
  0.5,
  32,
  32
);

const sphereMaterial = new THREE.MeshStandardMaterial({
  color: 0x44aaff
});

const sphere = new THREE.Mesh(
  sphereGeometry,
  sphereMaterial
);

sphere.position.set(2, 0.5, 0);

sphere.castShadow = true;

scene.add(sphere);

// =========================
// CONO
// =========================
const coneGeometry = new THREE.ConeGeometry(
  0.6,
  1.5,
  32
);

const coneMaterial = new THREE.MeshStandardMaterial({
  color: 0x44ff88
});

const cone = new THREE.Mesh(
  coneGeometry,
  coneMaterial
);

cone.position.set(-2, 0.75, 0);

cone.castShadow = true;

scene.add(cone);

// =========================
// RESIZE
// =========================
window.addEventListener('resize', () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );

});

function showPortalMenu() {
  if (portalMenu) {
    portalMenu.classList.remove('hidden');
  }
}

function hidePortalMenu() {
  if (portalMenu) {
    portalMenu.classList.add('hidden');
  }
}

function clearEnvObjects() {
  envObjects.forEach((item) => {
    scene.remove(item);
  });
  envObjects.length = 0;
}

function setFloorTexture(path) {
  const texture = textureLoader.load(path);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  floor.material.map = texture;
  floor.material.needsUpdate = true;
}

function spawnEnvironment(type) {
  const config = worldConfigs[type];

  if (!config) {
    return;
  }

  const models = config.models || [config.model];
  const radius = floorRadius - 1.5;

  for (let i = 0; i < config.count; i += 1) {
    const modelPath = models[i % models.length];

    loader.load(
      modelPath,
      function (gltf) {
        const item = gltf.scene.clone(true);
        const angle = (i / config.count) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        item.position.set(x, 0, z);
        item.rotation.y = angle + Math.PI / 4;

        const scale = type === 'nieve' ? 0.6 : 0.8;
        const finalScale = modelPath.includes('volcano') ? scale * 10 : scale;
        item.scale.setScalar(finalScale);

        // Ajustar posición para que la base coincida con el suelo
        const box = new THREE.Box3().setFromObject(item);
        item.position.y = -box.min.y;

        item.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        scene.add(item);
        envObjects.push(item);
      },
      undefined,
      function (error) {
        console.error('Error cargando modelo de entorno:', error);
      }
    );
  }
}

function changeWorld(type) {
  const config = worldConfigs[type];

  if (!config) {
    return;
  }

  hidePortalMenu();
  clearEnvObjects();
  setFloorTexture(config.texture);
  scene.background = new THREE.Color(config.background);
  spawnEnvironment(type);
}

// =========================
// ANIMACIÓN
// =========================
function animate() {

  requestAnimationFrame(animate);

  const elapsed = performance.now() * 0.001;

  // Actualizar controles
  controls.update();

  // Rotaciones simples
  cube.rotation.y += 0.01;

  sphere.rotation.y += 0.01;

  cone.rotation.y += 0.01;

  if (portalModel) {
    portalModel.position.y = 3 + Math.sin(elapsed * 1.5) * 0.15;
  }

  renderer.render(scene, camera);

}

// =========================
// MODELO GLTF
// =========================

const loader = new GLTFLoader();

loader.load(

  './models/portal.glb',

  function (gltf) {

    const portal = gltf.scene;

    // Posición
    portal.position.set(0, 3, 0);

    // Escala
    portal.scale.set(1, 1, 1);

    portalModel = portal;

    // Sombras
    portal.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

      }

    });

    scene.add(portal);
  },

  undefined,

  function (error) {

    console.error('Error cargando GLTF:', error);

  }

);

canvas.addEventListener('pointerdown', (event) => {
  if (!portalModel) {
    return;
  }

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObject(portalModel, true);

  if (intersects.length > 0) {
    showPortalMenu();
  }
});

portalMenuButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const world = button.dataset.world;

    if (world) {
      changeWorld(world);
    }
  });
});

if (portalMenuClose) {
  portalMenuClose.addEventListener('click', hidePortalMenu);
}

if (portalMenu) {
  portalMenu.addEventListener('click', (event) => {
    if (event.target === portalMenu) {
      hidePortalMenu();
    }
  });
}

animate();