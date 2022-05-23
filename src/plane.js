import * as THREE from "three";
import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";

const lerp = (current, target, speed = 0.1, limit = 0.001) => {
    let change = (target - current) * speed;
    if (Math.abs(change) < limit) {
      change = target - current;
    }
    return change;
}

export class Planes {
    constructor(sceneManager, images) {
        this.sceneManager = sceneManager;
        this.images = images;
        this.textures = [];
        this.meshes = [];

        this.hovering = -1;//hoverしてる画像のindex番号

        this.loadAssets();
    }

    loadAssets() {
        for(let i = 0; i < this.images.length; i++) {
            this.textures.push(new THREE.TextureLoader().load(this.images[i]));
        }
    }

    init() {
        let { width, height } = this.sceneManager.getViewSize();
        const planeMetrics = this.getPlaneMetrics(width, height);
        const geometry = new THREE.PlaneBufferGeometry(
            planeMetrics.planeWidth,
            planeMetrics.planeHeight,
            1,1
        );

        let translateToLeft = -width / 2 + planeMetrics.planeWidth / 2;
        let x = translateToLeft + planeMetrics.x;

        
        for (let i = 0; i < 3; i++) {
            let texture = this.textures[i];
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uZoom: new THREE.Uniform(0),
                    uZoomDelta: new THREE.Uniform(0.03),
                    uPlaneSize: new THREE.Uniform(new THREE.Vector2(planeMetrics.planeWidth, planeMetrics.planeHeight)),
                    uImage: new THREE.Uniform(texture),
                    uImageSize: new THREE.Uniform(new THREE.Vector2(854, 1280)),
                    uMouse: new THREE.Uniform(new THREE.Vector2(0, 0))
                },
                fragmentShader,
                vertexShader
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.x = x + i * planeMetrics.planeWidth;
            mesh.userData.index = i;
            this.meshes.push(mesh);
            this.sceneManager.scene.add(mesh);
        }
    }

    onMouseMove(ev) {
        const raycaster = this.sceneManager.raycaster;
        const intersections = raycaster.intersectObjects(this.meshes);
        if(intersections.length > 0) {
            const intersection = intersections[0];
            const index = intersection.object.userData.index;
            this.meshes[index].material.uniforms.uMouse.value.set(
                intersection.uv.x,
                intersection.uv.y
            );
            this.hovering = index;
        } else {
            this.hovering = -1;
        }
    }

    getPlaneMetrics(viewWidth, viewHeight) {
        return {
            planeWidth: viewWidth / 3,
            planeHeight: viewHeight,
            x: 0
        };
    }

    update() {
        const meshes = this.meshes;
        for (let i = 0; i < 3; i++) {
            const zoomTarget = this.hovering === i ? 1 : 0;
            const uZoom = meshes[i].material.uniforms.uZoom;

            const zoomChange = lerp(uZoom.value, zoomTarget, 0.1, 0.01);
            uZoom.value += zoomChange;
            uZoom.needsUpdate = true;
        }
    }
}