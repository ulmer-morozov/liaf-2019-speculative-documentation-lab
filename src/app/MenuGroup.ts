import { MenuLink } from './MenuLink';
import { FrameParams } from './frameParams';

export class MenuGroup {

  constructor(public readonly links: ReadonlyArray<MenuLink>) {
  }

  public updateSelected(frame: FrameParams): void {
    this.links.forEach(x => x.updateSelected(frame));
  }

  public setOnClick(onClick: (link: MenuLink) => void) {
    this.links.forEach(x => x.onClick = onClick);
  }

  public reset() {
    this.links.forEach(x => x.reset());
  }
}
