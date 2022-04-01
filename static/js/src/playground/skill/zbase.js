class FireBall extends AcGameObject {
    constructor(playground, player, x, y, angle, radius, color, speed, move_length, damage) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.player = player;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.move_length = move_length;
        this.damage = damage;
        this.eps = 0.01;
    }

    start() {
    }

    get_distance(x1, x2, y1, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    is_collision(player) {
        let dis = this.get_distance(this.x, player.x, this.y, player.y);
        if (dis < this.radius + player.radius) {
            return true;
        } else {
            return false;
        }
    }

    attack(damage, player) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let angle = Math.atan2(dy, dx);
        player.is_attacked(damage, angle);

        if (this.playground.mode === "multi mode") {
            this.playground.mps.send_attack(player.uuid, player.x, player.y, angle, damage, this.uuid);
        }
    }

    update() {
        this.update_move();
        if (this.player.character !== "enemy") {
            this.update_attack();
        }

        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        }

        this.render();
    }

    update_move() {
        let moved = Math.min(this.move_length, this.timedelta * this.speed / 1000);
        this.x += moved * Math.cos(this.angle);
        this.y += moved * Math.sin(this.angle);
        this.move_length -= moved;
    }

    update_attack() {
        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (player !==  this.player && this.is_collision(player)) {
                this.attack(this.damage, player);
                this.destroy();
                break;
            }
        }
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }

    on_destroy() {
        let fireballs = this.player.fireballs;
        for (let i = 0; i < fireballs.length; i++) {
            if (fireballs[i] === this) {
                fireballs.splice(i, 1);
                break;
            }
        }
    }
}
