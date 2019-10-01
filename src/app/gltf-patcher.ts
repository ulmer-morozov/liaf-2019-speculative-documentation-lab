import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

import { PatchedScene } from './patched-scene';
import { GltfProcessor } from './gltf-processor';

export class GltfPatcher {
  constructor() { }

  public patch(model: GLTF, processors: ReadonlyArray<GltfProcessor>): PatchedScene {
    // method start
    model.scene.children.forEach(x => this.analyse(x, processors));

    const prosessorResults: { [id: string]: any } = {};

    processors.forEach(x => {
      x.process();

      const result = x.getResult();

      if (result === undefined)
        return;

      prosessorResults[x.name] = result;
    });

    const patchedScene: PatchedScene = {
      group: model.scene,
      prosessorResults
    };

    return patchedScene;
  }

  private analyse(obj: THREE.Object3D, processors: ReadonlyArray<GltfProcessor>): void {
    processors.forEach(x => x.analyse(obj));
    obj.children.forEach(x => this.analyse(x, processors));
  }
}
