import * as THREE from 'three';
import { Vector3 } from 'three';
import type {SceneService} from "./SceneService.ts";
import {AssertUtils} from "../utils/assert/AssertUtils.ts";

export class RenderService {
    private renderer!: THREE.WebGLRenderer;
    private sceneService: SceneService;

    constructor(sceneService: SceneService
    ) {
        this.sceneService = sceneService;

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(this.sceneService.width, this.sceneService.height);

        AssertUtils.IsNotNull(this.sceneService.canvasContainer, 'RendererService: canvasContainer is null.');
        this.sceneService.canvasContainer?.appendChild(this.renderer.domElement);

        this.prepareAndStartRender();
    }

    public get domElement(): HTMLCanvasElement {
        return this.renderer.domElement;
    }

    public setSize(width: number, height: number): void {
        this.renderer.setSize(width, height);
    }

    private prepareAndStartRender(): void {
        this.renderer.autoClear = false;
        const coordinateBeginPosition = new Vector3();

        const animate = () => {
            requestAnimationFrame(animate);

            this.renderer.clear();

            this.renderMain();

            this.renderer.clearDepth();

            this.renderUi(coordinateBeginPosition);
        };

        animate();
    }

    private renderMain() {
        this.renderer.render(this.sceneService.mainScene, this.sceneService.mainCamera);
    }

    private renderUi(coordinateBeginPosition: Vector3) {
        this.sceneService.uiCamera.position.copy(this.sceneService.mainCamera.position);
        this.sceneService.uiCamera.quaternion.copy(this.sceneService.mainCamera.quaternion);

        const geometryView = this.sceneService.geometryView;
        if (geometryView) {
            geometryView.CoordinateBegin.getWorldPosition(coordinateBeginPosition);
            this.sceneService.drawService.renderCoordinateAxes(coordinateBeginPosition, geometryView.quaternion);
        }

        this.renderer.render(this.sceneService.uiScene, this.sceneService.uiCamera);
    }
}
