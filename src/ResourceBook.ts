import {isDefined, stringIsEmptyOrUndefined} from './utils';

interface IResourceBook {
  dataUrl?: string;
  meshUrl?: string;
  meshUrls?: ReadonlyArray<string>;
  textureUrl?: string;
  textureUrls?: ReadonlyArray<string>;
  fileUrls?: ReadonlyArray<string>;
}

export class ResourceBook {
  public readonly dataUrl: string;
  public readonly meshUrls: ReadonlyArray<string>;
  public readonly textureUrls: ReadonlyArray<string>;
  public readonly fileUrls: ReadonlyArray<string>;

  public readonly urlCount: number;

  constructor(data: IResourceBook = {}) {
    this.meshUrls = isDefined(data.meshUrls) ? data.meshUrls : [];
    this.textureUrls = isDefined(data.textureUrls) ? data.textureUrls : [];
    this.dataUrl = isDefined(data.dataUrl) ? data.dataUrl : '';
    this.fileUrls = isDefined(data.fileUrls) ? data.fileUrls : [];

    if (isDefined(data.meshUrl))
      this.meshUrls = this.meshUrls.concat([data.meshUrl]);

    if (isDefined(data.textureUrl))
      this.textureUrls = this.textureUrls.concat([data.textureUrl]);

    const dataUrlQty = stringIsEmptyOrUndefined(this.dataUrl) ? 0 : 1;
    this.urlCount = this.meshUrls.length + this.textureUrls.length + this.fileUrls.length + dataUrlQty;
  }

  public get isEmpty(): boolean {
    return this.urlCount === 0;
  }
}
