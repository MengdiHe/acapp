class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, is_me) {
        super();
        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.damage_speed = 0;
        this.damage_angle = 0;
        this.move_length = 0;
        this.radius = radius;
        this.color = color;
        this.speed = speed;
        this.skill = null;
        this.is_me = is_me;
        this.eps = 0.1;
        this.img = new Image();
        this.img.src = this.playground.root.settings.photo;
        this.friction = 0.9;
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });
        if (this.is_me === true) {
            this.playground.game_map.$canvas.mousedown(function(e) {
            const rect = outer.ctx.canvas.getBoundingClientRect();
                if (e.which === 3) {
                    outer.move_to(e.clientX - rect.left, e.clientY - rect.top);
                } else if (e.which == 1) {
                    if (outer.skill != null) {
                        outer.shoot_skill(e.clientX - rect.left, e.clientY - rect.top);
                        outer.skill = null;
                    }
                }
            });

            $(window).keydown(function(e) {
                if (e.which === 81) { // q
                    outer.skill = "fireball";
                    return false;
                }
            })
        }
    }

    shoot_skill(tx, ty) {
        let dx = tx - this.x;
        let dy = ty - this.y;
        let angle = Math.atan2(dy, dx);
        let radius = this.playground.height * 0.01;
        let speed = this.playground.height * 0.5;
        let move_length = this.playground.height * 1;
        let color = "orange";
        new FireBall(this.playground, this, this.x, this.y, angle, radius, color, speed, move_length, this.playground.height * 0.01);
    }

    get_dist(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return Math.sqrt(dx * dx + dy * dy);
    }

    move_to(tx, ty) {
        this.move_length = this.get_dist(this.x, this.y, tx, ty);
        let angle = Math.atan2(ty - this.y, tx - this.x);
        this.vx = Math.cos(angle);
        this.vy = Math.sin(angle);
    }

    is_attacked(damage, angle) {
        for (let i = 0; i < 10 + Math.random() * 5; i++) {
            let x = this.x, y = this.y;
            let angle = Math.random() * Math.PI * 2;
            let radius = this.radius * 0.2;
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * 5 * Math.random();
            new Particle(this.playground, x, y, angle, radius, color, speed, move_length);
        }

        this.radius -= damage;
        if (this.radius <= 10) {
            this.destroy();
            return false;
        }

        this.damage_speed = damage * 100;
        this.damage_angle = angle;
    }

    update() {
        if (!this.is_me && Math.random() < this.timedelta / 5000 )
        {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            if (this !== player) {
                this.shoot_skill(player.x, player.y);
            }
        }

        if (this.damage_speed > 10) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_speed * this.timedelta / 1000 * Math.cos(this.damage_angle);
            this.y += this.damage_speed * this.timedelta / 1000 * Math.sin(this.damage_angle);
            this.damage_speed *= this.friction;
        } else {

            if (this.move_length < this.eps) {
                if (this.is_me === false) {
                    let tx = this.playground.width * Math.random();
                    let ty = this.playground.height * Math.random();
                    this.move_to(tx, ty);
                } else {
                    this.vx = 0;
                    this.vy = 0;
                    this.move_length = 0;
                }
            } else {
                let moved = Math.min(this.move_length, this.speed * this.timedelta / 1000);
                this.x += this.vx * moved;
                this.y += this.vy * moved;
                this.move_length -= moved;
            }
        }
        this.render();
    }

    render() {
        if (this.is_me) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, 
                               this.radius * 2, this.radius * 2);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0,Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }
    }

    on_destroy() {
        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                console.log("hmd!");
                this.playground.players.splice(i, 1);
            }
        }
    }
}