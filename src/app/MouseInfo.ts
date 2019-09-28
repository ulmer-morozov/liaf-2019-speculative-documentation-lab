import * as THREE from 'three';

export class MouseInfo {
    public readonly posAbs = new THREE.Vector2();
    public readonly posRel = new THREE.Vector2();
    public leftBtn = false;
}
