import * as THREE from 'three';
import {OrthographicCamera} from 'three';
import {DrawService} from "./DrawService.ts";
import {LineService} from "./LineService.ts";
import {TrackballControls} from 'three/addons/controls/TrackballControls.js';
import type {IGeometry} from "../entities/IGeometry.ts";

export class SceneService {
    private readonly scene!: THREE.Scene;
    private readonly camera!: THREE.OrthographicCamera;
    private readonly cameraControls!: TrackballControls;

    private renderer!: THREE.WebGLRenderer;
    private frustumSize = 5;

    private canvasContainer: HTMLElement | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor() {
        this.updateSizeForContainer();

        if (!this.canvasContainer) return;

        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.cameraControls = this.createCameraControls(this.camera);
        this.updateSceneForGeometry(new StartGeometry());

        this.renderer = this.createRenderer();

        this.setupEventListeners();
        this.startRendering();
    }

    public updateSceneForGeometry(geometry: IGeometry) {
        this.camera.position.set(30, -50, 80);

        this.cameraControls.target = geometry.getCenter();
        //this.cameraControls.minTargetRadius = 50;
        this.cameraControls.update();
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
        scene.background = new THREE.Color(0x000000); // Темно-серый фон
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
        const cameraControls = new TrackballControls(camera, this.canvasContainer);
        cameraControls.target.set(15, 20, 10);

        return cameraControls;
    }

    private updateRendererPixelRatioAndSize(): void {
        if (!this.renderer) return;
        // cap devicePixelRatio for performance (2 is a reasonable default cap)
        const capped = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(capped);
        this.renderer.setSize(this.width, this.height);
    }

    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer = renderer;
        this.updateRendererPixelRatioAndSize();
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

            this.updateRendererPixelRatioAndSize();
        });
    }

    private renderAll = () => {
        this.cameraControls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private startRendering(): void {
        this.renderer.setAnimationLoop(this.renderAll);
    }

    getDrawService() {
        return new DrawService(new LineService(this.scene));
    }
}

class StartGeometry implements IGeometry {
    getCenter(): THREE.Vector3 {
        return new THREE.Vector3(0, 0, 0);
    }
}