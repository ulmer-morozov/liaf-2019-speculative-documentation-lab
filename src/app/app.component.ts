import * as THREE from 'three';

import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import Stats from 'three/examples/jsm/libs/stats.module';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

import { Component, ViewChild, ElementRef, OnInit, HostListener, OnDestroy } from '@angular/core';
import { MouseInfo } from './MouseInfo';
import { GifPlane } from './GifPlane';

declare const require: (path: string) => any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;

  private gifs: GifPlane[];

  constructor() {
    this.gifs = [];
    this.screenCenterAbs = new THREE.Vector2();
    this.mouse = new MouseInfo();
    this.pointerRay = new THREE.Ray();

    this.debugCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);
    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);

    this.debugCamera.position.z = 10;

    this.userCamera.near = this.debugCamera.near;
    this.userCamera.position.copy(this.debugCamera.position);
  }

  private stats: Stats;
  private requestAnimationId: number;

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private controls: OrbitControls;

  private composer: EffectComposer;

  private renderPass: RenderPass;

  private readonly debugCamera: THREE.PerspectiveCamera;
  private readonly userCamera: THREE.PerspectiveCamera;

  private readonly screenCenterAbs: THREE.Vector2;
  private readonly mouse: MouseInfo;
  private readonly pointerRay: THREE.Ray;

  private textGeometry: THREE.BufferGeometry;
  private textMaterial: THREE.MeshBasicMaterial;

  clock = new THREE.Clock();

  public ngOnInit(): void {

    const meshLoader = new FBXLoader();

    this.initThreeJs();
    this.fillScene();
    this.startGameLoop();

    // dracoLoader.setDecoderPath('./assets/libs/draco/');



    meshLoader.load('./assets/scene.fbx', result => {

      result.traverse(obj => {
        if (obj.type !== 'Mesh')
          return;

        const mesh = obj as THREE.Mesh;

        const currentMaterial: THREE.MeshLambertMaterial | THREE.MeshStandardMaterial = mesh.material as any;

        if (
          currentMaterial.type !== 'MeshStandardMaterial'
          &&
          currentMaterial.type !== 'MeshLambertMaterial'
        )
          return;

        // debugger;

        const newMaterial = new THREE.MeshBasicMaterial();

        newMaterial.map = currentMaterial.map;
        newMaterial.aoMap = currentMaterial.aoMap;
        newMaterial.envMap = currentMaterial.envMap;
        newMaterial.alphaMap = currentMaterial.alphaMap;

        mesh.material = newMaterial;
      });

      this.scene.add(result);
    });



  }

  private initThreeJs(): void {

    this.controls = new OrbitControls(this.debugCamera, this.canvasRef.nativeElement);
    this.controls.enabled = true; // чтобы ts-lint не пытался удалить неиспользуемую переменную

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvasRef.nativeElement
    });

    this.scene = new THREE.Scene();

    this.stats = new Stats();
    this.canvasRef.nativeElement.after(this.stats.dom);

    this.renderPass = new RenderPass(this.scene, this.debugCamera);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);

    this.updateLayout();
  }

  private fillScene(): void {
    const loader = new THREE.FontLoader();
    const font = loader.parse(require('three/examples/fonts/helvetiker_regular.typeface.json'));

    let xMid: number;
    let text: THREE.Mesh;

    this.textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide
    });

    const message = 'LOFOTEN';
    const shapes = font.generateShapes(message, 3, 0);
    this.textGeometry = new THREE.ShapeBufferGeometry(shapes);
    this.textGeometry.computeBoundingBox();

    xMid = - 0.5 * (this.textGeometry.boundingBox.max.x - this.textGeometry.boundingBox.min.x);

    this.textGeometry.translate(xMid, 0, 0);

    text = new THREE.Mesh(this.textGeometry, this.textMaterial);
    text.position.set(0, 0, -5);

    this.textGeometry.boundingBox.translate(text.position);

    this.scene.add(text);
    // this.scene.add(new THREE.Box3Helper(this.textGeometry.boundingBox));

    const gifPlane = new GifPlane
      ({
        url: './assets/WalkingManSpriteSheet.png',
        width: 5,
        height: 5,
        tilesHorizontal: 8,
        tilesVertical: 1,
        numberOfTiles: 16,
        tileDisplayDuration: 150
      });

    this.gifs.push
      (
        gifPlane
      );

    gifPlane.mesh.position.set(-12, 1, -4);
    gifPlane.mesh.rotateX(Math.PI / 5);
    gifPlane.mesh.rotateY(Math.PI / 10);

    this.scene.add(gifPlane.mesh);
  }

  private stopGameLoop = (): void => {
    if (this.requestAnimationId === undefined)
      return;

    cancelAnimationFrame(this.requestAnimationId);
    this.requestAnimationId = undefined;
  }

  private startGameLoop = (): void => {
    this.requestAnimationId = requestAnimationFrame(this.gameLoop);
  }

  private time: number = 0;

  private gameLoop = (newTime: number): void => {
    this.stats.begin();

    const delta = Math.round(newTime - this.time);

    this.gifs.forEach(x => x.update(delta));

    this.pointerRay.origin.setFromMatrixPosition(
      this.renderPass.camera.matrixWorld
    );

    this.pointerRay.direction
      .set(this.mouse.posRel.x, this.mouse.posRel.y, 0.5)
      .unproject(this.renderPass.camera)
      .sub(this.pointerRay.origin)
      .normalize();

    const intersected = this.pointerRay.intersectsBox(this.textGeometry.boundingBox);

    this.textMaterial.color.setHex(intersected ? 0xff0000 : 0xffffff);


    this.renderer.render(this.scene, this.debugCamera);

    // this.composer.render();

    this.startGameLoop();
    this.stats.end();

    this.time = newTime;
  }

  private updateLayout(): void {
    const dpr = devicePixelRatio <= 2 ? devicePixelRatio : 2;

    const width = this.canvasRef.nativeElement.clientWidth;
    const height = this.canvasRef.nativeElement.clientHeight;

    this.screenCenterAbs.set(width / 2, height / 2);

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    this.composer.setSize(width, height);
    this.composer.setPixelRatio(dpr);

    this.debugCamera.aspect = width / height;
    this.debugCamera.updateProjectionMatrix();

    this.userCamera.aspect = width / height;
    this.userCamera.updateProjectionMatrix();
  }

  public onkeydown(e: KeyboardEvent) {

    // переход на DEBUG Camera
    if (e.code === 'Space') {
      this.renderPass.camera = this.renderPass.camera === this.userCamera
        ? this.debugCamera
        : this.userCamera;

      return;
    }
  }

  public onMouseMove(e: MouseEvent) {
    this.mouse.posAbs.x = e.clientX;
    this.mouse.posAbs.y = e.clientY;

    this.mouse.posRel.x = -(this.screenCenterAbs.x - e.clientX) / this.screenCenterAbs.x;
    this.mouse.posRel.y = +(this.screenCenterAbs.y - e.clientY) / this.screenCenterAbs.y;
  }

  public onMouseDown(e: MouseEvent) {
    this.mouse.leftBtn = e.button === 0;
  }

  public onMouseUp() {
    this.mouse.leftBtn = false;
  }

  @HostListener('window: resize')
  public onResize() {
    this.updateLayout();
  }

  public ngOnDestroy(): void {
    this.stopGameLoop();
  }
}
