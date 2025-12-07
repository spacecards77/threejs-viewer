import * as THREE from 'three';
import {Member} from './Member';
import {Node} from './Node';
import type {IGeometry} from './IGeometry';
import type {Vector3} from "three";
import type {GeometryView} from "../view/GeometryView.ts";

export interface GeometryJSON {
    //ARCHITECTURE: use type
    Members: any[];
    Nodes: any[];
}

export class Geometry implements IGeometry {
    public readonly idToNode: Map<number, Node>;
    public readonly members: Member[];
    public readonly nodes: Node[];
    private center!: Vector3;
    GeometryView: GeometryView | null = null;

    constructor(members: Member[], nodes: Node[]) {
        this.members = members;
        this.nodes = nodes;
        this.idToNode = new Map<number, Node>(nodes.map(n => [n.id, n]));

        this.calculateCenter();
    }

    static fromJSON(json: GeometryJSON): Geometry {
        const nodes = (json.Nodes || []).map(n => Node.fromJSON(n));
        const members = (json.Members || []).map(m => Member.fromJSON(m));
        return new Geometry(members, nodes);
    }

    public getCenter(): THREE.Vector3 {
        return this.center;
    }

    private calculateCenter() {
        const minX = Math.min(...this.nodes.map(n => n.x));
        const maxX = Math.max(...this.nodes.map(n => n.x));
        const minY = Math.min(...this.nodes.map(n => n.y));
        const maxY = Math.max(...this.nodes.map(n => n.y));
        const minZ = Math.min(...this.nodes.map(n => n.z));
        const maxZ = Math.max(...this.nodes.map(n => n.z));

        this.center = new THREE.Vector3(
            (minX + maxX) / 2,
            (minY + maxY) / 2,
            (minZ + maxZ) / 2,
        );
    }
}
