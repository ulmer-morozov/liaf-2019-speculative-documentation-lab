import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';

const orderMap: { [name: string]: number } = {
    aurora: 1,
    artist_chat: 10,
    book_rotate: 20,
    isa: 30,
    globalwave: 40,
    themoon: 50
};

export class OrderGltfProcessor extends GltfProcessor<void> {
    public static readonly NAME: string = 'OrderGltfProcessor';

    private meshes: THREE.Mesh[] = [];

    constructor() {
        super(OrderGltfProcessor.NAME);
    }

    public analyse(obj: THREE.Object3D) {
        if (obj.type !== 'Mesh')
            return;

        console.log(obj.name);

        const mesh = obj as THREE.Mesh;

        if (!orderMap.hasOwnProperty(mesh.name))
            return;

        this.meshes.push(mesh);
    }

    protected processInternal(): void {
        this.meshes.forEach
            (
                mesh => {
                    // мультиматериалы пропускаем
                    if (Array.isArray(mesh.material)) {
                        debugger;
                        return;
                    }

                    // mesh.material.depthWrite = false;

                    mesh.renderOrder = orderMap[mesh.name];
                }
            );
    }

    protected getResultInternal(): void {
        return;
    }
}
