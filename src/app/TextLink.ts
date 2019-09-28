import * as THREE from 'three';

export class TextLink {

    private boundingBox: THREE.Box3;
    private material: THREE.MeshBasicMaterial;

    constructor(mesh: THREE.Mesh) {
        mesh.geometry.computeBoundingBox();

        this.material = new THREE.MeshBasicMaterial();
        mesh.material = this.material;

        this.boundingBox = mesh.geometry.boundingBox.clone().translate(mesh.position);
    }

    public update(ray: THREE.Ray): void {
        const intersected = ray.intersectsBox(this.boundingBox);
        this.material.color.setHex(intersected ? 0xff0000 : 0xffffff);
    }
}
