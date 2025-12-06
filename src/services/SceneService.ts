import * as THREE from 'three';
import {OrthographicCamera} from 'three';
import {DrawService} from "./DrawService.ts";
import {LineService} from "./LineService.ts";
import type {IGeometry} from "../entities/IGeometry.ts";
import {ModelViewer} from "../controls/ModelViewer.ts";
import {config} from "../config.ts";
import {AssertUtils} from "../utils/assert/AssertUtils.ts";

export class SceneService {
    public readonly drawService: DrawService;
    private readonly mainScene!: THREE.Scene;
    private readonly mainCamera!: OrthographicCamera;

    private renderer!: THREE.WebGLRenderer;
    private frustumSize = 40;

    private canvasContainer: HTMLElement | null = null;
    private width: number = 0;
    private height: number = 0;

    constructor() {
        this.updateSizeForContainer();

        this.mainScene = this.createScene();
        this.mainCamera = this.createOrthographicCamera();
        this.renderer = this.createRenderer();

        this.drawService = this.createDrawService();
        this.setupEventListeners();

        const animate = () => {
            requestAnimationFrame(animate);

            this.render();
        };

        animate();
    }

    public updateSceneForGeometry(geometry: IGeometry) {
        let center = geometry.getCenter();

        this.mainCamera.position.set(center.x, center.y + 50, center.z - 10);
        this.mainCamera.up = new THREE.Vector3(0, 0, -1);
        this.mainCamera.lookAt(center);

        if (geometry?.Model) {
            new ModelViewer(geometry.Model, this.renderer.domElement, this.mainCamera);
        }
    }

    private updateSizeForContainer(): void {
        this.canvasContainer = document.getElementById('app');
        AssertUtils.IsNotNull(this.canvasContainer, 'SceneService: element with id="app" not found.');

        this.width = this.canvasContainer?.clientWidth ?? 0;
        this.height = this.canvasContainer?.clientHeight ?? 0;
    }

    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        if (config.debugMode) {
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);
        }

        return scene;
    }

    private createOrthographicCamera(): OrthographicCamera {
        const aspect = this.width / this.height;

        return new OrthographicCamera(
            this.frustumSize * aspect / -2, // left
            this.frustumSize * aspect / 2,  // right
            this.frustumSize / 2,           // top
            this.frustumSize / -2,          // bottom
            0.1,                       // near
            1000                        // far
        );
    }

    /*
      //Поддержка широкоформатных экранов с высоким DPI
      private updateRendererPixelRatioAndSize(): void {
        if (!this.renderer) return;
        // cap devicePixelRatio for performance (2 is a reasonable default cap)
        const capped = Math.min(window.devicePixelRatio || 1, 2);
        this.renderer.setPixelRatio(capped);
        //this.renderer.setSize(this.width, this.height);
    }*/

    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({antialias: true});
        renderer.setSize(this.width, this.height);
        this.canvasContainer!.appendChild(renderer.domElement);
        return renderer;
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.updateSizeForContainer();

            const aspect = this.width / this.height;
            this.mainCamera.left = this.frustumSize * aspect / -2;
            this.mainCamera.right = this.frustumSize * aspect / 2;
            this.mainCamera.top = this.frustumSize / 2;
            this.mainCamera.bottom = this.frustumSize / -2;
            this.mainCamera.updateProjectionMatrix();

            this.renderer.setSize(this.width, this.height);
        });
    }

    private render() {
        this.renderer.render(this.mainScene, this.mainCamera);
    }

    createDrawService() {
        return new DrawService(new LineService(this.mainScene));
    }
}
