import * as THREE from 'three';
import {OrthographicCamera, Vector3} from 'three';
import {DrawService} from "./DrawService.ts";
import {LineService} from "./LineService.ts";
import { CustomTrackballControls } from '../controls/CustomTrackballControls.ts';

export class SceneService {
    private readonly scene!: THREE.Scene;
    private readonly camera!: THREE.OrthographicCamera;
    private readonly cameraControls!: CustomTrackballControls;

    private renderer!: THREE.WebGLRenderer;
    private frustumSize = 40;

    private canvasContainer: HTMLElement | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor() {
        this.updateSizeForContainer();

        if (!this.canvasContainer) return;

        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.cameraControls = this.createCameraControls(this.camera);
        this.updateSceneForGeometry();


        this.setupEventListeners();

        const animate = () => {
            requestAnimationFrame(animate);

            this.cameraControls.update();

            this.render();
        };

        animate();
    }

    public updateSceneForGeometry(/*geometry: IGeometry*/) {
        let center = new Vector3();

        this.camera.position.set(center.x, -50, center.z + 20);

        this.cameraControls.target = center;
    }

    private updateSizeForContainer(): void {
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
        scene.background = new THREE.Color(0x000000);
        const axesHelper = new THREE.AxesHelper(5);
        scene.add(axesHelper);

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

        return camera;
    }

    private createCameraControls(camera: OrthographicCamera) {
        const cameraControls = new CustomTrackballControls(camera, this.renderer.domElement);

        cameraControls.staticMoving = true;

        cameraControls.keys = ['ControlLeft', '', ''];
        cameraControls.mouseButtons = {
            MIDDLE: THREE.MOUSE.PAN,
            LEFT: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.ROTATE
        };
        cameraControls.panSpeed = 3;

        return cameraControls;
    }

    /*private updateRendererPixelRatioAndSize(): void {
        if (!this.renderer) return;
        // cap devicePixelRatio for performance (2 is a reasonable default cap)
        const capped = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(capped);
        this.renderer.setSize(this.width, this.height);
    }*/

    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(this.width, this.height);
        this.canvasContainer!.appendChild(renderer.domElement);
        return renderer;
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            // refresh stored container and sizes
            this.updateSizeForContainer();

            const aspect = this.width / this.height;
            this.camera.left = this.frustumSize * aspect / -2;
            this.camera.right = this.frustumSize * aspect / 2;
            this.camera.top = this.frustumSize / 2;
            this.camera.bottom = this.frustumSize / -2;
            this.camera.updateProjectionMatrix();
            this.cameraControls.handleResize();

            this.renderer.setSize(this.width, this.height);
        });
    }

    private render() {
        this.renderer.render(this.scene, this.camera);
    }

    getDrawService() {
        return new DrawService(new LineService(this.scene));
    }
}
