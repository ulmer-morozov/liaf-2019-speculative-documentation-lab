import * as THREE from 'three';

export class OffsetTextureAnimator {
    constructor(
        private readonly texture: THREE.Texture,
        private readonly dx = 0,
        private readonly dy = 0) {
        texture.magFilter = THREE.NearestFilter;

        texture.wrapS  = THREE.RepeatWrapping;
    }

    public update(milliSec: number): void {
        this.texture.offset.x += this.dx * milliSec / 1000;
        this.texture.offset.y += this.dy * milliSec / 1000;

        // console.log(this.texture);
    }
}
