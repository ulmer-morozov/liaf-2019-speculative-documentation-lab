import { MenuLink } from './MenuLink';
import { FrameParams } from './frameParams';
import * as THREE from 'three';

export class MenuGroup {

  private readonly colliders: THREE.Mesh[] = [];
  private readonly intersections: THREE.Intersection[] = [];
  private readonly colliderDict: { [id: string]: MenuLink } = {};

  constructor(public readonly links: ReadonlyArray<MenuLink>) {
    links.forEach(link => {
      this.colliders.push(link.collider);
      this.colliderDict[link.collider.uuid] = link;
    });
  }

  public updateSelected(frame: FrameParams): void {

    for (let i = 0; i < this.links.length; i++) {
      const link = this.links[i];

      if (link.disabled)
        continue;

      this.intersections.splice(0, this.intersections.length);
      frame.raycaster.intersectObject(link.collider, false, this.intersections);

      const intersected = this.intersections.length > 0;
      link.updateSelected(intersected, frame.time, frame.mouse.leftBtn);
    }

  }

  public setOnClick(onClick: (link: MenuLink) => void) {
    this.links.forEach(x => x.onClick = onClick);
  }

  public reset() {
    this.links.forEach(x => x.reset());
  }
}
