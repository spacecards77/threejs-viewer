import * as THREE from 'three';

export class SceneService {
    private scene!: THREE.Scene;
    private camera!: THREE.OrthographicCamera;
    private renderer!: THREE.WebGLRenderer;
    private cube!: THREE.Mesh;
    private frustumSize = 5;

    private canvasContainer: HTMLElement | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor() {
        this.updateSizeFromContainer();

        if (!this.canvasContainer) return;

        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.cube = this.createCube();

        this.setupEventListeners();
        this.startAnimation();
    }

    private updateSizeFromContainer(): void {
        this.canvasContainer = document.getElementById('app');
        if (!this.canvasContainer) {
            console.error('SceneService: element with id="app" not found.');
            return;
        }
        this.width = this.canvasContainer.clientWidth;
        this.height = this.canvasContainer.clientHeight;
    }

    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020); // Темно-серый фон
        return scene;
    }

    private createCamera(): THREE.OrthographicCamera {
        const aspect = this.width / this.height;

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

    private updateRendererPixelRatioAndSize(): void {
        if (!this.renderer) return;
        // cap devicePixelRatio for performance (2 is a reasonable default cap)
        const capped = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(capped);
        this.renderer.setSize(this.width, this.height);
    }

    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer = renderer;
        this.updateRendererPixelRatioAndSize();
        this.canvasContainer!.appendChild(renderer.domElement);
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
            // refresh stored container and sizes
            this.updateSizeFromContainer();

            const aspect = this.width / this.height;
            this.camera.left = this.frustumSize * aspect / -2;
            this.camera.right = this.frustumSize * aspect / 2;
            this.camera.top = this.frustumSize / 2;
            this.camera.bottom = this.frustumSize / -2;
            this.camera.updateProjectionMatrix();

            this.updateRendererPixelRatioAndSize();
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
