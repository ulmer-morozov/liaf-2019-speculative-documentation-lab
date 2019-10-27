import * as THREE from 'three';

export class Rotatable {
    private readonly defaultRotation: THREE.Euler;

    constructor(private readonly mesh: THREE.Mesh) {
        this.defaultRotation = mesh.rotation.clone();
    }

    public rotate(x: number, y: number, z: number): void {
        this.mesh.rotation.set
            (
                this.defaultRotation.x + x,
                this.defaultRotation.y + y,
                this.defaultRotation.z + z
            );
    }
}
