class Player extends AcGameObject {
    constructor(playground, x, y, radius, color, speed, character, username, photo) {
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
        this.character = character;
        this.username = username;
        this.photo = photo;
        this.eps = 0.01;
        this.fireballs = [];
        this.img = new Image();
        this.img.src = this.photo;
        this.friction = 0.9;

        if (this.character === "me") {
            this.fireball_coldtime = 5;  // 单位：秒
            this.fireball_img = new Image();
            this.fireball_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.blink_coldtime = 5;  // 单位：秒
            this.blink_img = new Image();
            this.blink_img.src = "https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start() {
        this.playground.player_count++;
        this.playground.notice_board.write("已就绪: " + this.playground.player_count + "人");
        if (this.playground.player_count >= 3) {
            this.playground.state = "fighting";
            this.playground.notice_board.write("Fighting!");
        }

        if (this.character === "me") {
            this.add_listening_events();
        } else if (this.character === "robot"){
            let tx = Math.random() * this.playground.width / this.playground.scale;
            let ty = Math.random() * this.playground.height / this.playground.scale;
            this.move_to(tx, ty);
        }
    }

    add_listening_events() {
        let outer = this;
        this.playground.game_map.$canvas.on("contextmenu", function() {
            return false;
        });
        if (this.character === "me") {
            this.playground.game_map.$canvas.mousedown(function(e) {
                if (outer.playground.state !== "fighting")
                    return true;

                const rect = outer.ctx.canvas.getBoundingClientRect();
                if (e.which === 3) {
                    let tx = (e.clientX - rect.left) / outer.playground.scale;
                    let ty = (e.clientY - rect.top) / outer.playground.scale;
                    outer.move_to(tx, ty);

                    if (outer.playground.mode === "multi mode") {
                        outer.playground.mps.send_move_to(tx, ty);
                    }
                } else if (e.which == 1) {
                    let tx = (e.clientX - rect.left) / outer.playground.scale;
                    let ty = (e.clientY - rect.top) / outer.playground.scale;
                    if (outer.skill) {
                        if (outer.skill === "fireball") {
                            if (outer.fireball_coldtime > outer.eps) {
                                return false;
                            }
                            let fireball = outer.shoot_fireball(tx, ty);

                            if (outer.playground.mode === "multi mode") {
                                outer.playground.mps.send_shoot_fireball(tx, ty, fireball.uuid);
                            }
                            outer.fireball_coldtime = 5;
                        } else if (outer.skill === "blink"){
                             if (outer.blink_coldtime > outer.eps) {
                                return false;
                             }
                             outer.blink(tx, ty);
                             if (outer.playground.mode === "multi mode") {
                                outer.playground.mps.send_blink(this.uuid, tx, ty);
                             }
                             outer.blink_coldtime = 5;
                        }

                        outer.skill = null;
                    }
                }
            });

            this.playground.game_map.$canvas.keydown(function(e) {
                if (e.which === 13) {
                    if (outer.playground.mode === "multi mode") {
                        outer.playground.chat_field.show_input();
                        return false;
                    }
                } else if (e.which === 27) {
                    if (outer.playground.mode === "multi mode") {
                        outer.playground.chat_field.hide_input();
                        return false;
                    }
                }
                if (outer.playground.state !== "fighting")
                    return true;

                if (e.which === 81) { // q
                    if (outer.fireball_coldtime > outer.eps) {
                        return true;
                    }
                    outer.skill = "fireball";
                    return false;
                }

                if (e.which === 70) { // f闪现
                    if (outer.blink_coldtime > outer.eps) {
                        return true;
                    }

                    outer.skill = "blink";
                    return false;
                }
            })
        }
    }

    blink(tx, ty) {
        let angle = Math.atan2(ty - this.y, tx - this.x);
        let dist = this.get_dist(tx, ty, this.x, this.y);
        dist = Math.min(dist, 0.8);

        this.x += dist * Math.cos(angle);
        this.y += dist * Math.sin(angle);
        this.move_length = 0;
    }

    shoot_fireball(tx, ty) {
        let dx = tx - this.x;
        let dy = ty - this.y;
        let angle = Math.atan2(dy, dx);
        let radius = 0.01;
        let speed = 0.5;
        let move_length = 1;
        let color = "orange";
        let fireball = new FireBall(this.playground, this, this.x, this.y, angle, radius, color, speed, move_length, 0.01);
        this.fireballs.push(fireball);

        return fireball;
    }

    destroy_fireball(uuid) {
        for (let i = 0; i < this.fireballs.length; i++) {
            if (this.fireballs[i].uuid === uuid) {
                this.fireballs[i].destroy();
                break;
            }
        }
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
        for (let i = 0; i < 20 + Math.random() * 10; i++) {
            let x = this.x, y = this.y;
            let angle = Math.random() * Math.PI * 2;
            let radius = this.radius * Math.random() * 0.1;
            let color = this.color;
            let speed = this.speed * 10;
            let move_length = this.radius * 5 * Math.random();
            new Particle(this.playground, x, y, angle, radius, color, speed, move_length);
        }

        this.radius -= damage;
        if (this.radius <= this.eps) {
            this.destroy();
            return false;
        }

        this.damage_speed = damage * 100;
        this.damage_angle = angle;
    }

    update_move() {
        if (this.character === "robot" && Math.random() < this.timedelta / 5000 )
        {
            let player = this.playground.players[Math.floor(Math.random() * this.playground.players.length)];
            if (this !== player) {
                this.shoot_fireball(player.x, player.y);
            }
        }

        if (this.damage_speed > this.eps) {
            this.vx = this.vy = 0;
            this.move_length = 0;
            this.x += this.damage_speed * this.timedelta / 1000 * Math.cos(this.damage_angle);
            this.y += this.damage_speed * this.timedelta / 1000 * Math.sin(this.damage_angle);
            this.damage_speed *= this.friction;
        } else {

            if (this.move_length < this.eps) {
                if (this.character === "robot") {
                    let tx = this.playground.width / this.playground.scale * Math.random();
                    let ty = this.playground.height / this.playground.scale * Math.random();
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
    }

    update_skill_coldtime() {
        this.fireball_coldtime -= this.timedelta / 1000;
        this.fireball_coldtime = Math.max(this.fireball_coldtime, 0);
        this.blink_coldtime -= this.timedelta / 1000;
        this.blink_coldtime = Math.max(this.blink_coldtime, 0);
    }

    update() {
        this.update_move();
        if (this.character === "me" && this.playground.state === "fighting")
            this.update_skill_coldtime();
        this.render();
    }

    render() {
        let scale = this.playground.scale;
        if (this.character === "me" || this.character === "enemy") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius) * scale, (this.y - this.radius) * scale, 
                this.radius * 2 * scale, this.radius * 2 * scale);
            this.ctx.restore();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0,Math.PI * 2, false);
            this.ctx.fillStyle = this.color;
            this.ctx.fill();
        }

        if (this.character === "me" && this.playground.state === "fighting") {
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime() {
        let scale = this.playground.scale;
        let x = 1.5, y = 0.9, r = 0.04;

        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.fireball_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.fireball_coldtime / 5) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }

        x = 1.62, y = 0.9, r = 0.04;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x * scale, y * scale, r * scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.blink_img, (x - r) * scale, (y - r) * scale, r * 2 * scale, r * 2 * scale);
        this.ctx.restore();

        if (this.blink_coldtime > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * scale, y * scale);
            this.ctx.arc(x * scale, y * scale, r * scale, 0 - Math.PI / 2, Math.PI * 2 * (1 - this.blink_coldtime / 5) - Math.PI / 2, true);
            this.ctx.lineTo(x * scale, y * scale);
            this.ctx.fillStyle = "rgba(0, 0, 255, 0.6)";
            this.ctx.fill();
        }
    }


    on_destroy() {
        if (this.character === "me") {
            this.playground.state = "over";
            this.playground.notice_board.write("You lose!!!");
        }

        for (let i = 0; i < this.playground.players.length; i++) {
            if (this.playground.players[i] === this) {
                this.playground.players.splice(i, 1);
                break;
            }
        }
    }
}
