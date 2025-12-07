import * as THREE from 'three';
import {Color, type Vector3} from 'three';
import {Line2} from 'three/addons/lines/Line2.js';
import {LineMaterial} from "three/addons/lines/LineMaterial.js";
import {LineGeometry} from "three/addons/lines/LineGeometry.js";
import {config} from "../../config.ts";
import {GeometryView} from "../../view/GeometryView.ts";

export class LineService {
    private lines: Line2[] = [];
    private dots: THREE.Points[] = [];
    private cones: THREE.Mesh[] = [];
    private readonly scene: THREE.Scene;
    public readonly geometryView: GeometryView;
    private coneRadius: number = 0.15;
    private coneHeight: number = 0.5;

    constructor(scene: THREE.Scene, center: Vector3) {
        this.scene = scene;
        this.geometryView = new GeometryView(this.scene, center);
    }

    public drawSquare(position: THREE.Vector3,
                      options: { color?: THREE.Color | number, size: number }
    ) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute([
                position.x - this.geometryView.position.x,
                position.y - this.geometryView.position.y,
                position.z - this.geometryView.position.z],
            3));

        const material = new THREE.PointsMaterial({
            color: options.color || 0xff0000,
            size: options.size,
            sizeAttenuation: false, // ВАЖНО: false отключает уменьшение от дистанции
            // --- ВАЖНЫЕ НАСТРОЙКИ ДЛЯ ОТРИСОВКИ ПОВЕРХ ВСЕГО ---
            depthTest: false,   // Отключаем проверку глубины (рисуем сквозь стены)
            depthWrite: false,  // Не записываем этот объект в буфер глубины (хорошая практика для UI)
            transparent: true   // Обычно нужно, если используются текстуры, но для цветного квадрата тоже не помешает :)
        });

        const dot = new THREE.Points(geometry, material);

        // чтобы объект рисовался после всех остальных объектов сцены
        dot.renderOrder = 999;

        // Если не отключить frustumCulled, объект может исчезнуть,
        // когда его "настоящий" центр выйдет за пределы камеры,
        // хотя сам квадрат все еще должен быть виден.
        dot.frustumCulled = false;

        this.geometryView.add(dot);
        this.dots.push(dot);
    }

    public drawLine(start: THREE.Vector3, end: THREE.Vector3,
                    options?: { color?: THREE.Color | number, linewidth?: number }
    ) {
        //OPTIMIZE: Reuse materials and geometries where possible
        const material = new LineMaterial({
            linewidth: options?.linewidth || 2,
            vertexColors: true,
        });
        // avoid mutating caller-provided vectors by cloning before subtracting
        const p1 = start.clone().sub(this.geometryView.position);
        const p2 = end.clone().sub(this.geometryView.position);
        const geometry = new LineGeometry().setFromPoints([p1, p2]);
        // LineGeometry.setColors expects an array of RGB float values per vertex
        // (r, g, b) for each vertex. For two vertices we must supply 6 floats.
        const col = new Color(options?.color ?? 0x0000ff);
        geometry.setColors([col.r, col.g, col.b, col.r, col.g, col.b]);
        const line = new Line2(geometry, material);
        const lineCenter = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        if (config.debugMode)
            line.name = 'Line' + '(' + lineCenter.x.toFixed(2) + ','
                + lineCenter.y.toFixed(2)
                + ',' + lineCenter.z.toFixed(2) + ')';

        this.geometryView.add(line);
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
        // Draw the line from start to lineEnd
        this.drawLine(start, end, options);

        // Create cone geometry and material
        const coneGeometry = new THREE.ConeGeometry(this.coneRadius, this.coneHeight, 16);
        const col = new Color(options?.color ?? 0x0000ff);
        const coneMaterial = new THREE.MeshBasicMaterial({color: col});
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);

        // Position the cone at the end point
        // Cone's default orientation is pointing up (Y+), so we need to align it with direction
        const conePosition = end.clone().sub(this.geometryView.position);
        cone.position.copy(conePosition);

        // Align cone with the direction vector
        // Create a quaternion to rotate from default up (0,1,0) to our direction
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
        cone.setRotationFromQuaternion(quaternion);

        if (config.debugMode)
            cone.name = 'ArrowCone' + '(' + end.x.toFixed(2) + ','
                + end.y.toFixed(2)
                + ',' + end.z.toFixed(2) + ')';

        this.geometryView.add(cone);
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
            this.geometryView.remove(line);
        }
        this.lines = [];

        for (const cone of this.cones) {
            cone.geometry.dispose();
            if (Array.isArray(cone.material)) {
                cone.material.forEach(m => m.dispose());
            } else {
                cone.material.dispose();
            }
            this.geometryView.remove(cone);
        }
        this.cones = [];

        for (const dot of this.dots) {
            dot.geometry.dispose();
            if (Array.isArray(dot.material)) {
                dot.material.forEach(m => m.dispose());
            } else {
                dot.material.dispose();
            }
            this.geometryView.remove(dot);
        }
        this.dots = [];
    }
}
