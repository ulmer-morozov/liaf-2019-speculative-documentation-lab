import * as THREE from 'three';

export abstract class GltfProcessor<T = any> {
    private isProcessed = false;

    public abstract analyse(object: THREE.Object3D): void;

    protected abstract processInternal(): void;
    protected abstract getResultInternal(): T;

    constructor(public readonly name: string) {

    }

    public process(): void {
        this.processInternal();

        this.isProcessed = true;
    }

    public getResult(): T {
        if (!this.isProcessed)
            throw new Error('Cannot give result because GltpProcessor.process() wasnt called');

        return this.getResultInternal();
    }

    protected isMeshRef(obj: THREE.Object3D): boolean {
        const res = obj.type === 'Mesh' && obj.name.endsWith('_ref');
        return res;
    }

    protected getNameSegments(obj: THREE.Object3D): ReadonlyArray<string> {
        const nameArray = obj.name.split(/[_\.]+/);
        return nameArray;
    }

    protected getGenericName(obj: THREE.Object3D): string {
        const segments = this.getNameSegments(obj);
        const name = segments[0];
        return name;
    }

    protected nameContains(obj: THREE.Object3D, parts: ReadonlyArray<string>) {
        for (const namePart of parts) {
            if (!obj.name.includes(namePart))
                return false;
        }

        return true;
    }
}
