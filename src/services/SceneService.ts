import * as THREE from 'three';

export class SceneService {
    private scene: THREE.Scene;
    private camera: THREE.OrthographicCamera;
    private renderer: THREE.WebGLRenderer;
    private cube: THREE.Mesh;
    private frustumSize = 5;

    constructor() {
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.cube = this.createCube();

        this.setupEventListeners();
        this.startAnimation();
    }

    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020); // Темно-серый фон
        return scene;
    }

    private createCamera(): THREE.OrthographicCamera {
        const aspect = window.innerWidth / window.innerHeight;
        const camera = new THREE.OrthographicCamera(
            this.frustumSize * aspect / -2,  // left
            this.frustumSize * aspect / 2,   // right
            this.frustumSize / 2,            // top
            this.frustumSize / -2,           // bottom
            0.1,                             // near
            1000                             // far
        );
        camera.position.z = 5;
        return camera;
    }

    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    private createCube(): THREE.Mesh {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const cube = new THREE.Mesh(geometry, material);
        this.scene.add(cube);
        return cube;
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            const aspect = window.innerWidth / window.innerHeight;
            this.camera.left = this.frustumSize * aspect / -2;
            this.camera.right = this.frustumSize * aspect / 2;
            this.camera.top = this.frustumSize / 2;
            this.camera.bottom = this.frustumSize / -2;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    private animate = () => {
        // Вращение куба
        this.cube.rotation.x += 0.01;
        this.cube.rotation.y += 0.01;

        this.renderer.render(this.scene, this.camera);
    }

    private startAnimation(): void {
        this.renderer.setAnimationLoop(this.animate);
    }

    public getScene(): THREE.Scene {
        return this.scene;
    }

    public getCamera(): THREE.OrthographicCamera {
        return this.camera;
    }

    public getRenderer(): THREE.WebGLRenderer {
        return this.renderer;
    }
}

