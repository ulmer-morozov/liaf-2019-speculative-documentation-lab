/**
 * Loads THREE Textures with progress events
 * @augments THREE.TextureLoader
 */
import * as THREE from 'three';

export class AjaxTextureLoader extends THREE.TextureLoader {
  /**
   * Three's texture loader doesn't support onProgress events, because it uses image tags under the hood.
   *
   * A relatively simple workaround is to AJAX the file into the cache with a FileLoader, create an image from the Blob,
   * then extract that into a texture with a separate TextureLoader call.
   *
   * The cache is in memory, so this will work even if the server doesn't return a cache-control header.
   */

  private fileLoader: THREE.FileLoader;

  constructor(manager?: THREE.LoadingManager) {
    super(manager);

    // Turn on shared caching for FileLoader, ImageLoader and TextureLoader
    THREE.Cache.enabled = true;

    this.fileLoader = new THREE.FileLoader(manager);
    this.fileLoader.setResponseType('blob');
  }

  loadAsync(url: string, onLoad?: (texture: THREE.Texture) => void,
            onProgress?: (event: ProgressEvent) => void,
            onError?: (event: ErrorEvent) => void): void {

    const cacheImage = (blob): void => {

      let image: HTMLImageElement;

      if (blob instanceof HTMLImageElement) {
        image = blob;
        loadImageAsTexture();
      } else if (blob instanceof Blob) {
        const objUrl = URL.createObjectURL(blob);
        image = document.createElementNS('http://www.w3.org/1999/xhtml', 'img') as HTMLImageElement;
        image.style.display = 'none';


        image.onload = () => {
          THREE.Cache.add(url, image);
          URL.revokeObjectURL(objUrl);
          document.body.removeChild(image);
          loadImageAsTexture();
        };

        image.src = objUrl;
        image.style.visibility = 'hidden';
        document.body.appendChild(image);
      } else
        throw new Error('Unknown type');
    };

    const loadImageAsTexture = (): void => {
      super.load
        (
          url,
          t => {
            this.manager.itemEnd(`${url}?texture-loader`);
            onLoad(t);
          },
          undefined,
          onError
        );
    };

    // добавляем лишний итем, чтобы дождаться загрузки images

    this.manager.itemStart(`${url}?texture-loader`);
    this.fileLoader.load(url, cacheImage, onProgress, onError);
  }
}
