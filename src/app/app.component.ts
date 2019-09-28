import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import Stats from 'three/examples/jsm/libs/stats.module';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

import { Component, ViewChild, ElementRef, HostListener, OnDestroy, ViewChildren, QueryList, AfterViewInit, OnInit } from '@angular/core';
import { MouseInfo } from './MouseInfo';
import { GifPlane } from './GifPlane';
import { TextLink } from './TextLink';

declare const require: (path: string) => any;

interface IAudioTrack {
  url: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('audioTrack') audioTrackRefs !: QueryList<ElementRef<HTMLAudioElement>>;
  @ViewChild('canvas', { static: true }) canvasRef: ElementRef<HTMLCanvasElement>;

  private stats: Stats;
  private requestAnimationId: number;

  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private controls: OrbitControls;

  private composer: EffectComposer;

  private renderPass: RenderPass;

  private readonly gifs: GifPlane[];
  private readonly links: TextLink[];
  private readonly userCamera: THREE.PerspectiveCamera;

  private readonly screenCenterAbs: THREE.Vector2;
  private readonly mouse: MouseInfo;
  private readonly pointerRay: THREE.Ray;

  private textGeometry: THREE.BufferGeometry;
  private textMaterial: THREE.MeshBasicMaterial;

  private time = 0;

  public readonly audioTracks: IAudioTrack[] = [
    {
      url: './assets/tourist-tinder-coffeecod.mp3'
    },
    {
      url: './assets/kelpenian.mp3'
    }
  ];

  private readonly actionMap: { [linkName: string]: string } = {
    artist_link: 'artist_chat',
    fish_link: 'fish_chat',
    global1_link1: 'globalwave'
  };

  constructor() {
    this.gifs = [];
    this.links = [];

    this.screenCenterAbs = new THREE.Vector2();
    this.mouse = new MouseInfo();
    this.pointerRay = new THREE.Ray();

    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.5, 1000);
    this.userCamera.position.z = 0.0001;
  }

  public ngOnInit(): void {
    this.initThreeJs();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/');

    const meshLoader = new GLTFLoader();
    meshLoader.setDRACOLoader(dracoLoader);

    meshLoader.load('./assets/Lofoscene_optim_4.glb', gltf => {
      gltf.scene.traverse(this.replaceMaterialWithSame.bind(this));
      this.scene.add(gltf.scene);

      this.fillScene();
      this.startGameLoop();
    });
  }

  public ngAfterViewInit(): void {

    const audioTrackRefs = this.audioTrackRefs.toArray();

    for (let i = 0; i < audioTrackRefs.length; i++) {
      const audioElement = audioTrackRefs[i].nativeElement;

      const listener = new THREE.AudioListener();
      this.renderPass.camera.add(listener);

      audioElement.play();

      const positionalAudio = new THREE.PositionalAudio(listener);

      positionalAudio.rotateY(i * Math.PI / 2);
      positionalAudio.setRefDistance(10);
      positionalAudio.setDirectionalCone(90, 120, 0);
      positionalAudio.setMediaElementSource(audioElement as any);

      const helper = new THREE.PositionalAudioHelper(positionalAudio, 10);
      positionalAudio.add(helper);

      this.scene.add(positionalAudio);
    }

  }

  private replaceMaterialWithSame(obj: THREE.Object3D): void {
    if (obj.type !== 'Mesh')
      return;

    const mesh = obj as THREE.Mesh;
    console.log(`mesh: ${mesh.name}`);


    const currentMaterial: THREE.MeshLambertMaterial | THREE.MeshStandardMaterial = mesh.material as any;

    if (currentMaterial.type !== 'MeshStandardMaterial'
      && currentMaterial.type !== 'MeshLambertMaterial')
      return;


    if (mesh.name.toLowerCase().includes('_link') && mesh.name.toLowerCase().includes('man')) {
      mesh.material = new THREE.MeshBasicMaterial({
        color: 0x000000
      });

      return;
    }

    if (mesh.name.toLowerCase().includes('_link')) {
      const link = new TextLink(mesh, () => {
        this.onLinkClick(link);
      });

      this.links.push(link);
      return;
    }

    if (mesh.name.includes('strand')) {
      mesh.material = new THREE.MeshLambertMaterial({
        side: currentMaterial.side,
        transparent: currentMaterial.transparent,
        color: currentMaterial.color,
        map: currentMaterial.map,
        aoMap: currentMaterial.aoMap,
        envMap: currentMaterial.envMap,
        alphaMap: currentMaterial.alphaMap
      });

      return;
    }

    const newMaterial = new THREE.MeshBasicMaterial({
      side: currentMaterial.side,
      transparent: currentMaterial.transparent,
      color: currentMaterial.color,
      map: currentMaterial.map,
      aoMap: currentMaterial.aoMap,
      envMap: currentMaterial.envMap,
      alphaMap: currentMaterial.alphaMap
    });

    mesh.material = newMaterial;
  }

  private onLinkClick(link: TextLink): void {

    const targetName = this.actionMap[link.mesh.name];

    link.mesh.visible = false;

    const obj = this.scene.getObjectByName(targetName);
    console.error(`targetName not found ${link.mesh.name}  -->  ${targetName}`);

    if (obj === undefined) {
      return;
    }

    obj.visible = true;

    console.log(targetName);
  }

  private initThreeJs(): void {
    this.controls = new OrbitControls(this.userCamera, this.canvasRef.nativeElement);

    this.controls.autoRotate = true;
    this.controls.enablePan = false;
    this.controls.enableKeys = true;
    this.controls.enableZoom = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    const polarAmp = Math.PI / 24;

    this.controls.minPolarAngle = Math.PI / 2 - polarAmp;
    this.controls.maxPolarAngle = Math.PI / 2 + polarAmp;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvasRef.nativeElement
    });

    // this.renderer.gammaFactor = 2.2;
    this.renderer.gammaOutput = true;
    this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    this.renderer.toneMappingExposure = 0.1;
    this.renderer.toneMappingWhitePoint = 0.1;
    // this.renderer

    this.scene = new THREE.Scene();

    this.stats = new Stats();
    this.canvasRef.nativeElement.after(this.stats.dom);

    this.renderPass = new RenderPass(this.scene, this.userCamera);

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
    text.position.set(20, 0, 2);

    this.textGeometry.boundingBox.translate(text.position);

    // this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 1));


    // this.scene.add(text);
    // this.scene.add(new THREE.Box3Helper(this.textGeometry.boundingBox));


    // for (const polygonName of names) {

    //   // debugger;

    //   const gifPlane = new GifPlane
    //     ({
    //       countInARow: 1,
    //       url: './assets/animato.png',
    //       width: 50,
    //       height: 50,
    //       tilesHorizontal: 14,
    //       tilesVertical: 1,
    //       numberOfTiles: 14,
    //       tileDisplayDuration: 100
    //     });

    //   this.gifs.push(gifPlane);

    //   const etalon1 = this.scene.getObjectByName(polygonName);
    //   etalon1.visible = false;

    //   this.scene.add(gifPlane.mesh);
    // }


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

  private gameLoop = (newTime: number): void => {
    this.stats.begin();

    const delta = Math.round(newTime - this.time);

    this.controls.update();

    this.gifs.forEach(x => x.update(delta));

    this.pointerRay.origin.setFromMatrixPosition(
      this.renderPass.camera.matrixWorld
    );

    this.pointerRay.direction
      .set(this.mouse.posRel.x, this.mouse.posRel.y, 0.5)
      .unproject(this.renderPass.camera)
      .sub(this.pointerRay.origin)
      .normalize();

    this.links.forEach(x => x.update(this.mouse, this.pointerRay));

    this.composer.render();

    this.startGameLoop();
    this.stats.end();

    this.controls.autoRotateSpeed = Math.abs(this.mouse.posRel.x) > 0.7 ? 10 * this.mouse.posRel.x : 0;


    // debugger;
    // this.controls.rotateUp(this.mouse.posRel.y);

    // this.controls.

    // console.log(this.mouse.posRel.y);

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

    this.userCamera.aspect = width / height;
    this.userCamera.updateProjectionMatrix();
  }

  public onkeydown(e: KeyboardEvent) {

    // // переход на DEBUG Camera
    // if (e.code === 'Space') {
    //   this.renderPass.camera = this.renderPass.camera === this.userCamera
    //     ? this.debugCamera
    //     : this.userCamera;

    //   return;
    // }
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
