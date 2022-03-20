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
            设置
        </div>
    </div>
</div>
`);

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
            outer.root.playground.show();
        });
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

class GameMap extends AcGameObject {
    constructor(playground) {
        super();
        this.playground = playground;
        this.$canvas = $(`<canvas></canvas>`);
        this.ctx = this.$canvas[0].getContext('2d');
        this.ctx.canvas.width = this.playground.width;
        this.ctx.canvas.height = this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start() {
    }

    update() {
        this.render();
    }

    render() {
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
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
        this.eps = 1;
        this.friction = 0.9;
    }

    start() {
    }

    update() {
        if (this.move_length < this.eps || this.speed < this.eps) {
            console.log("destroy");
            this.destroy();
            return false;
        }
        let moved = Math.min(this.move_length, this.timedelta * this.speed / 1000);
        this.x += moved * Math.cos(this.angle);
        this.y += moved * Math.sin(this.angle);
        console.log("%f %f %f", this.move_length, moved, this.speed * this.timedelta / 1000);
        this.move_length -= moved;
        this.speed *= this.friction;
        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
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
                if (e.which === 3) {
                    outer.move_to(e.clientX, e.clientY);
                } else if (e.which == 1) {
                    if (outer.skill != null) {
                        outer.shoot_skill(e.clientX, e.clientY);
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
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0,Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
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
    }

    update() {
        for (let i = 0; i < this.playground.players.length; i++) {
            let player = this.playground.players[i];
            if (player !==  this.player && this.is_collision(player)) {
                this.attack(this.damage, player);
                this.destroy();
                return false;
            }
        }

        if (this.move_length < this.eps) {
            this.destroy();
            return false;
        } else {
            let moved = Math.min(this.move_length, this.timedelta * this.speed / 1000);
            this.x += moved * Math.cos(this.angle);
            this.y += moved * Math.sin(this.angle);
            this.move_length -= moved;
        }

        this.render();
    }

    render() {
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.fill();
    }
}
class AcGamePlayground {
    constructor(root) {
        this.root = root;
        this.$playground = $(`<div class="ac-game-playground"></div>`)
        // this.hide();
        this.root.$ac_game.append(this.$playground);
        this.width = this.$playground.width();
        this.height = this.$playground.height();
        this.game_map = new GameMap(this);
        this.players = [];
        this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, "white", this.height * 0.15, true));

        for (let i = 0; i < 5; i++) {
            this.players.push(new Player(this, this.width / 2, this.height / 2, this.height * 0.05, this.get_random_color(), this.height * 0.15, false));
        }
        this.start();
    }

    get_random_color() {
        let color = ["red", "grey", "pink", "green", "blue"];

        return color[Math.floor(Math.random() * 5)];
    }

    start() {

    }

    show() {
        this.$playground.show();
    }

    hide() {
        this.$playground.hide();
    }
}
export class AcGame {
    constructor(id) {
        this.id = id;
        this.$ac_game = $('#' + id);
        //this.menu = new AcGameMenu(this);
        this.playground = new AcGamePlayground(this);

        this.start();
    }

    start() {
    }
}
