import * as THREE from 'three';

export class LineService {
    private lines: THREE.Line[] = [];
    private readonly scene: THREE.Scene;
    private readonly linesParent: THREE.Group;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.linesParent = new THREE.Group();
        this.linesParent.name = 'LinesParent';
        this.scene.add(this.linesParent);
    }

    drawLine(start: THREE.Vector3, end: THREE.Vector3, options?: { color?: THREE.Color | number }): THREE.Line {
        const material = new THREE.LineBasicMaterial({ color: options?.color ?? 0x0000ff });
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(geometry, material);

        this.linesParent.add(line);
        this.lines.push(line);
        return line;
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
    }
}
