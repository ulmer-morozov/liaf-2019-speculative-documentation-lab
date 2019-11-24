import {Loader, LoadingManager} from 'three';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader';
import {DDSLoader} from 'three/examples/jsm/loaders/DDSLoader';
import {GLTF} from 'three/examples/jsm/loaders/GLTFLoader';


export class GLTFLoader2 extends Loader {

  constructor(manager?: LoadingManager);

  dracoLoader: DRACOLoader | null;
  ddsLoader: DDSLoader | null;

  load(url: string, onLoad: (gltf: GLTF) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;

  setDRACOLoader(dracoLoader: DRACOLoader): GLTFLoader2;

  setDDSLoader(ddsLoader: DDSLoader): GLTFLoader2;

  parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: GLTF) => void, onError?: (event: ErrorEvent) => void): void;

}
