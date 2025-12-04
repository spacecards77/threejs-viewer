import {
	EventDispatcher,
	MOUSE,
	Quaternion,
	Vector2,
	Vector3,
	Object3D,
	Camera,
	OrthographicCamera,
	PerspectiveCamera
} from 'three';

const _changeEvent = { type: 'change' };
const _startEvent = { type: 'start' };
const _endEvent = { type: 'end' };

type CustomTrackballControlsEventMap = {
	change: {};
	start: {};
	end: {};
};

class CustomTrackballControls extends EventDispatcher<CustomTrackballControlsEventMap> {
	object: Object3D;
	domElement: HTMLElement;
	window: Window;

	enabled: boolean;
	screen: { left: number; top: number; width: number; height: number; };

	rotateSpeed: number;
	zoomSpeed: number;
	panSpeed: number;
	zAlignSpeed: number;

	noRotate: boolean;
	noZoom: boolean;
	noPan: boolean;

	staticMoving: boolean;
	dynamicDampingFactor: number;

	minDistance: number;
	maxDistance: number;

	minZoom: number;
	maxZoom: number;

	keys: string[];
	mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE; };

	target: Vector3;

	private _state: number;
	private _keyState: number;
	private readonly _eye: Vector3;
	private _movePrev: Vector2;
	private _moveCurr: Vector2;
	private _lastAxis: Vector3;
	private _lastAngle: number;
	private _zoomStart: Vector2;
	private _zoomEnd: Vector2;
	private _touchZoomDistanceStart: number;
	private _touchZoomDistanceEnd: number;
	private _panStart: Vector2;
	private _panEnd: Vector2;

	private _target0: Vector3;
	private _position0: Vector3;
	private _up0: Vector3;
	private _zoom0: number;

	private _lastPosition: Vector3;
	private _lastZoom: number;

	private _pointers: PointerEvent[];
	private _pointerPositions: { [id: number]: Vector2 };

	constructor(object: Object3D, domElement: HTMLElement, domWindow?: Window) {
		super();
		this.object = object;
		this.domElement = domElement;
		this.window = domWindow || window;

		// API
		this.enabled = true;

		this.screen = { left: 0, top: 0, width: 0, height: 0 };

		this.rotateSpeed = 1.0;
		this.zoomSpeed = 1.2;
		this.panSpeed = 0.3;
		this.zAlignSpeed = 0.1; // Speed of alignment to Z-axis (0.0 - 1.0, where 1.0 is instant)

		this.noRotate = false;
		this.noZoom = false;
		this.noPan = false;

		this.staticMoving = false;
		this.dynamicDampingFactor = 0.2;

		this.minDistance = 0;
		this.maxDistance = Infinity;

		this.minZoom = 0;
		this.maxZoom = Infinity;

		this.keys = ['KeyA', 'KeyS', 'KeyD'];
		this.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN };

		// internals
		this.target = new Vector3();

		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		this._state = STATE.NONE;
		this._keyState = STATE.NONE;

		this._eye = new Vector3();

		this._movePrev = new Vector2();
		this._moveCurr = new Vector2();

		this._lastAxis = new Vector3();
		this._lastAngle = 0;

		this._zoomStart = new Vector2();
		this._zoomEnd = new Vector2;

		this._touchZoomDistanceStart = 0;
		this._touchZoomDistanceEnd = 0;

		this._panStart = new Vector2();
		this._panEnd = new Vector2();

		this._lastPosition = new Vector3();
		this._lastZoom = 1;

		// for reset
		this._target0 = this.target.clone();
		this._position0 = this.object.position.clone();
		this._up0 = this.object.up.clone();
		this._zoom0 = (this.object as Camera & { zoom?: number }).zoom || 1;

		// events
		this.domElement.addEventListener('contextmenu', this.contextmenu);
		this.domElement.addEventListener('pointerdown', this.onPointerDown);
		this.domElement.addEventListener('pointercancel', this.onPointerCancel);
		this.domElement.addEventListener('wheel', this.mousewheel, { passive: false });

		this.window.addEventListener('keydown', this.keydown);
		this.window.addEventListener('keyup', this.keyup);

		this._pointers = [];
		this._pointerPositions = {};

		this.handleResize();

		// force an update at start
		this.update();
	}

	// methods
	handleResize = () => {
		const box = this.domElement.getBoundingClientRect();
		const d = this.domElement.ownerDocument.documentElement;
		this.screen = {
			left: box.left + this.window.pageXOffset - d.clientLeft,
			top: box.top + this.window.pageYOffset - d.clientTop,
			width: box.width,
			height: box.height
		};
	};

	private getMouseOnScreen = (pageX: number, pageY: number) => {
		const vector = new Vector2();
		return vector.set(
			(pageX - this.screen.left) / this.screen.width,
			(pageY - this.screen.top) / this.screen.height
		);
	};

	private getMouseOnCircle = (pageX: number, pageY: number) => {
		const vector = new Vector2();
		return vector.set(
			((pageX - this.screen.width * 0.5 - this.screen.left) / (this.screen.width * 0.5)),
			((this.screen.height + 2 * (this.screen.top - pageY)) / this.screen.width) // screen.width intentional
		);
	};

	private rotateCamera = () => {
		const axis = new Vector3();
		const quaternion = new Quaternion();
		const eyeDirection = new Vector3();
		const objectUpDirection = new Vector3();
		const objectSidewaysDirection = new Vector3();
		const moveDirection = new Vector3();

		moveDirection.set(this._moveCurr.x - this._movePrev.x, this._moveCurr.y - this._movePrev.y, 0);
		let angle = moveDirection.length();

		if (angle) {
			this._eye.copy(this.object.position).sub(this.target);
			eyeDirection.copy(this._eye).normalize();
			objectUpDirection.copy(this.object.up).normalize();
			objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();
			objectUpDirection.setLength(this._moveCurr.y - this._movePrev.y);
			objectSidewaysDirection.setLength(this._moveCurr.x - this._movePrev.x);
			moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));
			axis.crossVectors(moveDirection, this._eye).normalize();
			angle *= this.rotateSpeed;
			quaternion.setFromAxisAngle(axis, angle);
			this._eye.applyQuaternion(quaternion);
			this.object.up.applyQuaternion(quaternion);
			this._lastAxis.copy(axis);
			this._lastAngle = angle;

			// Gradually align camera.up to the closest Z-axis direction (positive or negative)
			if (this.zAlignSpeed > 0) {
				const currentUp = this.object.up.clone().normalize();
				const zAxisPositive = new Vector3(0, 0, 1);
				const zAxisNegative = new Vector3(0, 0, -1);

				// Determine which Z direction is closer
				const dotPositive = currentUp.dot(zAxisPositive);
				const dotNegative = currentUp.dot(zAxisNegative);
				const targetZAxis = dotPositive > dotNegative ? zAxisPositive : zAxisNegative;

				// Calculate the rotation angle around the eye direction
				const eyeDir = this._eye.clone().normalize();
				const currentUpProjected = currentUp.clone().sub(eyeDir.clone().multiplyScalar(currentUp.dot(eyeDir))).normalize();
				const targetZAxisProjected = targetZAxis.clone().sub(eyeDir.clone().multiplyScalar(targetZAxis.dot(eyeDir))).normalize();

				// Calculate angle between projected vectors
				const rollAngle = Math.acos(Math.max(-1, Math.min(1, currentUpProjected.dot(targetZAxisProjected))));

				// Determine rotation direction using cross product
				const rollCross = new Vector3().crossVectors(currentUpProjected, targetZAxisProjected);
				const rollDirection = rollCross.dot(eyeDir) >= 0 ? 1 : -1;

				// Apply the roll rotation around the eye axis with speed factor
				if (rollAngle > 0.001) { // Small threshold to avoid unnecessary rotations
					const rollQuaternion = new Quaternion();
					// Apply only a fraction of the angle based on zAlignSpeed
					const gradualRollAngle = rollAngle * rollDirection * this.zAlignSpeed;
					rollQuaternion.setFromAxisAngle(eyeDir, gradualRollAngle);
					this.object.up.applyQuaternion(rollQuaternion);
				}
			}
		} else if (!this.staticMoving && this._lastAngle) {
			this._lastAngle *= Math.sqrt(1.0 - this.dynamicDampingFactor);
			this._eye.copy(this.object.position).sub(this.target);
			quaternion.setFromAxisAngle(this._lastAxis, this._lastAngle);
			this._eye.applyQuaternion(quaternion);
			this.object.up.applyQuaternion(quaternion);

			// Continue gradual Z-axis alignment during inertial rotation
			if (this.zAlignSpeed > 0) {
				const currentUp = this.object.up.clone().normalize();
				const zAxisPositive = new Vector3(0, 0, 1);
				const zAxisNegative = new Vector3(0, 0, -1);

				const dotPositive = currentUp.dot(zAxisPositive);
				const dotNegative = currentUp.dot(zAxisNegative);
				const targetZAxis = dotPositive > dotNegative ? zAxisPositive : zAxisNegative;

				const eyeDir = this._eye.clone().normalize();
				const currentUpProjected = currentUp.clone().sub(eyeDir.clone().multiplyScalar(currentUp.dot(eyeDir))).normalize();
				const targetZAxisProjected = targetZAxis.clone().sub(eyeDir.clone().multiplyScalar(targetZAxis.dot(eyeDir))).normalize();

				const rollAngle = Math.acos(Math.max(-1, Math.min(1, currentUpProjected.dot(targetZAxisProjected))));

				const rollCross = new Vector3().crossVectors(currentUpProjected, targetZAxisProjected);
				const rollDirection = rollCross.dot(eyeDir) >= 0 ? 1 : -1;

				if (rollAngle > 0.001) {
					const rollQuaternion = new Quaternion();
					const gradualRollAngle = rollAngle * rollDirection * this.zAlignSpeed;
					rollQuaternion.setFromAxisAngle(eyeDir, gradualRollAngle);
					this.object.up.applyQuaternion(rollQuaternion);
				}
			}
		}
		this._movePrev.copy(this._moveCurr);
	};

	private zoomCamera = () => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		let factor;

		if (this._state === STATE.TOUCH_ZOOM_PAN) {
			factor = this._touchZoomDistanceStart / this._touchZoomDistanceEnd;
			this._touchZoomDistanceStart = this._touchZoomDistanceEnd;

			if ((this.object as PerspectiveCamera).isPerspectiveCamera) {
				this._eye.multiplyScalar(factor);
			} else if ((this.object as OrthographicCamera).isOrthographicCamera) {
				(this.object as OrthographicCamera).zoom = Math.max(this.minZoom, Math.min(this.maxZoom, (this.object as OrthographicCamera).zoom / factor));
				(this.object as OrthographicCamera).updateProjectionMatrix();
			} else {
				console.warn('THREE.TrackballControls: Unsupported camera type');
			}

		} else {
			factor = 1.0 + (this._zoomEnd.y - this._zoomStart.y) * this.zoomSpeed;
			if (factor !== 1.0 && factor > 0.0) {
				if ((this.object as PerspectiveCamera).isPerspectiveCamera) {
					this._eye.multiplyScalar(factor);
				} else if ((this.object as OrthographicCamera).isOrthographicCamera) {
					(this.object as OrthographicCamera).zoom = Math.max(this.minZoom, Math.min(this.maxZoom, (this.object as OrthographicCamera).zoom / factor));
					(this.object as OrthographicCamera).updateProjectionMatrix();
				} else {
					console.warn('THREE.TrackballControls: Unsupported camera type');
				}
			}
			if (this.staticMoving) {
				this._zoomStart.copy(this._zoomEnd);
			} else {
				this._zoomStart.y += (this._zoomEnd.y - this._zoomStart.y) * this.dynamicDampingFactor;
			}
		}
	};

	private panCamera = () => {
		const mouseChange = new Vector2();
		const objectUp = new Vector3();
		const pan = new Vector3();

		mouseChange.copy(this._panEnd).sub(this._panStart);
		if (mouseChange.lengthSq()) {
			/*if ((this.object as OrthographicCamera).isOrthographicCamera) {
				const scale_x = ((this.object as OrthographicCamera).right - (this.object as OrthographicCamera).left) / (this.object as OrthographicCamera).zoom / this.domElement.clientWidth;
				const scale_y = ((this.object as OrthographicCamera).top - (this.object as OrthographicCamera).bottom) / (this.object as OrthographicCamera).zoom / this.domElement.clientHeight;
				mouseChange.x *= scale_x;
				mouseChange.y *= scale_y;
			}*/
			mouseChange.multiplyScalar(this._eye.length() * this.panSpeed);
			pan.copy(this._eye).cross(this.object.up).setLength(mouseChange.x);
			pan.add(objectUp.copy(this.object.up).setLength(mouseChange.y));
			this.object.position.add(pan);
			this.target.add(pan);
			if (this.staticMoving) {
				this._panStart.copy(this._panEnd);
			} else {
				this._panStart.add(mouseChange.subVectors(this._panEnd, this._panStart).multiplyScalar(this.dynamicDampingFactor));
			}
		}
	};

	private checkDistances = () => {
		if (!this.noZoom || !this.noPan) {
			if (this._eye.lengthSq() > this.maxDistance * this.maxDistance) {
				this.object.position.addVectors(this.target, this._eye.setLength(this.maxDistance));
				this._zoomStart.copy(this._zoomEnd);
			}
			if (this._eye.lengthSq() < this.minDistance * this.minDistance) {
				this.object.position.addVectors(this.target, this._eye.setLength(this.minDistance));
				this._zoomStart.copy(this._zoomEnd);
			}
		}
	};

	update = () => {
		this._eye.subVectors(this.object.position, this.target);
		if (!this.noRotate) {
			this.rotateCamera();
		}
		if (!this.noZoom) {
			this.zoomCamera();
		}
		if (!this.noPan) {
			this.panCamera();
		}
		this.object.position.addVectors(this.target, this._eye);
		if ((this.object as PerspectiveCamera).isPerspectiveCamera) {
			this.checkDistances();
			this.object.lookAt(this.target);
			if (this._lastPosition.distanceToSquared(this.object.position) > 0.000001) {
				this.dispatchEvent(_changeEvent);
				this._lastPosition.copy(this.object.position);
			}
		} else if ((this.object as OrthographicCamera).isOrthographicCamera) {
			this.object.lookAt(this.target);
			if (this._lastPosition.distanceToSquared(this.object.position) > 0.000001 || this._lastZoom !== (this.object as OrthographicCamera).zoom) {
				this.dispatchEvent(_changeEvent);
				this._lastPosition.copy(this.object.position);
				this._lastZoom = (this.object as OrthographicCamera).zoom;
			}
		} else {
			console.warn('THREE.TrackballControls: Unsupported camera type');
		}
	};

	reset = () => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		this._state = STATE.NONE;
		this._keyState = STATE.NONE;
		this.target.copy(this._target0);
		this.object.position.copy(this._position0);
		this.object.up.copy(this._up0);
		(this.object as Camera & { zoom?: number }).zoom = this._zoom0;
		(this.object as Camera & { updateProjectionMatrix?: () => void }).updateProjectionMatrix?.();
		this._eye.subVectors(this.object.position, this.target);
		this.object.lookAt(this.target);
		this.dispatchEvent(_changeEvent);
		this._lastPosition.copy(this.object.position);
		this._lastZoom = (this.object as Camera & { zoom?: number }).zoom || 1;
	};

	private keydown = (event: KeyboardEvent) => {
		if (this.enabled === false) return;
		this.window.removeEventListener('keydown', this.keydown);
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		if (this._keyState !== STATE.NONE) {
			return;
		} else if (event.code === this.keys[STATE.ROTATE] && !this.noRotate) {
			this._keyState = STATE.ROTATE;
		} else if (event.code === this.keys[STATE.ZOOM] && !this.noZoom) {
			this._keyState = STATE.ZOOM;
		} else if (event.code === this.keys[STATE.PAN] && !this.noPan) {
			this._keyState = STATE.PAN;
		}
	};

	private keyup = () => {
		if (this.enabled === false) return;
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		this._keyState = STATE.NONE;
		this.window.addEventListener('keydown', this.keydown);
	};

	private onPointerDown = (event: PointerEvent) => {
		if (this.enabled === false) return;

		if (this._pointers.length === 0) {
			this.domElement.setPointerCapture(event.pointerId);
			this.domElement.addEventListener('pointermove', this.onPointerMove);
			this.domElement.addEventListener('pointerup', this.onPointerUp);
		}

		this.addPointer(event);

		if (event.pointerType === 'touch') {
			this.touchStart(event);
		} else {
			this.mousedown(event);
		}
	};

	private onPointerMove = (event: PointerEvent) => {
		if (this.enabled === false) return;

		if (event.pointerType === 'touch') {
			this.touchMove(event);
		} else {
			this.mousemove(event);
		}
	};

	private onPointerUp = (event: PointerEvent) => {
		if (this.enabled === false) return;

		if (event.pointerType === 'touch') {
			this.touchEnd(event);
		} else {
			this.mouseup();
		}

		this.removePointer(event);

		if (this._pointers.length === 0) {
			this.domElement.releasePointerCapture(event.pointerId);
			this.domElement.removeEventListener('pointermove', this.onPointerMove);
			this.domElement.removeEventListener('pointerup', this.onPointerUp);
		}
	};

	private onPointerCancel = (event: PointerEvent) => {
		this.removePointer(event);
	};

	private mousedown = (event: MouseEvent) => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		let mouseAction;
		switch (event.button) {
			case 0:
				mouseAction = this.mouseButtons.LEFT;
				break;
			case 1:
				mouseAction = this.mouseButtons.MIDDLE;
				break;
			case 2:
				mouseAction = this.mouseButtons.RIGHT;
				break;
			default:
				mouseAction = -1;
		}

		switch (mouseAction) {
			case MOUSE.DOLLY:
				if (this.noZoom === false) {
					this._state = STATE.ZOOM;
				}
				break;
			case MOUSE.ROTATE:
				if (this.noRotate === false) {
					this._state = STATE.ROTATE;
				}
				break;
			case MOUSE.PAN:
				if (this.noPan === false) {
					this._state = STATE.PAN;
				}
				break;
			default:
				this._state = STATE.NONE;
		}

		const state = (this._keyState !== STATE.NONE) ? this._keyState : this._state;

		if (state === STATE.ROTATE && !this.noRotate) {
			this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
			this._movePrev.copy(this._moveCurr);
		} else if (state === STATE.ZOOM && !this.noZoom) {
			this._zoomStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
			this._zoomEnd.copy(this._zoomStart);
		} else if (state === STATE.PAN && !this.noPan) {
			this._panStart.copy(this.getMouseOnScreen(event.pageX, event.pageY));
			this._panEnd.copy(this._panStart);
		}

		this.dispatchEvent(_startEvent);
	};

	private mousemove = (event: MouseEvent) => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		const state = (this._keyState !== STATE.NONE) ? this._keyState : this._state;

		if (state === STATE.ROTATE && !this.noRotate) {
			this._movePrev.copy(this._moveCurr);
			this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
		} else if (state === STATE.ZOOM && !this.noZoom) {
			this._zoomEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
		} else if (state === STATE.PAN && !this.noPan) {
			this._panEnd.copy(this.getMouseOnScreen(event.pageX, event.pageY));
		}
	};

	private mouseup = () => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		this._state = STATE.NONE;
		this.dispatchEvent(_endEvent);
	};

	private mousewheel = (event: WheelEvent) => {
		if (this.enabled === false || this.noZoom === true) return;
		event.preventDefault();
		event.stopPropagation();
		switch (event.deltaMode) {
			case 2:
				// Zoom in pages
				this._zoomStart.y -= event.deltaY * 0.025;
				break;
			case 1:
				// Zoom in lines
				this._zoomStart.y -= event.deltaY * 0.01;
				break;
			default:
				// undefined, 0, assume pixels
				this._zoomStart.y -= event.deltaY * 0.00025;
				break;
		}
		this.dispatchEvent(_startEvent);
		this.dispatchEvent(_endEvent);
	};

	private touchStart = (event: PointerEvent) => {
		this.trackPointer(event);
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		switch (this._pointers.length) {
			case 1:
				this._state = STATE.TOUCH_ROTATE;
				this._moveCurr.copy(this.getMouseOnCircle(this._pointers[0].pageX, this._pointers[0].pageY));
				this._movePrev.copy(this._moveCurr);
				break;
			default: // 2 or more
				this._state = STATE.TOUCH_ZOOM_PAN;
				const dx = this._pointers[0].pageX - this._pointers[1].pageX;
				const dy = this._pointers[0].pageY - this._pointers[1].pageY;
				this._touchZoomDistanceEnd = this._touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);

				const x = (this._pointers[0].pageX + this._pointers[1].pageX) / 2;
				const y = (this._pointers[0].pageY + this._pointers[1].pageY) / 2;
				this._panStart.copy(this.getMouseOnScreen(x, y));
				this._panEnd.copy(this._panStart);
				break;
		}
		this.dispatchEvent(_startEvent);
	};

	private touchMove = (event: PointerEvent) => {
		this.trackPointer(event);
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		switch (this._pointers.length) {
			case 1:
				this._movePrev.copy(this._moveCurr);
				this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
				break;
			default: // 2 or more
				const position = this.getSecondPointerPosition(event);
				const dx = event.pageX - position.x;
				const dy = event.pageY - position.y;
				this._touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

				const x = (event.pageX + position.x) / 2;
				const y = (event.pageY + position.y) / 2;
				this._panEnd.copy(this.getMouseOnScreen(x, y));
				break;
		}
	};

	private touchEnd = (event: PointerEvent) => {
		const STATE = { NONE: - 1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };
		switch (this._pointers.length) {
			case 0:
				this._state = STATE.NONE;
				break;
			case 1:
				this._state = STATE.TOUCH_ROTATE;
				this._moveCurr.copy(this.getMouseOnCircle(event.pageX, event.pageY));
				this._movePrev.copy(this._moveCurr);
				break;
		}
		this.dispatchEvent(_endEvent);
	};

	private contextmenu = (event: MouseEvent) => {
		if (this.enabled === false) return;
		event.preventDefault();
	};

	private addPointer = (event: PointerEvent) => {
		this._pointers.push(event);
	};

	private removePointer = (event: PointerEvent) => {
		delete this._pointerPositions[event.pointerId];
		for (let i = 0; i < this._pointers.length; i++) {
			if (this._pointers[i].pointerId == event.pointerId) {
				this._pointers.splice(i, 1);
				return;
			}
		}
	};

	private trackPointer = (event: PointerEvent) => {
		let position = this._pointerPositions[event.pointerId];
		if (position === undefined) {
			position = new Vector2();
			this._pointerPositions[event.pointerId] = position;
		}
		position.set(event.pageX, event.pageY);
	};

	private getSecondPointerPosition = (event: PointerEvent) => {
		const pointer = (event.pointerId === this._pointers[0].pointerId) ? this._pointers[1] : this._pointers[0];
		return this._pointerPositions[pointer.pointerId];
	};

	dispose = () => {
		this.domElement.removeEventListener('contextmenu', this.contextmenu);
		this.domElement.removeEventListener('pointerdown', this.onPointerDown);
		this.domElement.removeEventListener('pointercancel', this.onPointerCancel);
		this.domElement.removeEventListener('wheel', this.mousewheel);

		this.window.removeEventListener('keydown', this.keydown);
		this.window.removeEventListener('keyup', this.keyup);
	};
}

export { CustomTrackballControls };
