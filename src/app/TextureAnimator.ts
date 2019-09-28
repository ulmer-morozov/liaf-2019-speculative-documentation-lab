import * as THREE from 'three';

export class TextureAnimator {
    private currentDisplayTime = 0;
    private currentTile = 0;

    constructor(
        private texture: THREE.Texture,
        private tilesHorizontal: number,
        private tilesVertical: number,
        private numberOfTiles: number,
        private tileDisplayDuration: number) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);
    }

    public update(milliSec: number): void {
        this.currentDisplayTime += milliSec;
        while (this.currentDisplayTime > this.tileDisplayDuration) {
            this.currentDisplayTime -= this.tileDisplayDuration;
            this.currentTile++;

            if (this.currentTile === this.numberOfTiles)
                this.currentTile = 0;

            const currentColumn = this.currentTile % this.tilesHorizontal;
            const currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
            this.texture.offset.x = currentColumn / this.tilesHorizontal;
            this.texture.offset.y = currentRow / this.tilesVertical;
        }
    }
}
