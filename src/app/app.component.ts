import * as THREE from 'three';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

import Stats from 'three/examples/jsm/libs/stats.module';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';

import { Component, ViewChild, ElementRef, HostListener, OnDestroy, ViewChildren, QueryList, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { SpritePlane } from './sprite-plane';
import { GltfPatcher } from './gltf-patcher';
import { MenuGltfProcessor } from './menu-gltf-processor';
import { BasicMaterialGltfProcessor } from './basic-material-gltf-processor';
import { MenuGroup } from './MenuGroup';
import { FrameParams } from './frameParams';
import { MenuLink } from './MenuLink';
import { SpriteAnimatorGltfProcessor } from './sprite-animator-gltf-processor';
import { OffsetAnimatedMesh } from './offset-animated-mesh';
import { OffsetAnimatorGltfProcessor } from './offset-animator-gltf-processor';
import { AnimationTask } from './AnimationTask';

declare const require: (path: string) => any;

interface IAudioTrack {
  url: string;
}

const rotationPrecession = 1000;

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

  private readonly links: MenuGroup[];
  private readonly sprites: SpritePlane[];
  private readonly offsetAnimatedObjects: OffsetAnimatedMesh[];
  private readonly userCamera: THREE.PerspectiveCamera;
  private readonly cameraHolder: THREE.Object3D;

  private readonly screenCenterAbs: THREE.Vector2;
  private readonly frame: FrameParams;

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

  private readonly animationTasks: AnimationTask[] = [

  ];

  private readonly actionMap: { [linkName: string]: readonly string[] } = {
    The_link: ['book_rotate'],
    is_link: ['isa'],
    global_link: ['globalwave'],
    that_link: ['thatconnects', 'greenstrand21', 'redstrand21'],
    intimate_link: ['intimate'],
    and_link: ['chart_rotate'],
    celestial_link: ['painting'],
    //
    // with_link: [''], //https://youtu.be/7UT3XFHe-Rs
    // guys
    fish_link: ['fish_chat'],
    blacklist_link: ['blacklist_chat'],
    local_link: ['localist_chat'],
    florist_link: ['florist_chat'],
    artist_link: ['artist_chat'],
    //
    of_moon_link: ['themoon', 'moon'],
    and_sun_link: ['andthesun', 'sun']
  };

  constructor(private changeDetector: ChangeDetectorRef) {
    this.offsetAnimatedObjects = [];
    this.sprites = [];
    this.links = [];

    this.screenCenterAbs = new THREE.Vector2();
    this.frame = new FrameParams();

    this.cameraHolder = new THREE.Object3D();

    this.cameraHolder.rotation.y = Math.PI / 1.5;
    this.cameraHolder.position.z = 0.001;

    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.005, 10000);

    this.cameraHolder.add(this.userCamera);

    // this.userCamera.rotation.y = Math.PI / 1.5;

  }

  public ngOnInit(): void {
    this.initThreeJs();

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/');

    const meshLoader = new GLTFLoader();
    meshLoader.setDRACOLoader(dracoLoader);


    const processGltf = gltf => {
      const patcher = new GltfPatcher();

      const menuProcessor = new MenuGltfProcessor();
      const spriteProcessor = new SpriteAnimatorGltfProcessor();
      const materialProcessor = new BasicMaterialGltfProcessor();
      const offsetAnimatedProcessor = new OffsetAnimatorGltfProcessor();

      const result = patcher.patch(gltf, [
        materialProcessor,
        spriteProcessor,
        offsetAnimatedProcessor,
        menuProcessor
      ]);

      this.links.push(menuProcessor.getResult());
      this.sprites.push(...spriteProcessor.getResult());
      this.offsetAnimatedObjects.push(...offsetAnimatedProcessor.getResult());

      this.links.forEach(x => x.setOnClick(this.onLinkClick.bind(this)));

      // debugger;
      this.scene.add(result.group);
    };


    meshLoader.load('./assets/Lofoscene_newplugin_noaurora.glb', sceneGltf => {
      processGltf(sceneGltf);

      meshLoader.load('./assets/aurora.glb', auroraGltf => {
        processGltf(auroraGltf);

        this.fillScene();
        this.startGameLoop();
      });

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
      // positionalAudio.add(helper);

      this.scene.add(positionalAudio);
    }

    this.changeDetector.detach();
  }

  private onLinkClick(link: MenuLink): void {
    link.disabled = true;

    const animationTask = new AnimationTask(link.mesh, 0, this.time, 300);
    this.animationTasks.push(animationTask);

    const relatedObjects = this.actionMap[link.mesh.name];
    if (relatedObjects === undefined) {
      console.error(`Map for object with name ${link.mesh.name} is undefined.`);
      return;
    }

    relatedObjects.forEach(
      objName => {
        const obj = this.scene.getObjectByName(objName) as THREE.Mesh;// приведение неявное

        if (obj === undefined) {
          console.error(`targetName not found ${link.mesh.name}  -->  ${objName}`);
          return;
        }

        console.log(objName);

        this.animationTasks.push(new AnimationTask(obj, 1, this.time, 600));
      }
    );

  }

  private initThreeJs(): void {
    // this.controls = new OrbitControls(this.userCamera, this.canvasRef.nativeElement);

    // this.controls.autoRotate = true;
    // this.controls.enablePan = false;
    // this.controls.enableKeys = true;
    // this.controls.enableZoom = true;
    // this.controls.enableDamping = true;
    // this.controls.dampingFactor = 0.05;



    const polarAmp = Math.PI / 24;
    // this.controls.minPolarAngle = Math.PI / 2 - polarAmp;
    // this.controls.maxPolarAngle = Math.PI / 2 + polarAmp;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvasRef.nativeElement
    });

    // this.renderer.gammaFactor = 2.2;
    this.renderer.gammaOutput = true;
    // this.renderer.toneMapping = THREE.Uncharted2ToneMapping;
    // this.renderer.toneMappingExposure = 0.1;
    // this.renderer.toneMappingWhitePoint = 0.1;
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

    // скроем интерактивные элементы

    for (const key in this.actionMap) {
      if (!this.actionMap.hasOwnProperty(key))
        continue;

      const switchableObjectNames = this.actionMap[key];

      if (switchableObjectNames === undefined) {
        console.error(`Map for object with name ${key} is undefined.`);
        continue;
      }

      for (const switchableObjectName of switchableObjectNames) {
        // console.log(`${key} --> ${switchableObjectName}`);

        const switchableObject = this.scene.getObjectByName(switchableObjectName);

        if (switchableObject === undefined) {
          console.error(`Object with name ${switchableObjectName} not found.`);
          continue;
        }

        switchableObject.visible = false;
        // (switchableObject as any).material.opacity = 0;
      }

    }

    this.scene.add(this.cameraHolder);

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

  private hborder = 0.7;
  private vborder = 0.6;

  private readonly verticalAngleAmp = Math.PI / 12;

  private destXAngle = 0;
  private destYAngle = 0;

  private gameLoop = (newTime: number): void => {
    this.stats.begin();

    this.frame.time = newTime;
    this.frame.delta = Math.round(newTime - this.time);


    if (Math.abs(this.frame.mouse.posRel.y) > this.vborder) {
      this.destXAngle = this.verticalAngleAmp
        * Math.sign(this.frame.mouse.posRel.y)
        * (Math.abs(this.frame.mouse.posRel.y) - this.vborder);
    } else {
      this.destXAngle = 0;
    }

    if (Math.abs(this.frame.mouse.posRel.x) > this.hborder) {

      const dy = -2.990
        * Math.sign(this.frame.mouse.posRel.x)
        * Math.pow(Math.abs(this.frame.mouse.posRel.x) - this.hborder, 2);

      this.destYAngle = this.cameraHolder.rotation.y + dy;

    } else {
      this.frame.raycaster.setFromCamera(this.frame.mouse.posRel, this.userCamera);

      this.links.forEach(x => x.updateSelected(this.frame));

      this.offsetAnimatedObjects.forEach(x => x.update(this.frame));
    }

    this.userCamera.rotation.x = this.userCamera.rotation.x + (this.destXAngle - this.userCamera.rotation.x) / 10;
    this.cameraHolder.rotation.y = this.cameraHolder.rotation.y + (this.destYAngle - this.cameraHolder.rotation.y) / 10;

    this.sprites.forEach(x => x.update(this.frame.delta));

    for (let i = this.animationTasks.length - 1; i >= 0; i--) {
      const animationTask = this.animationTasks[i];

      const completed = animationTask.update(this.frame.time);

      if (completed)
        this.animationTasks.splice(i, 1);
    }

    this.composer.render();

    this.startGameLoop();
    this.stats.end();


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
    this.frame.mouse.posAbs.x = e.clientX;
    this.frame.mouse.posAbs.y = e.clientY;

    this.frame.mouse.posRel.x = -(this.screenCenterAbs.x - e.clientX) / this.screenCenterAbs.x;
    this.frame.mouse.posRel.y = +(this.screenCenterAbs.y - e.clientY) / this.screenCenterAbs.y;
  }

  public onMouseDown(e: MouseEvent) {
    this.frame.mouse.leftBtn = e.button === 0;
  }

  public onMouseUp() {
    this.frame.mouse.leftBtn = false;
  }

  @HostListener('window: resize')
  public onResize() {
    this.updateLayout();
  }

  public ngOnDestroy(): void {
    this.stopGameLoop();
  }
}
