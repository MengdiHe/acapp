class Particle extends AcGameObject {
    constructor(playground, x, y, angle, radius, color, speed, move_length) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.eps = 0.01;
        this.friction = 0.9;
    }

    start() {
    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            console.log("destroyii");
            this.destroy();
            return false;
        }
        let moved = Math.min(this.move_length, this.timedelta * this.speed / 1000);
        this.x += moved * Math.cos(this.angle);
        this.y += moved * Math.sin(this.angle);
        console.log("here %f %f %f", this.move_length, moved, this.speed * this.timedelta / 1000);
        this.move_length -= moved;
        this.speed *= this.friction;
        this.render();
    }

    render() {
        let scale = this.playground.scale;
        console.log(scale, this.x, this.y, this.radius);
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
