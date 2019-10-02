import { OffsetTextureAnimator } from './offset-texture-animator';
import { FrameParams } from './frameParams';

export class OffsetAnimatedMesh {
    private readonly animator: OffsetTextureAnimator;

    constructor(
        readonly mesh: THREE.Mesh,
        readonly dx: number,
        readonly dy: number
    ) {

        if (Array.isArray(mesh.material) || (mesh.material.type !== 'MeshStandardMaterial' && mesh.material.type !== 'MeshBasicMaterial')) {
            throw new Error
                (
                    `OffsetAnimatedMesh mesh should have THREE.MeshBasicMaterial or MeshStandardMaterial as material.
                    Current material is ${mesh.material}`
                );
        }

        const material = mesh.material as (THREE.MeshStandardMaterial | THREE.MeshBasicMaterial);

        this.animator = new OffsetTextureAnimator(material.map, this.dx, this.dy);
    }

    public update(frame: FrameParams): void {
        this.animator.update(frame.delta);
    }
}
