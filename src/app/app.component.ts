import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import Stats from 'three/examples/jsm/libs/stats.module';

import {
  Component,
  ViewChild,
  ElementRef,
  HostListener,
  OnDestroy, ViewChildren,
  QueryList,
  AfterViewInit,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

declare const Pace: any;

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
  readonly url: string;
}


interface IClickAction {
  readonly names: string[];
  readonly url?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('audioTrack') audioTrackRefs !: QueryList<ElementRef<HTMLAudioElement>>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('droneAudioTrack', { static: true }) droneAudioTrackRefs !: ElementRef<HTMLAudioElement>;

  public readonly audioTracks: IAudioTrack[] = [
    {
      url: './assets/tourist-tinder-coffeecod.mp3'
    },
    {
      url: './assets/kelpenian.mp3'
    }
  ];

  public soundIsActivated = false;
  public loadingProgress = 0;

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

  private readonly hborder = 0.3;
  private readonly vborder = 0.1;

  private readonly verticalAngleAmp = Math.PI / 12;

  private destXAngle = 0;
  private destYAngle = 0;

  private readonly animationTasks: AnimationTask[] = [

  ];

  private readonly actionMap: { [linkName: string]: IClickAction } = {
    The_link: { names: ['book_rotate'] },
    is_link: { names: ['isa'] },
    global_link: { names: ['globalwave'] },
    that_link: { names: ['thatconnects', 'greenstrand21', 'redstrand21'] },
    intimate_link: { names: ['intimate'] },
    and_link: { names: ['chart_rotate'] },
    celestial_link: { names: ['painting'] },
    // video link
    with_link: { names: [], url: 'https://youtu.be/7UT3XFHe-Rs' },
    // guys
    fish_link: { names: ['fish_chat'] },
    fishman_link: { names: ['fish_chat', 'fish_link'] },
    blacklist_link: { names: ['blacklist_chat'] },
    blacklistman_link: { names: ['blacklist_chat', 'blacklist_link'] },
    local_link: { names: ['localist_chat'] },
    localman__link: { names: ['localist_chat', 'local_link'] },
    florist_link: { names: ['florist_chat'] },
    floraman_link: { names: ['florist_chat', 'florist_link'] },
    artist_link: { names: ['artist_chat'] },
    artistman_link: { names: ['artist_chat', 'artist_link'] },
    // stars
    of_moon_link: { names: ['themoon', 'moon'] },
    and_sun_link: { names: ['andthesun', 'sun'] }
  };

  constructor(private changeDetector: ChangeDetectorRef) {
    this.offsetAnimatedObjects = [];
    this.sprites = [];
    this.links = [];

    this.screenCenterAbs = new THREE.Vector2();
    this.frame = new FrameParams();

    this.cameraHolder = new THREE.Object3D();
    // this.cameraHolder.rotation.y = Math.PI / 1.5;

    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.005, 10000);
    this.userCamera.position.z = 1.001;

    this.cameraHolder.add(this.userCamera);
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
      this.scene.add(result.group);
    };

    const onMeshLoaded = (sceneGltf: GLTF) => {
      processGltf(sceneGltf);

      this.fillScene();
      this.startGameLoop();

      // meshLoader.load('./assets/aurora.glb', auroraModel => {


      // const auroraMesh = auroraModel.children[0] as THREE.Mesh;

      // auroraMesh.scale.set(auroraMesh.scale.x, -auroraMesh.scale.y, auroraMesh.scale.z);

      // auroraMesh.position.y = 1000;
      // (auroraMesh.material as THREE.MeshLambertMaterial).transparent = true;
      // this.scene.add(auroraMesh);


      //   processGltf(auroraModel);

      //   this.fillScene();
      //   this.startGameLoop();
      // });



    };

    const onMeshLoadProgress = (event: ProgressEvent): void => {
      this.loadingProgress = Math.round(100 * event.loaded / event.total) / 100;
      this.changeDetector.detectChanges();
    };

    meshLoader.load('./assets/lofoscene.glb', onMeshLoaded, onMeshLoadProgress);
  }

  public ngAfterViewInit(): void {
    this.changeDetector.detach();
  }

  private onLinkClick(link: MenuLink): void {
    link.disabled = true;

    const isAManLink = link.mesh.name.includes('man');

    if (!isAManLink) {
      const animationTask = new AnimationTask(link.mesh, 0, this.time, 300);
      this.animationTasks.push(animationTask);
    }

    const relatedObjects = this.actionMap[link.mesh.name];

    if (relatedObjects === undefined) {
      console.error(`Map for object with name ${link.mesh.name} is undefined.`);
      return;
    }

    if (relatedObjects.url !== undefined)
      window.open(relatedObjects.url, '_blank');

    relatedObjects.names.forEach(
      objName => {
        const obj = this.scene.getObjectByName(objName) as THREE.Mesh; // приведение неявное

        if (obj === undefined) {
          console.error(`targetName not found ${link.mesh.name}  -->  ${objName}`);
          return;
        }

        if (obj.name.includes('link'))
          this.animationTasks.push(new AnimationTask(obj, 0, this.time, 300));
        else
          this.animationTasks.push(new AnimationTask(obj, 1, this.time, 300));
      }
    );

    this.changeDetector.detectChanges();
  }

  private initThreeJs(): void {
    // this.controls = new OrbitControls(this.userCamera, this.canvasRef.nativeElement);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: this.canvasRef.nativeElement
    });

    this.renderer.gammaOutput = true;
    this.scene = new THREE.Scene();

    this.stats = new Stats();
    // this.canvasRef.nativeElement.after(this.stats.dom);

    this.renderPass = new RenderPass(this.scene, this.userCamera);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);

    this.updateLayout();
  }

  private fillScene(): void {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 1));

    this.hideInfo();
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

  private gameLoop = (newTime: number): void => {
    this.stats.begin();

    this.frame.time = newTime;
    this.frame.delta = Math.round(newTime - this.time);

    if (Math.abs(this.frame.mouse.posRel.y) > this.vborder) {
      this.destXAngle = this.verticalAngleAmp
        * Math.sign(this.frame.mouse.posRel.y)
        * Math.pow((Math.abs(this.frame.mouse.posRel.y) - this.vborder), 3);
    } else {
      this.destXAngle = 0;
    }

    if (Math.abs(this.frame.mouse.posRel.x) > this.hborder) {

      const dy = -0.890
        * Math.sign(this.frame.mouse.posRel.x)
        * Math.pow(Math.abs(this.frame.mouse.posRel.x) - this.hborder, 2);

      this.destYAngle = this.cameraHolder.rotation.y + dy;
    }

    this.frame.raycaster.setFromCamera(this.frame.mouse.posRel, this.userCamera);

    this.links.forEach(x => x.updateSelected(this.frame));
    this.offsetAnimatedObjects.forEach(x => x.update(this.frame));

    if (this.controls === undefined) {
      this.userCamera.rotation.x = this.userCamera.rotation.x + (this.destXAngle - this.userCamera.rotation.x) / 10;
      this.cameraHolder.rotation.y = this.cameraHolder.rotation.y + (this.destYAngle - this.cameraHolder.rotation.y) / 10;
    }

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

  public activateSound() {
    if (this.soundIsActivated)
      return;

    this.soundIsActivated = true;
    this.changeDetector.detectChanges();

    this.droneAudioTrackRefs.nativeElement.play();
    this.droneAudioTrackRefs.nativeElement.volume = 0.5;

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

  private hideInfo(): void {
    for (const key in this.actionMap) {
      if (!this.actionMap.hasOwnProperty(key))
        continue;

      const switchableObjectMap = this.actionMap[key];

      if (switchableObjectMap === undefined) {
        console.error(`Map for object with name ${key} is undefined.`);
        continue;
      }

      for (const switchableObjectName of switchableObjectMap.names) {
        // не будем скрывать ссылки, но оставим возможность скрывать их при нажатии на чуваков
        if (switchableObjectName.includes('link'))
          continue;

        const switchableObject = this.scene.getObjectByName(switchableObjectName);

        if (switchableObject === undefined) {
          console.error(`Object with name ${switchableObjectName} not found.`);
          continue;
        }

        switchableObject.visible = false;
      }
    }
  }

  @HostListener('window: resize')
  public onResize() {
    this.updateLayout();
  }

  @HostListener('wheel', ['$event'])
  public onMousewheel(event: WheelEvent) {
    console.log(`${event.type}  |   ${event.deltaY} | pixels: ${event.deltaMode === event.DOM_DELTA_PIXEL}  | lines: ${event.deltaMode === event.DOM_DELTA_LINE}`);
  }

  public ngOnDestroy(): void {
    this.stopGameLoop();
  }
}
