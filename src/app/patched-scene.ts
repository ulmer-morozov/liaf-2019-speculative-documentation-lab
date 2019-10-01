import * as THREE from 'three';

export interface PatchedScene {
    readonly group: THREE.Scene;
    readonly prosessorResults: { [id: string]: any };
}
