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
