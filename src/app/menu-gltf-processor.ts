import * as THREE from 'three';
import { GltfProcessor } from './gltf-processor';
import { MenuLink } from './MenuLink';
import { MenuGroup } from './MenuGroup';

export class MenuGltfProcessor extends GltfProcessor<MenuGroup> {
  public static readonly NAME: string = 'MenuGltfProcessor';

  private readonly meshes: THREE.Mesh[] = [];
  private menuGroup: MenuGroup;

  constructor() {
    super(MenuGltfProcessor.NAME);
  }

  public analyse(obj: THREE.Object3D): void {
    if (obj.type !== 'Mesh' || !obj.name.includes('_link') || obj.name.includes('man'))
      return;

    // console.log(obj.name);
    this.meshes.push(obj as THREE.Mesh);
  }

  protected processInternal() {
    const links = this.meshes.map(x => {
      x.material = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true
      });

      const link = new MenuLink(x);
      return link;
    });

    this.menuGroup = new MenuGroup(links);
  }

  protected getResultInternal(): MenuGroup {
    return this.menuGroup;
  }
}
