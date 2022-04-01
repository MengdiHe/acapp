class AcGameMenu {
    constructor(root) {
        this.root = root;
        this.$menu = $(`
<div class="ac-game-menu">
    <div class="ac-game-menu-field">
        <div class="ac-game-menu-field-item ac-game-menu-field-item-single-mode">
            单人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-multi-mode">
            多人模式
        </div>
        <br>
        <div class="ac-game-menu-field-item ac-game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
`);
        this.$menu.hide();
        this.root.$ac_game.append(this.$menu);
        this.$single_mode = this.$menu.find('.ac-game-menu-field-item-single-mode');
        this.$multi_mode = this.$menu.find('.ac-game-menu-field-item-multi-mode');
        this.$settings = this.$menu.find('.ac-game-menu-field-item-settings');
        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show("single mode");
        });
        this.$multi_mode.click(function() {
            outer.hide();
            outer.root.playground.show("multi mode");
        })
        this.$settings.click(function() {
            outer.root.settings.logout_on_remote();
        })
    }

    show() {
        this.$menu.show();
    }

    hide() {
        this.$menu.hide();
    }
}
let AC_GAME_OBJECTS = [];

class AcGameObject {
    constructor() {
        AC_GAME_OBJECTS.push(this);

        this.has_called_start = false;
        this.timedelta = 0;
        this.uuid = this.create_uuid();
    }

    create_uuid() {
        let res = "";
        for (let i = 0; i < 8; i++) {
            let x = parseInt(Math.floor(Math.random() * 10));
            res += x;
        }

        return res;
    }

    start() { // 只会在第一帧执行一次
    }

    update() { // 每一帧均会执行
    }

    on_destroy(){
    }

    destroy() { // 删掉该物体
        this.on_destroy();

        for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
            if (AC_GAME_OBJECTS[i] == this) {
                AC_GAME_OBJECTS.splice(i, 1);
                break;
            }
        }
    }


}

let last_timestamp;
let AC_GAME_ANIMATION = function(timestamp) {
    for (let i = 0; i < AC_GAME_OBJECTS.length; i++) {
        let obj = AC_GAME_OBJECTS[i];
        if (!obj.has_called_start) {
            obj.start();
            obj.has_called_start = true;
        } else {
            obj.timedelta = timestamp - last_timestamp;
            obj.update();
        }
    }

    last_timestamp = timestamp;
    requestAnimationFrame(AC_GAME_ANIMATION);
}

requestAnimationFrame(AC_GAME_ANIMATION);

class ChatField {
    constructor(playground) {
        this.playground = playground;
        this.$history = $(`<div class="ac-game-chat-field-history"></div>`);
        this.$input = $(`<input type="text" class="ac-game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();
        this.func_id = null;

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start() {
        this.add_listening_events();
    }

    add_listening_events() {
        let outer = this;

        this.$input.keydown(function(e) { // esc
            if (e.which === 27) {
                outer.hide_input();
                return false;
            } else if (e.which === 13) { // enter
                let username = outer.playground.root.settings.username;
                let text = outer.$input.val();
                if (text) {
                    outer.$input.val("");
                    outer.add_message(username, text);
                    outer.playground.mps.send_chat(username, text);
                }
                return false;
            }

        });
    }

    render_message(message) {
        return $(`<div>${message}<\div>`);
    }

    add_message(username, text) {
        this.show_history()
        let message = `[${username}]: ${text}`;
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);
    }

    show_history() {
        let outer = this;
        this.$history.fadeIn();

        if (this.func_id) clearTimeout(this.func_id);

        this.func_id = setTimeout(function() {
            outer.$history.fadeOut();
            outer.func_id = null;
        }, 3000);
    }

    show_input() {
        this.show_history();
        this.$input.show();
        this.$input.focus();
    }

    hide_input() {
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
    }
}
class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas tabindex=0></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {
        this.$canvas.focus();
    }

    update() {
        this.render();
    }

    resize() {
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.ctx.fillStyle = "rgba(0, 0, 0, 1)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
class NoticeBoard extends AcGameObject {
    constructor(playground) {
        super();

        this.playground = playground;
        this.ctx = this.playground.game_map.ctx;
        this.text = "已就绪：0人";
    }

    start() {
    }

    write(text) {
        this.text = text;
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width / 2, 20);
    }
}
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
            this.destroy();
            return false;
        }
        let moved = Math.min(this.move_length, this.timedelta * this.speed / 1000);
        this.x += moved * Math.cos(this.angle);
        this.y += moved * Math.sin(this.angle);
        this.move_length -= moved;
        this.speed *= this.friction;
        this.render();
    }

    render() {
        let scale = this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x * scale, this.y * scale, this.radius * scale, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
class MultiPlayerSocket {
    constructor(playground) {
        this.playground = playground;
        this.ws = new WebSocket("wss://app1848.acapp.acwing.com.cn/wss/multiplayer/");
        this.start();

    }

    start() {
        this.receive();
    }

    receive() {
        let outer = this;
        this.ws.onmessage = function(e) {
            let data = JSON.parse(e.data);
            let uuid = data.uuid;
            if (uuid === outer.uuid) return false;

            let event = data.event;
            if (event === "create_player") {
                outer.receive_create_player(uuid, data.username, data.photo);
            } else if (event === "move_to") {
                outer.receive_move_to(uuid, data.tx, data.ty);
            } else if (event === "shoot_fireball") {
                outer.receive_shoot_fireball(uuid, data.tx, data.ty, data.ball_uuid);
            } else if (event === "attack") {
                outer.receive_attack(uuid, data.attackee_uuid, data.x, data.y, data.angle, data.damage, data.ball_uuid);
            } else if (event === "blink") {
                outer.receive_blink(uuid, data.tx, data.ty);
            } else if (event === "chat") {
                outer.receive_chat(uuid, data.username, data.text);
            }
        };
    }

    send_create_player(username, photo) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "create_player",
            "uuid": outer.uuid,
            "username": username,
            "photo": photo,
        }))
    }

    receive_create_player(uuid, username, photo) {
        let player = new Player(
            this.playground,
            this.playground.width / 2 / this.playground.scale,
            0.5,
            0.05,
            "white",
            0.15,
            "enemy",
            username,
            photo,
        );

        player.uuid = uuid;
        this.playground.players.push(player);
    }

    get_player(uuid) {
        let players = this.playground.players;
        for (let i = 0; i < players.length; i++) {
            let player = players[i];
            if (player.uuid === uuid)
                return player;
        }
    }

    send_move_to(tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "move_to",
            "uuid": outer.uuid,
            "tx": tx,
            "ty": ty,
        }));
    }

    receive_move_to(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player)
            player.move_to(tx, ty);
    }

    send_shoot_fireball(tx, ty, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "shoot_fireball",
            "uuid": outer.uuid,
            "tx": tx,
            "ty": ty,
            "ball_uuid": ball_uuid,
        }))
    }

    receive_shoot_fireball(uuid, tx, ty, ball_uuid) {
        let player = this.get_player(uuid);
        console.log("debug");
        if (player) {
            let fireball = player.shoot_fireball(tx, ty);
            fireball.uuid = ball_uuid;
        }
    }

    send_attack(attackee_uuid, tx, ty, angle, damage, ball_uuid) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "attack",
            "uuid": outer.uuid,
            "attackee_uuid": attackee_uuid,
            "x": tx,
            "y": ty,
            "angle": angle,
            "damage": damage,
            "ball_uuid": ball_uuid,
        }));
    }

    receive_attack(uuid, attackee_uuid, x, y, angle, damage, ball_uuid) {
        let attacker = this.get_player(uuid);
        let attackee = this.get_player(attackee_uuid);
        attacker.destroy_fireball(ball_uuid);
        if (attacker && attackee) {
            console.log(uuid, attackee_uuid, x, y, angle, damage, ball_uuid);
            attackee.x = x;
            attackee.y = y;
            attackee.is_attacked(damage, angle);
        }
    }

    send_blink(uuid, tx, ty) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "blink",
            "uuid": outer.uuid,
            "tx": tx,
            "ty": ty,
        }));
    }

    receive_blink(uuid, tx, ty) {
        let player = this.get_player(uuid);
        if (player) {
            player.blink(tx, ty);
        }
    }

    send_chat(username, text) {
        let outer = this;
        this.ws.send(JSON.stringify({
            "event": "chat",
            "uuid": outer.uuid,
            "username": username,
            "text": text,
        }));
    }

    receive_chat(uuid, username, text) {
        this.playground.chat_field.add_message(username, text);
    }
}
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`)
        this.hide();
        this.root.$ac_game.append(this.$playground);
        this.start();
    }

    get_random_color() {
        let color = ["red", "grey", "pink", "green", "blue"];

        return color[Math.floor(Math.random() * 5)];
    }

    start() {
        let outer = this;
        $(window).resize(function() {
            outer.resize();
        });
    }

    resize() {
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.unit = Math.min(this.width / 16, this.height / 9);
        this.width = this.unit * 16;
        this.height = this.unit * 9;
        this.scale = this.height;

        if (this.game_map) this.game_map.resize();
    }

    show(mode) {
        this.$playground.show();
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.resize();
        this.state = "waiting"; // waiting -> fighting -> over
        this.game_map = new GameMap(this);
        this.notice_board = new NoticeBoard(this);
        this.player_count = 0;
        this.players = [];
        this.mode = mode;
        this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, "white", 0.15, "me", this.root.settings.username, this.root.settings.photo));
        if (mode === "single mode") {
            for (let i = 0; i < 5; i++) {
                this.players.push(new Player(this, this.width / 2 / this.scale, 0.5, 0.05, this.get_random_color(), 0.15, "robot"));
            }
        } else if (mode === "multi mode") {
            let outer = this;
            this.mps = new MultiPlayerSocket(this);
            this.mps.uuid = this.players[0].uuid;

            this.mps.ws.onopen = function() {
                outer.mps.send_create_player(outer.root.settings.username, outer.root.settings.photo);
            }

            this.chat_field = new ChatField(this);
        }
    }

    hide() {
        this.$playground.hide();
    }
}
class Settings {
    constructor(root) {
        this.root = root;
        this.platform = "WEB";
        if (this.root.AcWingOs) this.platform = "ACAPP";
        this.username = "";
        this.photo = "";
        this.$settings = $(`
<div class="ac-game-settings">
    <div class="ac-game-settings-login">
        <div class="ac-game-settings-title">
            登录
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            注册
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
    <div class="ac-game-settings-register">
        <div class="ac-game-settings-title">
            注册
        </div>
        <div class="ac-game-settings-username">
            <div class="ac-game-settings-item">
                <input type="text" placeholder="用户名">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-first">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="密码">
            </div>
        </div>
        <div class="ac-game-settings-password ac-game-settings-password-second">
            <div class="ac-game-settings-item">
                <input type="password" placeholder="确认密码">
            </div>
        </div>
        <div class="ac-game-settings-submit">
            <div class="ac-game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="ac-game-settings-error-message">
        </div>
        <div class="ac-game-settings-option">
            登录
        </div>
        <br>
        <div class="ac-game-settings-acwing">
            <img width="30" src="https://app165.acapp.acwing.com.cn/static/image/settings/acwing_logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>
</div>
`);
        this.$login = this.$settings.find(".ac-game-settings-login");
        this.$login_username = this.$login.find(".ac-game-settings-username input");
        this.$login_password = this.$login.find(".ac-game-settings-password input");
        this.$login_submit = this.$login.find(".ac-game-settings-submit button");
        this.$login_error_message = this.$login.find(".ac-game-settings-error-message");
        this.$login_register = this.$login.find(".ac-game-settings-option");

        this.$login.hide();

        this.$register = this.$settings.find(".ac-game-settings-register");
        this.$register_username = this.$register.find(".ac-game-settings-username input");
        this.$register_password = this.$register.find(".ac-game-settings-password-first input");
        this.$register_password_confirm = this.$register.find(".ac-game-settings-password-second input");
        this.$register_submit = this.$register.find(".ac-game-settings-submit button");
        this.$register_error_message = this.$register.find(".ac-game-settings-error-message");
        this.$register_login = this.$register.find(".ac-game-settings-option");
        this.$acwing_login = this.$settings.find(".ac-game-settings-acwing img")
        this.$register.hide();

        this.root.$ac_game.append(this.$settings);

        this.start();
    }

    start() {
        if (this.platform == "ACAPP") {
            this.getinfo_acapp();
        } else {
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    add_listening_events() {
        this.add_listening_events_login();
        this.add_listening_events_register();
        this.add_listening_events_acwing_login();
    }

    add_listening_events_acwing_login() {
        let outer = this;

        this.$acwing_login.click(function() {
            outer.acwing_login();
        })
    }

    acwing_login() {
        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/acwing/web/apply_code",
            type: "GET",
            success: function(resp) {
                if (resp.result === "success") {
                    window.location.replace(resp.apply_code_url);
                }
            }
        })
    }

    add_listening_events_login() {
        let outer = this;
        this.$login_register.click(function() {
            outer.register();
        });
        this.$login_submit.click(function() {
            outer.login_on_remote();
        });
    }

    login_on_remote() {
        let outer = this;
        let username = this.$login_username.val();
        let password = this.$login_password.val();
        this.$login_error_message.empty();
        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/login",
            type: "GET",
            data: {
                username: username,
                password: password,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$login_error_message.html(resp.result);
                }
            }

        });
    }

    logout_on_remote() {
        if (this.platform === "ACAPP") {
            this.root.AcWingOs.api.window.close();
        } else
        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/logout/",
            type: "GET",
            success: function() {
                location.reload();
            }
        });
    }

    register_on_remote() {
        let outer = this;
        let username = this.$register_username.val();
        let password = this.$register_password.val();
        let password_confirm = this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/register/",
            type: "GET",
            data: {
                username: username,
                password: password,
                password_confirm: password_confirm,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    location.reload();
                } else {
                    outer.$register_error_message.html(resp.result);
                }
            }
        })

    }

    add_listening_events_register() {
        let outer = this;
        this.$register_login.click(function() {
            outer.login();
        })
        this.$register_submit.click(function() {
            outer.register_on_remote();
        })
    }

    register() { //打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login() { //打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    getinfo_web() {
        let outer = this;
        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/getinfo/",
            type: "GET",
            data: {
                platform: outer.platform,
            },
            success: function(resp) {
                if (resp.result === "success") {
                    outer.username = resp.username;
                    outer.photo = resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                } else {
                    outer.login();
                }
            }
        })
    }

    getinfo_acapp() {
        let outer = this;

        $.ajax({
            url: "https://app1848.acapp.acwing.com.cn/settings/acwing/acapp/apply_code",
            type: "GET",
            success: function(resp) {
                outer.acapp_login(resp.appid, resp.redirect_uri, resp.scope, resp.state);
            }
        })
    }

    acapp_login(appid, redirect_uri, scope, state) {
        let outer = this;

        this.root.AcWingOs.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp) {

            if (resp.result === "success") {
                outer.username = resp.username;
                outer.photo = resp.photo;
                outer.hide();
                outer.root.menu.show();
            }
        });
    }

    hide() {
        this.$settings.hide();
    }
}
export class AcGame {
    constructor(id, AcWingOs) {
        this.id = id;
        this.$ac_game = $('#' + id);

        this.AcWingOs = AcWingOs;
        this.settings = new Settings(this);
        this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}
