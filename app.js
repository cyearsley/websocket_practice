var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var uuid = require('uuid');

var socket = require('socket.io');
var io = socket(http);
var PORT = 8000;
var game = null;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	res.send('<h1>Go to localhost:8000/game</h1>');
});

app.get('/game', function(req, res) {
	res.sendFile(__dirname + '/public/game.html');
});

var Player = function (sid) {
	this.x = Math.floor(Math.random() * (600- 100+ 1)) + 100;
	this.y = Math.floor(Math.random() * (600- 100+ 1)) + 100;
	this.name = 'XYZ';
	this.sid = sid.split('#')[1];
};
var players = {};
var playerVerificationIds = {};
var notifyGameState_p = false;
var updateObj = {};

var update = {
	move: {
		up: function (sid) {
			console.log("moving up", players); 
			players[sid].y -= 3;
		},
		down: function (sid) {players[sid].y += 3;},
		left: function (sid) {players[sid].x -= 3;},
		right: function (sid) {players[sid].x += 3;}
	}
};

function isEmpty(obj) {
   for(var key in obj) {
      return !obj.hasOwnProperty(key);
   }
   return true;
}

function notifyUsers(socket, id) {
	console.log("id: ", id);
	var interval = setInterval(function () {
		if (isEmpty(updateObj)) {
			console.log("CLEARED");
			clearInterval(interval);
		}
		else {
			for (key in updateObj) {
				if (updateObj.hasOwnProperty(key)) {
					updateObj[key](id);

					// Notify the current user, and other users of this new data! w00t
					socket.broadcast.emit('update-game-state', {players: players});
					socket.emit('update-game-state', {players: players});
				}
			}
		}
	}, 1000/80);
}

// uses both the socket id and the user id to ensure the request was made by the user.
function requestValid(sid, puuid) {
	if (playerVerificationIds[sid + '' + puuid]) {
		return true;
	}
	else {
		return false;
	}
}

function setSocketIdNamespace (sid) {
	return '/game#' + sid;
}

io.of('/game').on('connection', function (socket) {
	console.log("User connected with socket id: ", socket.id);

	// create a unique id (uuid + socket.id) for verification purposes.
	socket.uuid = uuid();
	playerVerificationIds[socket.id + '' + socket.uuid] = true;

	players[socket.id] = new Player(socket.id);

	socket.broadcast.emit('update-game-state', {players: players});
	socket.emit('update-game-state', {players: players});

	// socket.emit('message-from-server', {
	// 	greeting: 'hello from server!'
	// });

	// socket.on('message-from-client', function (msg) {
	// 	console.log("message from client: ", msg.greeting);
	// });

	socket.on('move-player', function (msg) {

		msg.sid = setSocketIdNamespace(msg.sid);
		if (requestValid(msg.sid, socket.uuid)) {
			console.log("MESSAGE: ", msg);
			if (msg.action === 'ArrowRight' && typeof updateObj[msg.sid + '|' + msg.action] === 'undefined') {
				updateObj[msg.sid + '|' + msg.action] = update.move.right;
			}
			if (msg.action === 'ArrowLeft' && typeof updateObj[msg.sid + '|' + msg.action] === 'undefined') {
				updateObj[msg.sid + '|' + msg.action] = update.move.left;
			}
			if (msg.action === 'ArrowUp' && typeof updateObj[msg.sid + '|' + msg.action] === 'undefined') {
				updateObj[msg.sid + '|' + msg.action] = update.move.up;
			}
			if (msg.action === 'ArrowDown' && typeof updateObj[msg.sid + '|' + msg.action] === 'undefined') {
				updateObj[msg.sid + '|' + msg.action] = update.move.down;
			}
			// socket.broadcast.emit('update-game-state', {players: players});
			notifyUsers(socket, msg.sid);
		}
	});

	socket.on('stop-moving-player', function (msg) {
		msg.sid = setSocketIdNamespace(msg.sid);
		if (playerVerificationIds[msg.sid + '' + socket.uuid]) {
			console.log("updateObj: ", updateObj);
			delete updateObj[msg.sid + '|' + msg.action];
			console.log("updateObj: ", updateObj);
		}
	});

	socket.on('disconnect', function () {
		console.log("The socket with id disconnected: ", socket.id);

		// remove the player on disconnect.
		delete playerVerificationIds[socket.id + '' + socket.uuid];
		delete players[socket.id];
	});
});

http.listen(PORT, function () {
	console.log("listening on port: ", PORT);
});
