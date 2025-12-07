import {Group, Object3D, type Quaternion, type Scene, type Vector3} from "three";
import {config} from "../config.ts";

export class GeometryView {
    public readonly Parent: Group;
    public readonly CoordinateBegin: Object3D;

    get position(): Vector3 {
        return this.Parent.position;
    }

    get quaternion(): Quaternion {
        return this.Parent.quaternion;
    }

    constructor(scene: Scene, center: Vector3) {
        this.Parent = new Group();
        scene.add(this.Parent);
        if (config.debugMode)
            this.Parent.name = 'GroupParent';

        this.CoordinateBegin = new Object3D();
        this.CoordinateBegin.position.copy(center.clone().multiplyScalar(-1));
        this.CoordinateBegin.visible = false;
        if (config.debugMode)
            this.CoordinateBegin.name = "CoordinateBegin";
        this.Parent.add(this.CoordinateBegin);
    }

    public clear() {
        this.Parent.remove(this.CoordinateBegin);
    }

    add(object: Object3D) {
        this.Parent.add(object);
    }

    remove(object: Object3D) {
        this.Parent.remove(object);
    }
}