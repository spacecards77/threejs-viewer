import * as THREE from 'three';
import { Construction } from '../entities';
import { LineService } from './LineService';
import {Vector3} from "three";
import {config} from "../config.ts";

export class DrawService {
    private lineService: LineService;
    constructor(lineService: LineService) {
        this.lineService = lineService;
    }

    drawConstruction(construction: Construction) {
        this.lineService.clearAllLines();

        const center = construction.geometry.getCenter();
        this.lineService.setLineParentPosition(center);

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
            this.lineService.drawLine(p1, p2, { color: 0x99CCCC});
        }

        for (const node of geometry.nodes) {
            const position = new THREE.Vector3(node.x, node.y, node.z);
            this.lineService.drawSquare(position, { color: 0xFF0000, size: 3 });
        }

        this.drawArrows();

        if (config.debugMode)
            console.log(`Model displayed: ${geometry.members.length} members drawn`);

        construction.geometry.Model = this.lineService.getLineParent();
    }

    private drawArrows() {
        const length = 1;
        this.lineService.drawArrow(new Vector3(), new Vector3(length, 0, 0), {color: 0xBA0000}); // X - Red
        this.lineService.drawArrow(new Vector3(), new Vector3(0, length, 0), {color: 0x00C500}); // Y - Green
        this.lineService.drawArrow(new Vector3(), new Vector3(0, 0, length), {color: 0x00FFFF}); // Z - Blue
    }
}

