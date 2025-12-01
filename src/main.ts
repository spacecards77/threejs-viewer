import * as THREE from 'three';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); // Темно-серый фон

//const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const aspect = window.innerWidth / window.innerHeight;
const frustumSize = 5;
const camera = new THREE.OrthographicCamera(
    frustumSize * aspect / -2,  // left
    frustumSize * aspect / 2,   // right
    frustumSize / 2,            // top
    frustumSize / -2,           // bottom
    0.1,                        // near
    1000                        // far
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Объект (Куб)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = frustumSize * aspect / -2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = frustumSize / -2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    // Вращение куба
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

/*
function animate() {
    requestAnimationFrame(animate);

    // Вращение куба
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();*/
