import * as THREE from 'three';
import { MouseInfo } from './MouseInfo';

export class FrameParams {
  constructor(
    public time: number = 0,
    public delta: number = 0,
    public readonly mouse: MouseInfo = new MouseInfo(),
    public readonly ray: THREE.Ray = new THREE.Ray()) {
  }
}
