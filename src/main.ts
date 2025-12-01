import * as THREE from 'three';

// 1. Сцена
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); // Темно-серый фон

// 2. Камера (угол обзора, пропорции, ближняя и дальняя границы)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. Рендерер
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Объект (Куб)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. Обработка изменения размера окна
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 6. Анимационный цикл
function animate() {
    requestAnimationFrame(animate);

    // Вращение куба
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();