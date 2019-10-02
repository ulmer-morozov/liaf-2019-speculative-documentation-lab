import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';
import { OffsetAnimatedMesh } from './offset-animated-mesh';

export class OffsetAnimatorGltfProcessor extends GltfProcessor<ReadonlyArray<OffsetAnimatedMesh>> {
    public static readonly NAME: string = 'OffsetAnimatorGltfProcessor';
    public static AuroraMaterial: THREE.MeshBasicMaterial;

    private readonly meshes: THREE.Mesh[] = [];
    private readonly sprites: OffsetAnimatedMesh[] = [];

    constructor() {
        super(OffsetAnimatorGltfProcessor.NAME);
    }

    public analyse(obj: THREE.Object3D): void {
        if (obj.type !== 'Mesh' || obj.name !== 'aurora')
            return;

        const mesh = obj as THREE.Mesh;

        const sc = 0.01;

        mesh.scale.set(-sc, sc, -sc);

        mesh.updateWorldMatrix(true, true);

        this.meshes.push(mesh);

        const oldMaterial = mesh.material as (THREE.MeshStandardMaterial | THREE.MeshBasicMaterial);


        if (OffsetAnimatorGltfProcessor.AuroraMaterial === undefined) {
            const repeatCount = new THREE.Vector2(1, 1);

            const map = new THREE.TextureLoader().load('./assets/aurora2.jpeg');
            const alphaMap = new THREE.TextureLoader().load('./assets/aurora2_a.jpeg');


            map.repeat.copy(repeatCount);
            alphaMap.repeat.copy(repeatCount);
            oldMaterial.map.repeat.copy(repeatCount);

            OffsetAnimatorGltfProcessor.AuroraMaterial = new THREE.MeshBasicMaterial(
                {
                    side: THREE.DoubleSide,
                    transparent: true,
                    map: oldMaterial.map,
                    alphaMap: alphaMap, // oldMaterial.alphaMap,
                    // alphaTest: 0.25
                }
            );

            // mesh.add(new THREE.Mesh(new THREE.SphereBufferGeometry(8, 8, 8), OffsetAnimatorGltfProcessor.AuroraMaterial));

            // debugger;

            // debug
            // OffsetAnimatorGltfProcessor.AuroraMaterial = new THREE.MeshNormalMaterial({
            //     side: THREE.DoubleSide,
            // }) as any;

            // debugger;


        }
    }

    protected processInternal() {

        this.meshes.forEach
            (
                mesh => {

                    mesh.material = OffsetAnimatorGltfProcessor.AuroraMaterial;

                    const offsetPlane = new OffsetAnimatedMesh(mesh, 0.15, 0);

                    this.sprites.push(offsetPlane);
                }
            );
    }

    protected getResultInternal(): ReadonlyArray<OffsetAnimatedMesh> {
        return this.sprites;
    }
}


            // const map = new THREE.TextureLoader().load('./assets/aurora2.jpeg');
            // const alphaMap = new THREE.TextureLoader().load('./assets/aurora2_a.jpeg');

            // map.wrapS = THREE.RepeatWrapping;
            // map.wrapT = THREE.RepeatWrapping;
            // map.repeat.copy(repeatCount);
            // map.flipY = true;

            // alphaMap.wrapS = THREE.RepeatWrapping;
            // alphaMap.wrapT = THREE.RepeatWrapping;
            // alphaMap.repeat.copy(repeatCount);
            // alphaMap.flipY = true;

            // debugger;