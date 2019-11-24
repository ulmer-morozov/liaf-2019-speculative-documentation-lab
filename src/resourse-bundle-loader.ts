import * as THREE from 'three/src/Three';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {DRACOLoader} from 'three/examples/jsm/loaders/DRACOLoader';
import {ResourceBook} from './ResourceBook';
import {ResourceBundle} from './resource-bundle';
import {stringIsEmptyOrUndefined} from './utils';
import {AjaxTextureLoader} from './ajax-texture-loader';

// import {GLTFLoader2} from './GLTFLoader2';

interface ILoadingRecord {
  readonly loaded: number;
  readonly total: number;
}

export class ResourseBundleLoader<TData = void> {
  public readonly progress: Observable<number>;
  public readonly complete: Observable<ResourceBundle<TData>>;

  private readonly progressSubject: BehaviorSubject<number>;
  private readonly isLoadingSubject: BehaviorSubject<boolean>;
  private readonly completeSubject: Subject<ResourceBundle<TData>>;

  private readonly loadingManager: THREE.LoadingManager;
  private initialData: TData;

  private readonly fileDict: { [url: string]: string } = {};
  private readonly gltfMeshDict: { [url: string]: GLTF } = {};
  private readonly textureDict: { [url: string]: THREE.Texture } = {};
  private readonly loadingDict: { [url: string]: ILoadingRecord } = {};

  private _bundle: ResourceBundle<TData>;

  private _isFailed = false;
  private _isLoaded = false;
  private _error: string[] = [];

  constructor(private readonly resourceBook: ResourceBook) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);

    this.progressSubject = new BehaviorSubject<number>(0);
    this.progress = this.progressSubject.asObservable();

    this.completeSubject = new Subject<ResourceBundle<TData>>();
    this.complete = this.completeSubject.asObservable();

    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onError = url => this.onLoadError(url);
    this.loadingManager.onLoad = () => this.onLoadSuccess();

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // console.log(
      //   "Loading file: " +
      //     url +
      //     ".\nLoaded " +
      //     itemsLoaded +
      //     " of " +
      //     itemsTotal +
      //     " files."
      // );
    };
  }

  public get isFailed(): boolean {
    return this._isFailed;
  }

  public get isLoading(): boolean {
    return this.isLoadingSubject.value;
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  public get error(): string[] {
    return this._error;
  }

  public get bundle(): ResourceBundle<TData> {
    if (!this._isLoaded)
      throw new Error('bundle is not loaded');

    return this._bundle;
  }

  private detectTypeAndLoad = (url: string, dracoLoader: DRACOLoader) => {
    const extension = url.split('.').pop();

    if (extension === 'jpg' || extension === 'png') {
      this.loadTexture(url);
    } else if (extension === 'glb' || extension === 'gltf') {
      this.loadMesh(url, dracoLoader);

    } else {
      console.error(`Cannot load main artefact, missing extension ${extension} in SectorLoader!`);
    }
  };

  public load(): void {
    if (this._isLoaded) {
      console.warn(`Sector-loader load method should be called only once`);
      return;
    }

    if (this.isLoaded) {
      console.warn(`Sector-loader contents are already loaded`);
      return;
    }

    if (this.resourceBook.isEmpty) {
      this.progressSubject.next(1);
      this.onLoadSuccess();
      return;
    }

    this._isLoaded = true;
    this.progressSubject.next(0);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./assets/libs/draco/');


    this.resourceBook.meshUrls.forEach(meshUrl => {
      this.detectTypeAndLoad(meshUrl, dracoLoader);
    });

    this.resourceBook.textureUrls.forEach(url => {
      this.detectTypeAndLoad(url, dracoLoader);
    });

    this.resourceBook.fileUrls.forEach(url => {
      this.loadFile(url);
    });

    if (!stringIsEmptyOrUndefined(this.resourceBook.dataUrl)) {
      const fileLoader = new THREE.FileLoader(this.loadingManager);

      fileLoader.setResponseType('json');

      fileLoader.load(
        this.resourceBook.dataUrl,
        (response: any) => (this.initialData = response),
        e => this.onLoadingProgress(this.resourceBook.dataUrl, e)
      );
    }
  }

  private loadFile(url: string): void {
    const fileLoader = new THREE.FileLoader(this.loadingManager);
    fileLoader.setResponseType('blob');

    fileLoader.load(
      url,
      (t: any) => this.onFileLoad(url, t),
      e => this.onLoadingProgress(url, e)
    );
    // console.log(`${url} added to LoadingManager`);
  };

  private loadTexture = (url: string) => {
    const textureLoader = new AjaxTextureLoader(this.loadingManager);

    textureLoader.loadAsync(
      url,
      t => this.textureLoaded(url, t),
      e => this.onLoadingProgress(url, e)
    );
    // console.log(`${url} added to LoadingManager`);
  };

  private loadMesh = (meshUrl: string, dracoLoader: DRACOLoader) => {
    const meshLoader = new GLTFLoader(this.loadingManager);
    meshLoader.setDRACOLoader(dracoLoader);

    meshLoader.load(
      meshUrl,
      gltf => this.onMeshLoad(meshUrl, gltf),
      e => this.onLoadingProgress(meshUrl, e)
    );
    // console.log(`${meshUrl} added to LoadingManager`);
  };

  private readonly textureLoaded = (url: string, texture: THREE.Texture) => {
    this.textureDict[url] = texture;
  };

  private onMeshLoad(url: string, gltf: GLTF): void {
    this.gltfMeshDict[url] = gltf;
  }

  private onFileLoad(url: string, blob: Blob): void {

    if (url.indexOf('svg') >= 0) {
      // перезапишем mime
      blob = blob.slice(0, blob.size, 'image/svg+xml');
    }

    const objUrl = URL.createObjectURL(blob);
    this.fileDict[url] = objUrl;
  }

  private onLoadingProgress = (url: string, e: ProgressEvent): void => {
    let total = e.total;

    if (total === 0) {
      if (url.indexOf('lofoscene.glb') >= 0)
        total = 7456348;
      else
        total = e.loaded + 1;

      console.log(`${url} loaded: ${e.loaded}  total: ${e.total} fixed => ${total}`);
    } else {
      total = e.total;
      console.log(`${url} loaded: ${e.loaded}  total: ${e.total}`);
    }

    this.loadingDict[url] = {loaded: e.loaded, total: total};

    const itemProgressMax = 1 / this.resourceBook.urlCount;

    let progress = 0;

    for (const key in this.loadingDict) {
      if (!this.loadingDict.hasOwnProperty(key)) continue;

      const record = this.loadingDict[key];
      const itemProgress = (record.loaded / record.total) * itemProgressMax;


      progress += itemProgress;
    }

    progress = 0;

    for (const key in this.loadingDict) {
      if (!this.loadingDict.hasOwnProperty(key)) continue;

      const record = this.loadingDict[key];
      const itemProgress = (record.loaded / record.total) * itemProgressMax;

      progress += itemProgress;
    }

    this.progressSubject.next(progress);
  };

  private onLoadError = (url: string) => {
    this._isFailed = true;
    this._error.push(`There was an error loading ${url}.`);

    console.error(this._error);
  };

  private onLoadSuccess = () => {
    this._isLoaded = true;
    this._bundle = new ResourceBundle(
      this.fileDict,
      this.gltfMeshDict,
      this.textureDict,
      this.initialData,
    );
    this.completeSubject.next(this._bundle);
  };
}
