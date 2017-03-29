console.log("IN GAME.JS");
var GameLoop = function () {

    var canvas=document.getElementById("player-canvas");
    var ctx=canvas.getContext("2d");
    CanvasRenderingContext2D.prototype.clear = function() {
        this.save();
        this.setTransform(1, 0, 0, 1, 0, 0);
        this.clearRect(0, 0, canvas.width, canvas.height);
        this.restore();
    };

    var socket = io('http://localhost:8000/game');
	// socket.on('message-from-server', function (msg) {
	// 	console.log("message from server: ", msg.greeting);

	// 	socket.emit('message-from-client', {
	// 		greeting: 'Hello from the client!'
	// 	});
	// });

    var players = [];

    var keyEvents = {
        keyDown_p: false
    }

    window.addEventListener('keydown', function (evt) {
        // console.log("key: ", socket.id);
        if ((evt.key === 'ArrowRight' || evt.key === 'ArrowLeft' || evt.key === 'ArrowUp' || evt.key === 'ArrowDown') && !keyEvents.keyDown_p) {
            socket.emit('move-player', {sid: socket.id, action: evt.key});
            keyEvents.keyDown_p = true;
        }
    });

    window.addEventListener('keyup', function (evt) {
        // console.log("KEY UP: ", evt.key);
        if (evt.key === 'ArrowRight' || evt.key === 'ArrowLeft' || evt.key === 'ArrowUp' || evt.key === 'ArrowDown') {
            socket.emit('stop-moving-player', {sid: socket.id, action: evt.key});
            keyEvents.keyDown_p = false;
        }
    });

    socket.on('update-game-state', function (msg) {
        // console.log("Updated state of the players: ", msg);
        players = msg.players;
    });

    this.updatePlayers_p;
    this.players = [];
	
    this.init = function () {
        window.requestAnimationFrame(_gameLoop);
    };
    this.init();

    function _gameLoop (timestamp) {
        // _update(timestamp);
        // handle input
        _render();

        window.requestAnimationFrame(_gameLoop);
    }

    // function _update (timestamp) {
    //     // console.log("updateing: ", timestamp)
    // }

    function _render () {
        ctx.save();
        ctx.clear();
        for (key in players) {
            ctx.save();
                
            // ctx.fillStyle = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
            if (socket.id == players[key].sid) {
                ctx.fillStyle = '#00F';
            } 
            else {
                ctx.fillStyle = '#0AA';
            }
            ctx.fillRect(players[key].x, players[key].y, 20, 20);
            
            // ctx.strokeStyle = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
            ctx.strokeStyle = '#FFF';
            ctx.strokeRect(players[key].x, players[key].y, 20, 20);

            ctx.restore();
        }

        ctx.restore();
    };
};