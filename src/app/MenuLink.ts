import * as THREE from 'three';
import { FrameParams } from './frameParams';

export class MenuLink {
    public readonly collider: THREE.Mesh;

    private readonly material: THREE.MeshBasicMaterial;
    public boundingBox: THREE.Box3;

    private clickStartTime = 0;
    private isPressed = false;

    public onClick: (menuLink: MenuLink) => void;

    public disabled = false;

    constructor(public readonly mesh: THREE.Mesh, private readonly defaultColor: THREE.Color, private readonly hoverColor: THREE.Color) {
        if (Array.isArray(mesh.material) || mesh.material.type !== 'MeshBasicMaterial')
            throw new Error(`MenuLink mesh should have THREE.MeshBasicMaterial as material. Current material is ${mesh.material}`);

        this.material = mesh.material as THREE.MeshBasicMaterial;

        mesh.geometry.computeBoundingBox();
        this.boundingBox = mesh.geometry.boundingBox;

        const boxSize = this.boundingBox.getSize(new THREE.Vector3());
        const cubeGeometre = new THREE.BoxBufferGeometry(boxSize.x, boxSize.y, boxSize.z);

        this.collider = new THREE.Mesh(cubeGeometre, new THREE.MeshNormalMaterial({
            wireframe: true,
            visible: false
        }));

        mesh.add(this.collider);
    }

    public updateSelected(intersect: boolean, time: number, leftBtn: boolean): void {

        // const intersect = frame.ray.intersectsBox(this.boundingBox);
        this.material.color = intersect ? this.hoverColor : this.defaultColor;

        if (!intersect && this.isPressed) {
            this.isPressed = false;
            return;
        }

        if (
            !intersect
            ||
            !this.isPressed && !leftBtn
            ||
            this.isPressed && leftBtn)
            return;

        if (!this.isPressed && leftBtn) {
            this.isPressed = true;
            this.clickStartTime = time;
            return;
        }

        this.isPressed = false;

        const pressTime = time - this.clickStartTime;

        if (pressTime > 600) {
            console.log(`pressTime ${pressTime}`);
            return;
        }

        if (this.onClick !== undefined)
            this.onClick(this);
    }

    public reset(): void {
        this.material.color = this.defaultColor;
    }
}
