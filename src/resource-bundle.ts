import * as THREE from 'three/src/Three';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';

export class ResourceBundle<TData = void> {
  constructor(
    public readonly fileDict: { [url: string]: string } = {},
    public readonly gltfDict: { [url: string]: GLTF },
    public readonly textureDict: { [url: string]: THREE.Texture } = {},
    public readonly data: TData
  ) {

  }
}
