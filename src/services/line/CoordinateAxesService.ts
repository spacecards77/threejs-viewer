import {LineService} from "./LineService.ts";
import {Camera, type Quaternion, Scene, Vector3} from "three";

export class CoordinateAxesService extends LineService {
    private readonly uiCamera: Camera;
    private readonly mainCamera: Camera;

    constructor(scene: Scene, center: Vector3, mainCamera: Camera, uiCamera: Camera) {
        super(scene, center);

        this.mainCamera = mainCamera;
        this.uiCamera = uiCamera;
    }

    public drawCoordinateAxes(centerPosition: Vector3, axesPosition: Vector3) {
        const length = 1.5;
        const lineWidth = 3;

        this.geometryView.position.copy(centerPosition);

        const start = axesPosition.clone().add(centerPosition);
        this.drawArrow(start, new Vector3(start.x + length, start.y, start.z), {color: 0xBA0000, linewidth: lineWidth}); // X - Red
        this.drawArrow(start, new Vector3(start.x, start.y + length, start.z), {color: 0x00C500, linewidth: lineWidth}); // Y - Green
        this.drawArrow(start, new Vector3(start.x, start.y, start.z + length), {color: 0x00FFFF, linewidth: lineWidth}); // Z - Blue
    }

    renderCoordinateAxes(coordinateBeginPosition: Vector3, parentQuaternion: Quaternion) {
        const position = coordinateBeginPosition.clone();
        position.project(this.mainCamera);
        position.unproject(this.uiCamera);
        this.geometryView.position.copy(position);
        this.geometryView.quaternion.copy(parentQuaternion);
    }
}