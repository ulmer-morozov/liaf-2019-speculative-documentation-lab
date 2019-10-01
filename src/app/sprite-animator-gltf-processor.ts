import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';
import { SpritePlane } from './sprite-plane';

export class SpriteAnimatorGltfProcessor extends GltfProcessor<ReadonlyArray<SpritePlane>> {
    public static readonly NAME: string = 'SpriteAnimatorGltfProcessor';
    public static ToothBrushMaterial: THREE.MeshBasicMaterial;

    private readonly meshes: THREE.Mesh[] = [];
    private readonly sprites: SpritePlane[] = [];

    constructor() {
        super(SpriteAnimatorGltfProcessor.NAME);
    }

    public analyse(obj: THREE.Object3D): void {
        if (obj.type !== 'Mesh' || obj.name !== 'toothbrush')
            return;

        const mesh = obj as THREE.Mesh;

        if (Array.isArray(mesh.material) || (mesh.material.type !== 'MeshStandardMaterial' && mesh.material.type !== 'MeshBasicMaterial')) {
            throw new Error
                (
                    `Sprite mesh should have THREE.MeshBasicMaterial or MeshStandardMaterial as material.
                    Current material is ${mesh.material}`
                );
        }

        this.meshes.push(mesh);

        const oldMaterial = mesh.material as (THREE.MeshStandardMaterial | THREE.MeshBasicMaterial);

        if (SpriteAnimatorGltfProcessor.ToothBrushMaterial === undefined) {
            SpriteAnimatorGltfProcessor.ToothBrushMaterial = new THREE.MeshBasicMaterial(
                {
                    side: oldMaterial.side,
                    // transparent: oldMaterial.transparent,
                    color: oldMaterial.color,
                    map: oldMaterial.map,
                    aoMap: oldMaterial.aoMap,
                    envMap: oldMaterial.envMap,
                    alphaMap: oldMaterial.alphaMap,
                    alphaTest: 0.5
                }
            );
        }
    }

    protected processInternal() {

        this.meshes.forEach
            (
                mesh => {

                    mesh.material = SpriteAnimatorGltfProcessor.ToothBrushMaterial;

                    const gifPlane = new SpritePlane
                        ({
                            countInARow: 1,
                            texture: SpriteAnimatorGltfProcessor.ToothBrushMaterial.map,
                            width: 50,
                            height: 50,
                            tilesHorizontal: 14,
                            tilesVertical: 1,
                            numberOfTiles: 14,
                            tileDisplayDuration: 100
                        });

                    this.sprites.push(gifPlane);
                }
            );
    }

    protected getResultInternal(): ReadonlyArray<SpritePlane> {
        return this.sprites;
    }
}
