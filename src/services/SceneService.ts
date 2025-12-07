import * as THREE from 'three';
import {OrthographicCamera, Vector3} from 'three';
import {DrawService} from "./DrawService.ts";
import type {IGeometry} from "../model/IGeometry.ts";
import {ModelViewer} from "../controls/ModelViewer.ts";
import {config} from "../config.ts";
import {AssertUtils} from "../utils/assert/AssertUtils.ts";
import type {GeometryView} from "../view/GeometryView.ts";
import {RenderService} from './RenderService.ts';

export class SceneService {
    public readonly drawService: DrawService;
    readonly mainScene: THREE.Scene;
    readonly mainCamera: OrthographicCamera;
    readonly uiScene: THREE.Scene;
    readonly uiCamera: OrthographicCamera;

    private rendererService!: RenderService;
    private frustumSize = 40;

    canvasContainer!: HTMLElement | null;
    width: number = 0;
    height: number = 0;
    geometryView: GeometryView | null = null;

    constructor() {
        this.updateSizeForContainer();

        this.mainScene = this.createMainScene();
        this.mainCamera = this.createOrthographicCamera();

        this.uiScene = this.createUiScene();
        this.uiCamera = this.createOrthographicCamera();

        this.drawService = this.createDrawService();

        this.rendererService = new RenderService(this);

        this.setupEventListeners();
    }

    public updateSceneForGeometry(geometry: IGeometry) {
        this.geometryView = geometry.GeometryView;
        const center = geometry.getCenter();

        this.mainCamera.position.set(center.x, center.y + 50, center.z - 10);
        this.mainCamera.up = new Vector3(0, 0, -1);
        this.mainCamera.lookAt(center);

        if (geometry?.GeometryView) {
            new ModelViewer(geometry.GeometryView, this.rendererService.domElement, this.mainCamera);
        }
    }

    private updateSizeForContainer(): void {
        this.canvasContainer = document.getElementById('app');
        AssertUtils.IsNotNull(this.canvasContainer, 'SceneService: element with id="app" not found.');

        this.width = this.canvasContainer?.clientWidth ?? 0;
        this.height = this.canvasContainer?.clientHeight ?? 0;
    }

    private createMainScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);

        if (config.debugMode) {
            const axesHelper = new THREE.AxesHelper(5);
            scene.add(axesHelper);
        }

        return scene;
    }

    private createUiScene(): THREE.Scene {
        return new THREE.Scene();
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

    private setupEventListeners(): void {
        window.addEventListener('resize', () => {
            this.updateSizeForContainer();

            const aspect = this.width / this.height;
            this.mainCamera.left = this.frustumSize * aspect / -2;
            this.mainCamera.right = this.frustumSize * aspect / 2;
            this.mainCamera.top = this.frustumSize / 2;
            this.mainCamera.bottom = this.frustumSize / -2;
            this.mainCamera.updateProjectionMatrix();

            this.rendererService.setSize(this.width, this.height);
        });
    }

    createDrawService() {
        return new DrawService(this.mainScene, this.uiScene, this.mainCamera, this.uiCamera);
    }
}
