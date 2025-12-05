import * as THREE from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineMaterial} from "three/addons/lines/LineMaterial.js";
import {LineGeometry} from "three/addons/lines/LineGeometry.js";
import {Color} from "three";

export class LineService {
    private lines: Line2[] = [];
    private cones: THREE.Mesh[] = [];
    private readonly scene: THREE.Scene;
    private linesParent!: THREE.Group;
    private coneRadius: number = 0.08;
    private coneHeight: number = 0.3;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.createLinesParent();
    }

    drawLine(start: THREE.Vector3, end: THREE.Vector3,
             options?: { color?: THREE.Color | number, linewidth?: number }
    ) {
        //OPTIMIZE: Reuse materials and geometries where possible
        const material = new LineMaterial({
            linewidth: options?.linewidth || 2,
            vertexColors: true,
        });
        // avoid mutating caller-provided vectors by cloning before subtracting
        const p1 = start.clone().sub(this.linesParent.position);
        const p2 = end.clone().sub(this.linesParent.position);
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

    drawArrow(start: THREE.Vector3, end: THREE.Vector3,
              options?: { color?: THREE.Color | number, linewidth?: number }
    ) {
        // Calculate total length and direction
        const direction = new THREE.Vector3().subVectors(end, start);
        //const totalLength = direction.length();
        direction.normalize();

        // Calculate the new end point for the line (shortened by cone height)
        //const lineEnd = start.clone().add(direction.clone().multiplyScalar(totalLength - this.coneHeight));
        const lineEnd = end;

        // Draw the line from start to lineEnd
        this.drawLine(start, lineEnd, options);

        // Create cone geometry and material
        const coneGeometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, 16);
        const col = new Color(options?.color ?? 0x0000ff);
        const coneMaterial = new THREE.MeshBasicMaterial({ color: col });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);

        // Position the cone at the end point
        // Cone's default orientation is pointing up (Y+), so we need to align it with direction
        const conePosition = end.clone().sub(this.linesParent.position);
        cone.position.copy(conePosition);

        // Align cone with the direction vector
        // Create a quaternion to rotate from default up (0,1,0) to our direction
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
        cone.setRotationFromQuaternion(quaternion);

        cone.name = 'ArrowCone' + '(' + end.x.toFixed(2) + ','
            + end.y.toFixed(2)
            + ',' + end.z.toFixed(2) + ')';

        this.linesParent.add(cone);
        this.cones.push(cone);
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

        for (const cone of this.cones) {
            cone.geometry.dispose();
            if (Array.isArray(cone.material)) {
                cone.material.forEach(m => m.dispose());
            } else {
                cone.material.dispose();
            }
            this.linesParent.remove(cone);
        }
        this.cones = [];

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
