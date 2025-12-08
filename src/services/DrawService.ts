import * as THREE from 'three';
import {type Camera, Quaternion, type Scene, Vector3} from 'three';
import {Construction} from '../model';
import {LineService} from './line/LineService.ts';
import {config} from "../config.ts";
import {CoordinateAxesService} from "./line/CoordinateAxesService.ts";

export class DrawService {
    private readonly mainScene: Scene;
    private readonly uiScene: Scene;
    private readonly mainCamera: Camera;
    private readonly uiCamera: Camera;
    private mainLineService!: LineService;
    private connectedAxesService!: CoordinateAxesService;
    private staticAxesService!: CoordinateAxesService;

    constructor(mainScene: Scene, uiScene: Scene, mainCamera: THREE.Camera, uiCamera: THREE.Camera) {
        this.mainScene = mainScene;
        this.uiScene = uiScene;
        this.mainCamera = mainCamera;
        this.uiCamera = uiCamera;
    }

    drawConstruction(construction: Construction) {
        const center = construction.geometry.getCenter();
        this.createServices(center);

        this.mainLineService.clearAllLines();

        this.mainLineService.geometryView.position.copy(center);

        const geometry = construction.geometry;
        for (const member of geometry.members) {
            const n1 = geometry.idToNode.get(member.node1Id);
            const n2 = geometry.idToNode.get(member.node2Id);
            if (!n1 || !n2) {
                if (!n1) console.warn(`Invalid Node1Id for member ${member.id}: Node1Id=${member.node1Id}`);
                if (!n2) console.warn(`Invalid Node2Id for member ${member.id}: Node2Id=${member.node2Id}`);
                continue;
            }
            const p1 = new THREE.Vector3(n1.x, n1.y, n1.z);
            const p2 = new THREE.Vector3(n2.x, n2.y, n2.z);
            this.mainLineService.drawLine(p1, p2, { color: 0x99CCCC});
        }

        for (const node of geometry.nodes) {
            const position = new THREE.Vector3(node.x, node.y, node.z);
            this.mainLineService.drawSquare(position, { color: 0xFF0000, size: 3 });
        }

        this.connectedAxesService.drawCoordinateAxesConnected(center, new Vector3());
        this.staticAxesService.drawCoordinateAxesStatic(new Vector3(
            -0.7192165152812904,
            -0.6836717450206091,
            -0.9314959336646511,
        ));

        if (config.debugMode)
            console.log(`Model displayed: ${geometry.members.length} members drawn`);

        construction.geometry.GeometryView = this.mainLineService.geometryView;
    }

    public updateConnectedCoordinateAxes(coordinateBeginPosition: Vector3, parentQuaternion: Quaternion) {
        this.connectedAxesService.updateCoordinateAxes(parentQuaternion, coordinateBeginPosition);
    }

    public updateStaticCoordinateAxes(parentQuaternion: Quaternion) {
        // @ts-ignore
        // Обновляем только поворот, позиция статичных осей не меняется
        this.staticAxesService.updateCoordinateAxes(parentQuaternion);
    }

    private createServices(center: Vector3) {
        if (this.mainLineService) {
            this.mainLineService.clearAllLines();
        }
        this.mainLineService = new LineService(this.mainScene, center);

        if (this.connectedAxesService) {
            this.connectedAxesService.clearAllLines();
        }
        this.connectedAxesService = new CoordinateAxesService(this.uiScene, center, this.mainCamera, this.uiCamera);

        if (this.staticAxesService) {
            this.staticAxesService.clearAllLines();
        }
        this.staticAxesService = new CoordinateAxesService(this.uiScene, center, this.mainCamera, this.uiCamera);

    }
}

