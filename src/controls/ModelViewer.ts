import * as THREE from 'three';
import {Object3D, Vector3} from 'three';

export class ModelViewer {
    private object: Object3D;
    private domElement: HTMLElement;
    private camera: THREE.Camera;
    private rotationSpeed: number = 0.002;

    private isMouseDown: boolean = false;
    private previousMousePosition = {x: 0, y: 0};

    public desiredUp: Vector3 = new Vector3(0, 0, -1);
    public maxAngleToStartAlign: number = Math.PI / 10;
    public maxAlignAngle: number = Math.PI / 500;

    constructor(object: Object3D, domElement: HTMLElement, camera: THREE.Camera) {
        this.object = object;
        this.domElement = domElement;
        this.camera = camera;

        this.setupEventListeners();
    }

    /**
     * Set the rotation speed
     * @param speed - The rotation speed multiplier
     */
    public setRotationSpeed(speed: number): void {
        this.rotationSpeed = speed;
    }

    /**
     * Get the current rotation speed
     */
    public getRotationSpeed(): number {
        return this.rotationSpeed;
    }

    private setupEventListeners(): void {
        this.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    }

    private onMouseDown(event: MouseEvent): void {
        if (event.button === 0) { // Left mouse button
            this.isMouseDown = true;
            this.previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        }
    }

    private onMouseMove(event: MouseEvent): void {
        if (!this.isMouseDown) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        this.rotateObject(deltaX, deltaY);

        this.alignObjectUpVector();

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    private onMouseUp(event: MouseEvent): void {
        if (event.button === 0) { // Left mouse button
            this.isMouseDown = false;
        }
    }

    private onMouseLeave(): void {
        this.isMouseDown = false;
    }

    private rotateObject(deltaX: number, deltaY: number): void {
        // Get the object's world position
        const objectWorldPosition = new Vector3();
        this.object.getWorldPosition(objectWorldPosition);

        // Rotate around global Y axis based on horizontal mouse movement
        if (deltaX !== 0) {
            const rotationAngleY = deltaX * this.rotationSpeed;
            this.rotateAroundWorldAxis(this.object, new Vector3(0, 0, -1), rotationAngleY, objectWorldPosition);
        }

        // Rotate around perpendicular axis based on vertical mouse movement
        if (deltaY !== 0) {
            const rotationAngleX = deltaY * this.rotationSpeed;

            // Get camera world position
            const cameraWorldPosition = new Vector3();
            this.camera.getWorldPosition(cameraWorldPosition);

            // Calculate the vector from object to camera
            const objectToCamera = new Vector3().subVectors(cameraWorldPosition, objectWorldPosition);

            // Global Y axis
            const globalY = new Vector3(0, 1, 0);

            // Find the axis perpendicular to both objectToCamera and globalY
            const perpendicularAxis = new Vector3().crossVectors(objectToCamera, globalY).normalize();

            // Only rotate if the perpendicular axis is valid (not zero vector)
            if (perpendicularAxis.length() > 0.001) {
                this.rotateAroundWorldAxis(this.object, perpendicularAxis, rotationAngleX, objectWorldPosition);
            }
        }
    }

    /**
     * Rotate an object around a world axis
     * @param object - The object to rotate
     * @param axis - The world axis to rotate around (must be normalized)
     * @param angle - The angle to rotate in radians
     * @param point - The point through which the axis passes
     */
    private rotateAroundWorldAxis(object: Object3D, axis: Vector3, angle: number, point: Vector3): void {
        // Create a quaternion representing the rotation
        const quaternion = new THREE.Quaternion();
        quaternion.setFromAxisAngle(axis, angle);

        // Get the object's world position
        const objectWorldPosition = new Vector3();
        object.getWorldPosition(objectWorldPosition);

        // Calculate the vector from the rotation point to the object
        const offset = objectWorldPosition.sub(point);

        // Apply the rotation to the offset
        offset.applyQuaternion(quaternion);

        // Update object position
        const newPosition = new Vector3().addVectors(point, offset);

        if (object.parent) {
            // Convert world position to local position
            const parentWorldMatrix = new THREE.Matrix4();
            parentWorldMatrix.copy(object.parent.matrixWorld);
            const inverseParentMatrix = new THREE.Matrix4();
            inverseParentMatrix.copy(parentWorldMatrix).invert();
            newPosition.applyMatrix4(inverseParentMatrix);
        }

        object.position.copy(newPosition);

        // Apply the rotation to the object's orientation
        object.quaternion.multiplyQuaternions(quaternion, object.quaternion);
    }

    private alignObjectUpVector(): void {
        // Get world positions
        const cameraWorldPosition = new Vector3();
        this.camera.getWorldPosition(cameraWorldPosition);

        const objectWorldPosition = new Vector3();
        this.object.getWorldPosition(objectWorldPosition);

        // Calculate the axis from object to camera (rotation axis)
        const objectToCamera = new Vector3().subVectors(cameraWorldPosition, objectWorldPosition);
        const distance = objectToCamera.length();

        if (distance < 0.001) return; // Camera too close to object

        objectToCamera.normalize();

        // Get object's current up vector in world space
        const currentObjectUp = this.desiredUp.clone();
        currentObjectUp.applyQuaternion(this.object.quaternion);
        currentObjectUp.normalize();

        // Calculate angle between current up and desired up
        const cosTheta = THREE.MathUtils.clamp(currentObjectUp.dot(this.desiredUp), -1, 1);
        const angleBetweenUps = Math.acos(cosTheta);
        if (angleBetweenUps > this.maxAngleToStartAlign) {
            return;
        }

        // Project both up vectors onto the plane perpendicular to objectToCamera
        const projectedCurrentUp = currentObjectUp.clone().sub(
            objectToCamera.clone().multiplyScalar(currentObjectUp.dot(objectToCamera))
        ).normalize();

        const projectedDesiredUp = this.desiredUp.clone().sub(
            objectToCamera.clone().multiplyScalar(this.desiredUp.dot(objectToCamera))
        ).normalize();

        // Check if projections are valid
        if (projectedCurrentUp.length() < 0.001 || projectedDesiredUp.length() < 0.001) {
            return; // Up vectors are parallel to the view axis
        }

        // Calculate the angle between projected up vectors
        const cosAngle = THREE.MathUtils.clamp(projectedCurrentUp.dot(projectedDesiredUp), -1, 1);
        const angle = Math.min(this.maxAlignAngle, Math.acos(cosAngle));

        // Determine rotation direction using cross product
        const cross = new Vector3().crossVectors(projectedCurrentUp, projectedDesiredUp);
        const sign = Math.sign(cross.dot(objectToCamera));

        // Create rotation quaternion around the objectToCamera axis
        const rotationQuaternion = new THREE.Quaternion();
        rotationQuaternion.setFromAxisAngle(objectToCamera, angle * sign);

        // Apply the rotation to the object's orientation
        this.object.quaternion.multiplyQuaternions(rotationQuaternion, this.object.quaternion);
    }

    /**
     * Dispose of event listeners
     */
    public dispose(): void {
        this.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.domElement.removeEventListener('mouseleave', this.onMouseLeave.bind(this));
    }
}

