import * as THREE from 'three';
import { FrameParams } from './frameParams';

export class MenuLink {
    public static readonly defaultColor = new THREE.Color(0xffffff);
    public static readonly hoverColor = new THREE.Color(0xff0000);

    private readonly material: THREE.MeshBasicMaterial;
    public boundingBox: THREE.Box3;

    private clickStartTime = 0;
    private isPressed = false;

    public onClick: (menuLink: MenuLink) => void;

    constructor(public readonly mesh: THREE.Mesh) {
        if (Array.isArray(mesh.material) || mesh.material.type !== 'MeshBasicMaterial')
            throw new Error(`MenuLink mesh should have THREE.MeshBasicMaterial as material. Current material is ${mesh.material}`);

        this.material = mesh.material as THREE.MeshBasicMaterial;
        this.boundingBox = new THREE.Box3().setFromObject(mesh);

        mesh.parent.add(new THREE.Box3Helper(this.boundingBox));

        mesh.add(new THREE.AxesHelper(3));
        // mesh.geometry.computeBoundingBox();
        // this.boundingBox = mesh.geometry.boundingBox.clone().translate(mesh.position);
    }

    public updateSelected(frame: FrameParams): void {
        const intersect = frame.ray.intersectsBox(this.boundingBox);
        this.material.color = intersect ? MenuLink.hoverColor : MenuLink.defaultColor;

        if (!intersect && this.isPressed) {
            this.isPressed = false;
            return;
        }

        if (
            !intersect
            ||
            !this.isPressed && !frame.mouse.leftBtn
            ||
            this.isPressed && frame.mouse.leftBtn)
            return;

        if (!this.isPressed && frame.mouse.leftBtn) {
            this.isPressed = true;
            this.clickStartTime = frame.time;
            return;
        }

        this.isPressed = false;

        const pressTime = frame.time - this.clickStartTime;

        if (pressTime > 400) {
            console.log(`pressTime ${pressTime}`);
            return;
        }

        if (this.onClick !== undefined)
            this.onClick(this);
    }

    public reset(): void {
        this.material.color = MenuLink.defaultColor;
    }
}
