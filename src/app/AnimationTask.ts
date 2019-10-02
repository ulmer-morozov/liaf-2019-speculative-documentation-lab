
const allowedMaterials = [
    'MeshBasicMaterial',
    'MeshStandardMaterial',
    'MeshLambertMaterial'
];

export class AnimationTask {
    private readonly material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | THREE.MeshLambertMaterial;
    private readonly initialOpacity: number;

    private readonly initialTransparency: boolean;

    constructor
        (
            private readonly mesh: THREE.Mesh,
            private readonly targetOpacity: number,
            private readonly startTime: number,
            private readonly duration: number
        ) {

        if (Array.isArray(mesh.material) || !allowedMaterials.includes(mesh.material.type))
            throw new Error(`MenuLink mesh should have ${allowedMaterials} as material. Current material is ${mesh.material}`);

        this.material = mesh.material as any;

        if (this.mesh.visible === false) {
            // debugger;
            this.material.opacity = 0;
            this.mesh.visible = true;
        }

        this.initialOpacity = this.material.opacity;

        this.initialTransparency = this.material.transparent;
        this.material.transparent = true;
    }

    public update(time: number): boolean {

        if (this.material.opacity === this.targetOpacity) {
            this.material.transparent = this.initialTransparency;
            return true;
        }

        const delta = time - this.startTime;


        let t = delta / this.duration;

        if (t > 1)
            t = 1;

        // console.log(`t ${t}`);

        const newOpacity = this.initialOpacity + (this.targetOpacity - this.initialOpacity) * Math.pow(t, 2);

        this.material.opacity = Math.round(1000 * newOpacity) / 1000;

        return false;
    }
}
