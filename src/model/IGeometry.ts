import * as THREE from 'three';
import type {GeometryView} from "../view/GeometryView.ts";

export interface IGeometry {
    GeometryView: GeometryView | null;
    getCenter(): THREE.Vector3;
}

