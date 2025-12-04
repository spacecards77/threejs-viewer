import * as THREE from 'three';
import { Construction } from '../entities';
import { LineService } from './LineService';

export class DrawService {
    private lineService: LineService;
    constructor(lineService: LineService) {
        this.lineService = lineService;
    }

    drawConstruction(construction: Construction) {
        this.lineService.clearAllLines();

        const center = construction.geometry.getCenter();

        const geom = construction.geometry;
        for (const m of geom.members) {
            const n1 = geom.idToNode.get(m.node1Id);
            const n2 = geom.idToNode.get(m.node2Id);
            if (!n1 || !n2) {
                if (!n1) console.warn(`Invalid Node1Id for member ${m.id}: Node1Id=${m.node1Id}`);
                if (!n2) console.warn(`Invalid Node2Id for member ${m.id}: Node2Id=${m.node2Id}`);
                continue;
            }
            const p1 = new THREE.Vector3(n1.x, n1.y, n1.z);
            const p2 = new THREE.Vector3(n2.x, n2.y, n2.z);
            this.lineService.drawLine(p1, p2, center, { color: 0x99CCCC});
        }

        console.log(`Model displayed: ${geom.members.length} members drawn`);
    }
}

