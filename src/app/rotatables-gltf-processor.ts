import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';
import { Rotatable } from './rotatable';

const rotatableObjects: string[] = [
    'book_rotate'
];

export class RotatablesGltfProcessor extends GltfProcessor<Rotatable[]> {
    public static readonly NAME: string = 'RotatablesGltfProcessor';

    private meshes: THREE.Mesh[] = [];
    private rotatables: Rotatable[] = [];

    constructor() {
        super(RotatablesGltfProcessor.NAME);
    }

    public analyse(obj: THREE.Object3D) {
        if (obj.type !== 'Mesh')
            return;

        console.log(obj.name);

        const mesh = obj as THREE.Mesh;

        if (rotatableObjects.indexOf(mesh.name) < 0)
            return;

        this.meshes.push(mesh);
    }

    protected processInternal(): void {
        this.rotatables = this.meshes.map
            (
                mesh => {

                    // mesh.add(new THREE.AxesHelper(3));
                    return new Rotatable(mesh);
                }
            );
    }

    protected getResultInternal(): Rotatable[] {
        return this.rotatables;
    }
}
