import * as THREE from 'three/src/Three';

export const isNotDefined = (someObject: any): boolean => {
  return someObject === undefined || someObject === null;
};

export const stringIsEmptyOrUndefined = (someString: string): boolean => {
  return isNotDefined(someString) || someString.trim().length === 0;
};

export const isDefined = (someValue: any): boolean => {
  return typeof someValue !== 'undefined' && someValue !== null;
};

export function toArray<T>(dict: { [id: string]: T }): ReadonlyArray<T> {
  const objects: T[] = [];

  // debugger

  for (const key in dict) {
    if (!dict.hasOwnProperty(key))
      continue;

    const object = dict[key];
    objects.push(object);
  }

  return objects;
}

export function getFirstMaterial(mesh: THREE.Mesh): THREE.Material {
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
}
