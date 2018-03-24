import * as THREE from "three";

/**
 * originally from https://github.com/mrdoob/three.js/blob/dev/examples/js/controls/PointerLockControls.js
 * @author mrdoob / http://mrdoob.com/
 *
 * edited by Erich Loftis (erichlof on GitHub)
 * https://github.com/erichlof
 * Btw, this is the most consice and elegant way to implement first person camera rotation/movement that I've ever seen -
 * look at how short it is, without spaces/braces it would be around 30 lines!  Way to go, mrdoob!
 */

let PI_2 = Math.PI / 2;

export class FirstPersonCameraControls
{
    camera: THREE.Camera;
    yawObject: THREE.Object3D;
    pitchObject: THREE.Object3D;
    constructor(camera: THREE.Camera)
    {
        this.camera = camera;

        camera.rotation.set(0, 0, 0);

        this.pitchObject = new THREE.Object3D();
        this.pitchObject.add(camera);

        this.yawObject = new THREE.Object3D();
        this.yawObject.add(this.pitchObject);

        const scope = this;

        let movementX = 0;
        let movementY = 0;

        const onMouseMove = event =>
        {
            movementX = event.movementX || event.mozMovementX || 0;
            movementY = event.movementY || event.mozMovementY || 0;

            scope.yawObject.rotation.y -= movementX * 0.002;
            scope.pitchObject.rotation.x -= movementY * 0.002;

            scope.pitchObject.rotation.x = Math.max(- PI_2, Math.min(PI_2, scope.pitchObject.rotation.x));
        };

        document.addEventListener('mousemove', onMouseMove, false);
    }

    getObject() { return this.yawObject };

    getYawObject() { return this.yawObject; }

    getPitchObject() { return this.pitchObject; }

    getDirection(v)
    {
        const te = this.camera.matrixWorld.elements;
        v.set(te[8], te[9], te[10]).negate();
        return v;
    };

    getUpVector(v)
    {
        const te = this.camera.matrixWorld.elements;

        v.set(te[4], te[5], te[6]);

        return v;

    };

    getRightVector(v)
    {
        const te = this.camera.matrixWorld.elements;
        v.set(te[0], te[1], te[2]);
        return v;
    };
};
