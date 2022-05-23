import * as THREE from "three";
import { waterTexture } from "./waterTexture";
import postFragment from "./shader/postprocessing/fragment.glsl";
import postVertex from "./shader/postprocessing/vertex.glsl";
import fragment from "./shader/fragment.glsl";
import vertex from "./shader/vertex.glsl";

import grain from "./img/grain.webp";
import gradation1 from "./img/gradation1.png";
import gradation2 from "./img/gradation2.png";

class App {
    constructor() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.clock = new THREE.Clock();

        this.raycaster = new THREE.Raycaster();
        this.hitObjects = [];
        
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.z = 50;

        this.scene = new THREE.Scene();
        this.postScene = new THREE.Scene();
        this.scene.background = new THREE.Color("#161624");

        this.basePlane();

        document.body.append(this.renderer.domElement);

        
        this.waterTexture = new waterTexture();
        this.postProcessing();
        
        this.tick = this.tick.bind(this);
        this.init();
    }

    init() {

        window.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.tick();
    }

    onMouseMove(ev) {
        const raycaster = this.raycaster;
        this.mouse = {
            x: ev.clientX / window.innerWidth,
            y: 1 - (ev.clientY / window.innerHeight)
        }

        this.waterTexture.addPoints(this.mouse);

        raycaster.setFromCamera(
            {
                x: (ev.clientX / window.innerWidth) * 2 - 1,
                y: -(ev.clientY / window.innerHeight) * 2 + 1,
            },
            this.camera
        );
    }

    basePlane() {
        let { width, height } = this.getViewSize();
        this.baseGeometry = new THREE.PlaneBufferGeometry(
            width,
            height,
            1,1
        );
        this.baseMaterial = new THREE.ShaderMaterial({
            uniforms: {
                detail: { value: 0.45 },
                seed: { value: Math.random() },
                grainTexure: { value: new THREE.TextureLoader().load(grain) },
                gradationTexture1: { value: new THREE.TextureLoader().load(gradation1) },
                gradationTexture2: { value: new THREE.TextureLoader().load(gradation2) },
                uTime: { value: this.time },
                spuit: { value: new THREE.Vector3(0.625, .1875, 0.0) }
            },
            fragmentShader: fragment,
            vertexShader: vertex
        });
        const baseMash = new THREE.Mesh(this.baseGeometry, this.baseMaterial);
        this.scene.add(baseMash);
    }

    postProcessing() {
        this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth,window.innerHeight,{
            depthBuffer: false,
            stencilBuffer: false,
            magFilter: THREE.NearestFilter,
            minFilter: THREE.NearestFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping
        });
        let { width, height } = this.getViewSize();
        const postGeometry = new THREE.PlaneBufferGeometry(
            width,
            height,
            1,1
        );
        const postMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uRenderTexture: { value: this.renderTarget.texture },
                uRippleTexture: { value: this.waterTexture.texture },
            },
            fragmentShader: postFragment,
            vertexShader: postVertex,
        });
        const postMesh = new THREE.Mesh(postGeometry, postMaterial);
        this.postScene.add(postMesh);
    }

    getViewSize() {
        const fovInRadian = (this.camera.fov * Math.PI) / 180;
        const height = Math.abs(this.camera.position.z * Math.tan(fovInRadian / 2) * 2);

        return {
            width: height * this.camera.aspect,
            height
        }
    }

    render() {
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
    
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.camera);
    }

    tick() {
        this.time = this.clock.getElapsedTime();
        this.baseMaterial.uniforms.uTime.value = this.time;

        this.waterTexture.update();
        this.render();

        requestAnimationFrame(this.tick);
    }
}

window.addEventListener("DOMContentLoaded", () => {
    new App();
})