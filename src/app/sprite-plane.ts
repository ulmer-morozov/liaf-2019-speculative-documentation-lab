import * as THREE from 'three';
import { TextureAnimator } from './TextureAnimator';

export interface IGifPlaneParams {
    readonly countInARow: number;
    readonly texture: THREE.Texture;
    readonly width: number;
    readonly height: number;
    readonly tilesHorizontal: number;
    readonly tilesVertical: number;
    readonly numberOfTiles: number;
    readonly tileDisplayDuration: number;
}

export class SpritePlane {
    private readonly animator: TextureAnimator;

    constructor(params: IGifPlaneParams) {
        params.texture.wrapS = THREE.RepeatWrapping;
        params.texture.wrapT = THREE.RepeatWrapping;
        // planeTexture.repeat.set(0.5, 2);

        this.animator = new TextureAnimator
            (
                params.countInARow,
                params.texture,
                params.tilesHorizontal,
                params.tilesVertical,
                params.numberOfTiles,
                params.tileDisplayDuration
            );
    }

    public update(delta: number): void {
        this.animator.update(delta);
    }
}
