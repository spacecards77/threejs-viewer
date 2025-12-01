import * as THREE from 'three';

export class LineService {
    private _lines: THREE.Line[] = [];
    private readonly _scene: THREE.Scene;

    constructor(scene: THREE.Scene) {
        this._scene = scene;
    }

    drawLine(start: THREE.Vector3, end: THREE.Vector3, options?: { color?: THREE.Color | number }): THREE.Line {
        const material = new THREE.LineBasicMaterial({ color: options?.color ?? 0x0000ff });
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const line = new THREE.Line(geometry, material);

        this._scene.add(line);
        this._lines.push(line);
        return line;
    }

    clearAllLines(): void {
        for (const line of this._lines) {
            line.geometry.dispose();
            if (Array.isArray(line.material)) {
                line.material.forEach(m => m.dispose());
            } else {
                line.material.dispose();
            }
            this._scene.remove(line);
        }
        this._lines = [];
    }
}
