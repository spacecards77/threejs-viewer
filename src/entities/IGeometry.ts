import * as THREE from 'three';
import {Object3D} from 'three';

export interface IGeometry {
    Model: Object3D | null;
    getCenter(): THREE.Vector3;
}

