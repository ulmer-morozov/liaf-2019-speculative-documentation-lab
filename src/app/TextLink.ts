import * as THREE from 'three';
import { MouseInfo } from './MouseInfo';

export class TextLink {
    private used = false
    private boundingBox: THREE.Box3;
    private material: THREE.MeshBasicMaterial;

    constructor(public mesh: THREE.Mesh, private onClick: () => void) {
        mesh.geometry.computeBoundingBox();

        this.material = new THREE.MeshBasicMaterial();
        mesh.material = this.material;

        this.boundingBox = mesh.geometry.boundingBox.clone().translate(mesh.position);
    }

    public update(mouse: MouseInfo, ray: THREE.Ray): void {
        if (this.used)
            return;

        const intersected = ray.intersectsBox(this.boundingBox);
        this.material.color.setHex(intersected ? 0xff0000 : 0xffffff);

        if (!intersected || !mouse.leftBtn)
            return;

        this.used = true;

        this.onClick();
    }
}
