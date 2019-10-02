import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';

export class BasicMaterialGltfProcessor extends GltfProcessor<void> {
    public static readonly NAME: string = 'BasicMaterialGltfProcessor';
    public static readonly GuyMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    private meshes: THREE.Mesh[] = [];

    constructor() {
        super(BasicMaterialGltfProcessor.NAME);
    }

    public analyse(obj: THREE.Object3D) {
        if (obj.type !== 'Mesh')
            return;

        console.log(obj.name);

        const mesh = obj as THREE.Mesh;

        // мультиматериалы пропускаем
        if (Array.isArray(mesh.material))
            return;

        // не стандартные материалы тоже пропускаем
        if (mesh.material.type !== 'MeshStandardMaterial' && mesh.material.type !== 'MeshLambertMaterial')
            return;

        this.meshes.push(mesh);
    }

    protected processInternal(): void {
        this.meshes.forEach
            (
                mesh => {
                    const oldMaterial = mesh.material as (THREE.MeshStandardMaterial | THREE.MeshLambertMaterial);

                    const defaultMaterialParameters = {
                        side: oldMaterial.side,
                        transparent: oldMaterial.transparent,
                        color: oldMaterial.color,
                        map: oldMaterial.map,
                        aoMap: oldMaterial.aoMap,
                        envMap: oldMaterial.envMap,
                        alphaMap: oldMaterial.alphaMap,
                    };

                    if (this.nameContains(mesh, ['man']))
                        mesh.material = BasicMaterialGltfProcessor.GuyMaterial;
                    else if (this.nameContains(mesh, ['strand']))
                        mesh.material = new THREE.MeshLambertMaterial(defaultMaterialParameters);
                    else
                        mesh.material = new THREE.MeshBasicMaterial(defaultMaterialParameters);

                    oldMaterial.dispose();
                }
            );
    }

    protected getResultInternal(): void {
        return;
    }
}
