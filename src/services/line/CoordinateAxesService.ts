import {LineService} from "./LineService.ts";
import {Camera, type Quaternion, Scene, Vector3} from "three";

export class CoordinateAxesService extends LineService {
    private readonly uiCamera: Camera;
    private readonly mainCamera: Camera;
    length = 1.5;
    lineWidth = 3;


    constructor(scene: Scene, center: Vector3, mainCamera: Camera, uiCamera: Camera) {
        super(scene, center);

        this.mainCamera = mainCamera;
        this.uiCamera = uiCamera;
    }

    public drawCoordinateAxesConnected(centerPosition: Vector3, axesPosition: Vector3) {

        this.geometryView.position.copy(centerPosition);

        const start = axesPosition.clone().add(centerPosition);
        this.drawArrow(start, new Vector3(start.x + this.length, start.y, start.z), {color: 0xBA0000, linewidth: this.lineWidth}); // X - Red
        this.drawArrow(start, new Vector3(start.x, start.y + this.length, start.z), {color: 0x00C500, linewidth: this.lineWidth}); // Y - Green
        this.drawArrow(start, new Vector3(start.x, start.y, start.z + this.length), {color: 0x00FFFF, linewidth: this.lineWidth}); // Z - Blue
    }

    public drawCoordinateAxesStatic(axesPosition: Vector3) {
        // Ensure camera projection and world matrices are up-to-date. When loading happens
        // at different times (autoload vs UI file picker) camera matrices can be stale
        // which makes unproject() return different results. Update them explicitly here.
        try {
            // update projection matrix if camera type supports it (OrthographicCamera/PerspectiveCamera)
            // @ts-ignore
            if (typeof this.uiCamera.updateProjectionMatrix === 'function') {
                // @ts-ignore
                this.uiCamera.updateProjectionMatrix();
            }
            // make sure world matrix is current
            this.uiCamera.updateMatrixWorld(true);
        } catch (e) {
            // ignore - defensive, but avoid breaking drawing on unexpected camera implementations
            // (keep behavior predictable)
            // console.warn('CoordinateAxesService: failed to update camera matrices', e);
        }

        const centerPosition = axesPosition.unproject(this.uiCamera);
        this.drawCoordinateAxesConnected(centerPosition, new Vector3());
    }

    updateCoordinateAxes(parentQuaternion: Quaternion, coordinateBeginPosition: Vector3) {
        this.geometryView.quaternion.copy(parentQuaternion);

        if (coordinateBeginPosition) {
            const position = coordinateBeginPosition.clone();
            position.project(this.mainCamera);
            position.unproject(this.uiCamera);
            this.geometryView.position.copy(position);
        }
    }
}