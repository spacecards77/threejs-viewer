import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineMaterial} from "three/addons/lines/LineMaterial.js";
import {LineGeometry} from "three/addons/lines/LineGeometry.js";
import {Color} from "three";

export class LineService {
    private lines: Line2[] = [];
    private readonly scene: THREE.Scene;
    private linesParent!: THREE.Group;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.createLinesParent();
    }

    drawLine(start: THREE.Vector3, end: THREE.Vector3, center: THREE.Vector3,
             options?: { color?: THREE.Color | number, linewidth?: number }
    ) {
        //OPTIMIZE: Reuse materials and geometries where possible
        const material = new LineMaterial({
            linewidth: options?.linewidth || 2,
            vertexColors: true,
        });
        // avoid mutating caller-provided vectors by cloning before subtracting
        const p1 = start.clone().sub(center);
        const p2 = end.clone().sub(center);
        const geometry = new LineGeometry().setFromPoints([p1, p2]);
        // LineGeometry.setColors expects an array of RGB float values per vertex
        // (r, g, b) for each vertex. For two vertices we must supply 6 floats.
        const col = new Color(options?.color ?? 0x0000ff);
        geometry.setColors([col.r, col.g, col.b, col.r, col.g, col.b]);
        const line = new Line2(geometry, material);
        const lineCenter = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        line.name = 'Line' + '(' + lineCenter.x.toFixed(2) + ','
            + lineCenter.y.toFixed(2)
            + ',' + lineCenter.z.toFixed(2) + ')';

        this.linesParent.add(line);
        this.lines.push(line);
    }

    clearAllLines(): void {
        for (const line of this.lines) {
            line.geometry.dispose();
            if (Array.isArray(line.material)) {
                line.material.forEach(m => m.dispose());
            } else {
                line.material.dispose();
            }
            this.linesParent.remove(line);
        }
        this.lines = [];
        this.createLinesParent();
    }

    private createLinesParent() {
        if (this.linesParent)
            this.scene.remove(this.linesParent);

        this.linesParent = new THREE.Group();
        this.linesParent.name = 'LinesParent';
        this.scene.add(this.linesParent);
    }

    setLineParentPosition(position: THREE.Vector3) {
        this.linesParent.position.copy(position);
    }

    getLineParent() {
        return this.linesParent;
    }
}
