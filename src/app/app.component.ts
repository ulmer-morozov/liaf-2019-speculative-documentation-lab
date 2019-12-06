import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';

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
import { OrderGltfProcessor } from './order-gltf-processor';
import { RotatablesGltfProcessor } from './rotatables-gltf-processor';
import { Rotatable } from './rotatable';
import { ResourseBundleLoader } from '../resourse-bundle-loader';
import { ResourceBook } from '../ResourceBook';
import { ResourceBundle } from '../resource-bundle';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface IAudioTrack {
  readonly url: string;
  readonly angle: number;
  readonly outer: number;
  readonly inner: number;
  readonly volume: number;
}

interface IClickAction {
  readonly names: string[];
  readonly url?: string;
}

const aboutBgImageUrl = './assets/text.svg';
const droneAudioPath = './assets/drone.mp3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('audioTrack') audioTrackRefs !: QueryList<ElementRef<HTMLAudioElement>>;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('droneAudioTrack', { static: true }) droneAudioTrackRef !: ElementRef<HTMLAudioElement>;

  private readonly rotatables: Rotatable[] = [];

  public aboutIsShown = false;
  public introIsShown = true;
  public muted = false;

  public loaded = false;

  public readonly audioTracks: IAudioTrack[] = [
    // гугловский язык рыбный
    {
      url: './assets/tourist-tinder-coffeecod.mp3',
      angle: -70,
      inner: 30,
      outer: 80,
      volume: 0.1
    },
    // диалог Марион
    {
      url: './assets/kelp_globetrotter.mp3',
      angle: -147.5,
      inner: 45,
      outer: 55,
      volume: 1.0
    },
    // туристы
    {
      url: './assets/tourists.mp3',
      angle: -245,
      inner: 70,
      outer: 100,
      volume: 1
    },
    // келпский - Жанна
    {
      url: './assets/kelpenian.mp3',
      angle: -315,
      inner: 30,
      outer: 70,
      volume: 0.3
    },

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

  private additionalWheelRot = 0;
  private lastWheelTime = 0;

  private readonly links: MenuGroup[];
  private readonly sprites: SpritePlane[];
  private readonly offsetAnimatedObjects: OffsetAnimatedMesh[];
  private readonly userCamera: THREE.PerspectiveCamera;
  private readonly cameraHolder: THREE.Object3D;

  private readonly screenCenterAbs: THREE.Vector2;
  private readonly frame: FrameParams;

  private time = 0;

  private readonly hborder = 0.3;
  private readonly vborder = 0.1;

  private readonly verticalAngleAmp = Math.PI / 12;

  private destXAngle = 0;
  private destYAngle = 0;

  private readonly animationTasks: AnimationTask[] = [];
  private readonly positionalAudios: THREE.PositionalAudio[] = [];

  private bundle: ResourceBundle;

  public aboutBgFinalImageUrl: SafeResourceUrl;


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

  constructor(private changeDetector: ChangeDetectorRef, private domSanitizer: DomSanitizer) {
    this.offsetAnimatedObjects = [];
    this.sprites = [];
    this.links = [];

    this.screenCenterAbs = new THREE.Vector2();
    this.frame = new FrameParams();

    this.cameraHolder = new THREE.Object3D();
    // this.cameraHolder.rotation.y = Math.PI / 1.5;

    this.userCamera = new THREE.PerspectiveCamera(50, 1, 0.005, 1000);
    this.userCamera.position.z = 1.001;

    this.cameraHolder.add(this.userCamera);
  }

  public ngOnInit(): void {
    this.initThreeJs();

    const meshSceneModelUrl = './assets/lofoscene.glb';
    const files = this.audioTracks.map(x => x.url);

    files.push(droneAudioPath);
    files.push(aboutBgImageUrl);

    const resourceBook = new ResourceBook({
      meshUrl: meshSceneModelUrl,
      fileUrls: files
    });

    const bundleLoader = new ResourseBundleLoader(resourceBook);

    bundleLoader.progress.subscribe(x => {
      this.loadingProgress = Math.round(100 * x) / 100;
      this.changeDetector.detectChanges();

      // console.log(`progress ${x}`);
    });

    bundleLoader.complete.subscribe(bundle => {
      const model = bundle.gltfDict[meshSceneModelUrl];

      this.loaded = true;
      this.bundle = bundle;

      this.aboutBgFinalImageUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(aboutBgImageUrl);

      this.processGltf(model);
      this.fillScene();
      this.startGameLoop();


      // console.log(`complete!`);

      this.changeDetector.detectChanges();
    });


    bundleLoader.load();
  }

  public ngAfterViewInit(): void {
    this.changeDetector.detach();
  }

  private processGltf(gltf: GLTF): void {
    const patcher = new GltfPatcher();

    const menuProcessor = new MenuGltfProcessor();
    const spriteProcessor = new SpriteAnimatorGltfProcessor();
    const materialProcessor = new BasicMaterialGltfProcessor();
    const offsetAnimatedProcessor = new OffsetAnimatorGltfProcessor();

    const rotatableProcessor = new RotatablesGltfProcessor();

    const result = patcher.patch(gltf, [
      materialProcessor,
      spriteProcessor,
      offsetAnimatedProcessor,
      menuProcessor,
      rotatableProcessor,
      new OrderGltfProcessor(),
    ]);

    this.links.push(menuProcessor.getResult());
    this.sprites.push(...spriteProcessor.getResult());
    this.offsetAnimatedObjects.push(...offsetAnimatedProcessor.getResult());

    this.rotatables.push(...rotatableProcessor.getResult());

    this.links.forEach(x => x.setOnClick(this.onLinkClick.bind(this)));
    this.scene.add(result.group);
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
      canvas: this.canvasRef.nativeElement,
      antialias: true
    });

    this.renderer.gammaOutput = true;
    this.scene = new THREE.Scene();

    this.stats = new Stats();

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
  };

  private startGameLoop = (): void => {
    this.requestAnimationId = requestAnimationFrame(this.gameLoop);
  };

  private gameLoop = (newTime: number): void => {
    this.stats.begin();

    this.frame.time = newTime;
    this.frame.delta = Math.round(newTime - this.time);

    if (this.lastWheelTime === undefined)
      this.lastWheelTime = newTime;


    if (Math.abs(this.frame.mouse.posRel.y) > this.vborder) {
      this.destXAngle = this.verticalAngleAmp
        * Math.sign(this.frame.mouse.posRel.y)
        * Math.pow((Math.abs(this.frame.mouse.posRel.y) - this.vborder), 3);
    } else {
      this.destXAngle = 0;
    }

    // чтобы положение мышки не конфликтовало с колесом мышки
    const wheelDelta = newTime - this.lastWheelTime;
    const deltaWasRecentlyUpdated = wheelDelta < 300;

    if (!deltaWasRecentlyUpdated && Math.abs(this.frame.mouse.posRel.x) > this.hborder) {

      const dy = -0.5
        * Math.sign(this.frame.mouse.posRel.x)
        * Math.pow(Math.abs(this.frame.mouse.posRel.x) - this.hborder, 2);

      this.destYAngle = this.cameraHolder.rotation.y + dy;
    }

    this.destYAngle += this.additionalWheelRot;
    this.additionalWheelRot = 0;

    this.frame.raycaster.setFromCamera(this.frame.mouse.posRel, this.userCamera);

    this.links.forEach(x => x.updateSelected(this.frame));
    this.offsetAnimatedObjects.forEach(x => x.update(this.frame));

    if (this.controls === undefined) {
      this.userCamera.rotation.x = this.userCamera.rotation.x + (this.destXAngle - this.userCamera.rotation.x) / 10;
      this.cameraHolder.rotation.y = this.cameraHolder.rotation.y + (this.destYAngle - this.cameraHolder.rotation.y) / 10;
    }

    for (let i = this.animationTasks.length - 1; i >= 0; i--) {
      const animationTask = this.animationTasks[i];

      const completed = animationTask.update(this.frame.time);

      if (completed)
        this.animationTasks.splice(i, 1);
    }

    this.sprites.forEach(x => x.update(this.frame.delta));
    this.rotatables.forEach(rotatable => rotatable.rotate(-this.frame.mouse.posRel.y / 8, 0, -this.frame.mouse.posRel.x / 2));

    this.composer.render();

    this.startGameLoop();
    this.stats.end();

    this.time = newTime;
  };

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

    this.muted = false;
    this.soundIsActivated = true;
    this.changeDetector.detectChanges();

    const droneAudioElement = this.droneAudioTrackRef.nativeElement;
    const droneSourceElement = document.createElement('source');
    droneAudioElement.appendChild(droneSourceElement);

    droneSourceElement.src = this.bundle.fileDict[droneAudioPath];
    droneSourceElement.type = 'audio/mp3';
    droneAudioElement.volume = 0.05;
    droneAudioElement.play();

    const audioTrackRefs = this.audioTrackRefs.toArray();

    for (let i = 0; i < audioTrackRefs.length; i++) {
      const audioElement = audioTrackRefs[i].nativeElement;
      const audioTrackPref = this.audioTracks[i];

      const url = this.bundle.fileDict[audioTrackPref.url];
      const sourceElement = document.createElement('source');

      sourceElement.src = url;
      sourceElement.type = 'audio/mp3';
      audioElement.appendChild(sourceElement);

      const listener = new THREE.AudioListener();
      this.renderPass.camera.add(listener);

      audioElement.volume = audioTrackPref.volume;
      // audioElement.load();
      audioElement.play();

      const positionalAudio = new THREE.PositionalAudio(listener);

      positionalAudio.rotateY(audioTrackPref.angle * Math.PI / 180);
      positionalAudio.setRefDistance(10);
      positionalAudio.setDirectionalCone(audioTrackPref.inner, audioTrackPref.outer, 0);
      positionalAudio.setMediaElementSource(audioElement as any);

      // positionalAudio.add(new THREE.PositionalAudioHelper(positionalAudio, 10));

      this.positionalAudios.push(positionalAudio);
      this.scene.add(positionalAudio);
    }
  }

  public onMouseMove(e: MouseEvent) {
    if (this.introIsShown || this.aboutIsShown || !this.loaded)
      return;

    this.frame.mouse.posAbs.x = e.clientX;
    this.frame.mouse.posAbs.y = e.clientY;

    this.frame.mouse.posRel.x = -(this.screenCenterAbs.x - e.clientX) / this.screenCenterAbs.x;
    this.frame.mouse.posRel.y = +(this.screenCenterAbs.y - e.clientY) / this.screenCenterAbs.y;
  }

  public onMouseDown(e: MouseEvent) {
    if (this.introIsShown || this.aboutIsShown || !this.loaded)
      return;

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

  public mute(): void {
    if (!this.soundIsActivated || this.muted)
      return;

    this.muted = true;
    this.droneAudioTrackRef.nativeElement.pause();

    const audioTrackRefs = this.audioTrackRefs.toArray();
    audioTrackRefs.forEach(x => x.nativeElement.pause());

    this.changeDetector.detectChanges();
  }

  public unMute(): void {
    if (!this.soundIsActivated || !this.muted)
      return;

    this.muted = false;
    this.droneAudioTrackRef.nativeElement.play();

    const audioTrackRefs = this.audioTrackRefs.toArray();
    audioTrackRefs.forEach(x => x.nativeElement.play());

    this.changeDetector.detectChanges();
  }

  public muteToggle(): void {
    if (this.muted) {
      this.unMute();
      return;
    }

    this.mute();
  }


  @HostListener('window: resize')
  public onResize() {
    this.updateLayout();
  }

  @HostListener('document:wheel', ['$event'])
  public onMousewheel(event: WheelEvent) {
    // console.log(`${event.type}  |   ${event.deltaY} | pixels: ${event.deltaMode === event.DOM_DELTA_PIXEL}  | lines: ${event.deltaMode === event.DOM_DELTA_LINE}`);

    if (event.deltaMode === event.DOM_DELTA_PIXEL)
      this.additionalWheelRot += event.deltaY / 1000;
    else
      this.additionalWheelRot += event.deltaY / 10;

    this.lastWheelTime = undefined;

    // console.log('additionalWheelRot ' + this.additionalWheelRot);
  }

  public showAbout(): void {
    this.aboutIsShown = true;
    this.changeDetector.detectChanges();
  }

  public ngOnDestroy(): void {
    this.stopGameLoop();
  }

  public start(): void {
    debugger;
    this.activateSound();

    this.introIsShown = false;
    this.changeDetector.detectChanges();
  }

  public continue(): void {
    this.aboutIsShown = false;
    this.changeDetector.detectChanges();
  }
}
