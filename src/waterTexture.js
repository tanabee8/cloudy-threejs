import * as THREE from "three";

const easeOutSine = (t, b, c, d) => {
    return c * Math.sin((t / d) * (Math.PI / 2)) + b;
};
  
const easeOutQuad = (t, b, c, d) => {
    t /= d;
    return -c * t * (t - 2) + b;
};

export class waterTexture {
    constructor() {
        this.size = 64;
        this.maxAge = 64;
        this.points = [];
        this.width = this.size;
        this.height = this.size;
        this.radius = this.size * 0.1;

        this.initTexture();

        // document.body.append(this.canvas);
    }

    initTexture() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "waterTexture";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext("2d");

        this.texture = new THREE.Texture(this.canvas);

        this.clear();
    }

    addPoints(point) {
        let force = 0;
        let ux = 0;//unit vector
        let uy = 0;

        const last = this.last;
        
        if(last) {
            const relativeX = point.x - last.x;
            const relativeY = point.y - last.y;

            const distanceSquared = relativeX * relativeX + relativeY * relativeY;
            const distance = Math.sqrt(distanceSquared);

            ux = relativeX / distance;
            uy = relativeY / distance;

            force = Math.min(distanceSquared * 10000 ,1);
        }

        this.last = {
            x: point.x,
            y: point.y
        }

        this.points.push({
            x: point.x,
            y: point.y,
            age: 0,
            force,
            ux,
            uy
        });
    }

    update() {
        this.clear();

        this.texture.needsUpdate = true;

        this.points.forEach((point, i) => {
            let slowAsOlder = 1 - (point.age / this.maxAge);
            let force = point.force * slowAsOlder * 0.01;
            point.x += point.ux * force;
            point.y += point.uy * force;

            point.age += 1;

            if(point.age > this.maxAge) {
                this.points.splice(i, 1);
            }
        });

        this.points.forEach((point) => {
            this.drawPoint(point);
        })
    }

    clear() {
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawPoint(point) {

        let pos = {
            x: point.x * this.width,
            y: (1 - point.y) * this.height
        }

        let offset = this.width * 2;
        // let intensity = 1 - (point.age / this.maxAge);
        let intensity = 1;

        if(point.age < this.maxAge * 0.3) {
            intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1);
        } else {
            intensity = easeOutQuad(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7), 0, 1, 1);
            // console.log((point.age - this.maxAge * 0.3) / (this.maxAge * 0.7));
        }
        intensity *= point.force;

        let red = ((point.ux + 1) / 2) * 255;
        let green = ((point.uy + 1) / 2) * 255;
        let blue = intensity * 255;
        let color = `${red}, ${green}, ${blue}`;

        this.ctx.shadowColor = `rgba(${color}, ${intensity * 0.2})`;
        this.ctx.shadowBlur = this.radius;
        this.ctx.shadowOffsetX = offset;
        this.ctx.shadowOffsetY = offset;
        
        this.ctx.beginPath();
        this.ctx.arc(pos.x - offset, pos.y - offset, this.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
}