import * as THREE from 'three';
import { TextureAnimator } from './TextureAnimator';

export interface IGifPlaneParams {
    readonly url: string;
    readonly width: number;
    readonly height: number;
    readonly tilesHorizontal: number;
    readonly tilesVertical: number;
    readonly numberOfTiles: number;
    readonly tileDisplayDuration: number;
}

export class GifPlane {
    public readonly mesh: THREE.Mesh;
    private readonly animator: TextureAnimator;

    constructor(params: IGifPlaneParams) {

        const planeTexture = new THREE.TextureLoader().load(params.url);

        this.animator = new TextureAnimator
            (
                planeTexture,
                params.tilesHorizontal,
                params.tilesVertical,
                params.numberOfTiles,
                params.tileDisplayDuration
            );

        const planeGeometry = new THREE.PlaneGeometry(params.width, params.height);
        const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture });
        
        this.mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    }

    public update(delta: number): void {
        this.animator.update(delta);
    }
}
