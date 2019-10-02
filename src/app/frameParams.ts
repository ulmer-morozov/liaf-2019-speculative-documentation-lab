import * as THREE from 'three';
import { MouseInfo } from './MouseInfo';

export class FrameParams {
  constructor(
    public time = 0,
    public delta = 0,
    public readonly mouse = new MouseInfo(),
    public readonly raycaster = new THREE.Raycaster()) {
  }
}
