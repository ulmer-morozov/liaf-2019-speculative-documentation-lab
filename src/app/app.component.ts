import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';


export function TextureAnimator(texture: THREE.Texture, tilesHoriz: number, tilesVert: number,
  numTiles: number, tileDispDuration: number) {
  // note: texture passed by reference, will be updated by the update function.

  this.tilesHorizontal = tilesHoriz;
  this.tilesVertical = tilesVert;
  // how many images does this spritesheet contain?
  //  usually equals tilesHoriz * tilesVert, but not necessarily,
  //  if there at blank tiles at the bottom of the spritesheet. 
  this.numberOfTiles = numTiles;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1 / this.tilesHorizontal, 1 / this.tilesVertical);

  // how long should each image be displayed?
  this.tileDisplayDuration = tileDispDuration;

  // how long has the current image been displayed?
  this.currentDisplayTime = 0;

  // which image is currently being displayed?
  this.currentTile = 0;

  this.update = function (milliSec) {
    this.currentDisplayTime += milliSec;
    while (this.currentDisplayTime > this.tileDisplayDuration) {
      this.currentDisplayTime -= this.tileDisplayDuration;
      this.currentTile++;
      if (this.currentTile == this.numberOfTiles)
        this.currentTile = 0;
      var currentColumn = this.currentTile % this.tilesHorizontal;
      texture.offset.x = currentColumn / this.tilesHorizontal;
      var currentRow = Math.floor(this.currentTile / this.tilesHorizontal);
      texture.offset.y = currentRow / this.tilesVertical;
    }
  };
}


import { Component, ViewChild, ElementRef, OnInit, HostListener, OnDestroy } from '@angular/core';
import { MouseInfo } from './MouseInfo';

declare const require: (path: string) => any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  constructor() {
    this.screenCenterAbs = new THREE.Vector2();
    this.mouse = new MouseInfo();
    this.pointerRay = new THREE.Ray();

    this.debugCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);
    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);

    this.debugCamera.position.z = 5;

    this.userCamera.near = this.debugCamera.near;
    this.userCamera.position.copy(this.debugCamera.position);
  }
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;

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

  private library: { [id: string]: THREE.Texture } = {};

  public ngOnInit(): void {
    this.initThreeJs();
    this.fillScene();
    this.startGameLoop();
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
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 2);
    const material = new THREE.MeshNormalMaterial();

    const mesh = new THREE.Mesh(cubeGeometry, material);
    // this.scene.add(mesh);

    const loader = new THREE.FontLoader();
    const font = loader.parse(require('three/examples/fonts/helvetiker_regular.typeface.json'));

    let xMid: number;
    let text: THREE.Mesh;

    this.textMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      // transparent: true,
      side: THREE.DoubleSide
    });

    const message = 'Lofoten\ntousrism.';
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


    const planeTexture = new THREE.TextureLoader().load('./assets/WalkingManSpriteSheet.png');
    this.annie = new TextureAnimator(planeTexture, 8, 1, 16, 150); // texture, #horiz, #vert, #total, duration.


    const planeGeometry = new THREE.PlaneGeometry(5, 5, 5);
    const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture, transparent: true });
    const cube = new THREE.Mesh(planeGeometry, planeMaterial);

    this.scene.add(cube);

  }

  annie: any;

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

    this.annie.update(delta);













    console.log('delta ' + delta);


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
