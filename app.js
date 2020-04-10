const express = require('express');

const app = express();
const http = require('http').createServer(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
// Serve any requested files from the client folder (for example the images used on index.html)
app.use('/client', express.static(__dirname + '/client'));

var server_port = process.env.PORT || 2000
//var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || 'localhost'
http.listen(server_port, function() {
    console.log('Listening on port', server_port, '...');
});



var playerList = [];
var socketList = [];
var lastId = 0;

const Player = function (name, socket) {
    var x = 250;
    var y = 250;
    var accel = 3;
    var friction = 1.2;
    var maxSpeed = 10;
    var vx = 0;
    var vy = 0;
    var pressingRight = false;
    var pressingLeft =  false;
    var pressingUp = false;
    var pressingDown = false;

    function updatePosition () {
        if ( pressingRight ) {
            vx += vx <= maxSpeed ? accel : 0;
        } 
        else if ( pressingLeft ) {
            vx -= vx >= -maxSpeed ? accel : 0;
        } 
        else if ( vx !== 0 ) {
            vx = vx / friction;
            if ( vx > -0.2 && vx < 0.2) {
                vx = 0;
            }
        }

        if ( pressingUp ) {
            vy -= vy >= -maxSpeed ? accel : 0;
        } 
        else if ( pressingDown ) {
            vy += vy <= maxSpeed ? accel : 0;
        } 
        else if ( vy !== 0) {
            vy = vy / friction;
            if ( vy > -0.1 && vy < 0.1) {
                vy = 0;
            }
        }
        
        x += vx;
        y += vy;
        //console.log(me.name, vx, vy, x, y)

    }

    return {
        id: lastId++, 
        socket,
        name,
        getX() { return x; },
        getY() { return y; },
        set pressingRight(val) { pressingRight = val; },
        set pressingLeft(val) { pressingLeft = val; },
        set pressingUp(val) { pressingUp = val; },
        set pressingDown(val) { pressingDown = val; },
        updatePosition
    };
}

const io = require('socket.io')(http, {});
io.on('connection', function(socket) {
    var currentPlayer = {
        socket,
        id: lastId,
        x: 0,
        y: 0,
    }

    socket.on( 'join-game', 
        function (data) {
            var connectedPlayer = Player(data.name, socket);
            sendMessage(data.name + ' joined the game');
            
            socket.emit('joined', connectedPlayer.id);

            playerList.push(connectedPlayer);

            sendData('players-list-update', playerList.map(
                player => ({
                    name: player.name,
                    id: player.id,
                })
            ));
            
            socket.on('disconnect', disconnect);
            socket.on('leave-game', leaveGame);
            socket.on('key-press', onKeyPress);

            function onKeyPress(data) {
                if (connectedPlayer.id === data.playerId) {   
                    if (      data.inputId === 'left') {
                        connectedPlayer.pressingLeft = data.state;
                    }
                    else if ( data.inputId === 'right') {
                        connectedPlayer.pressingRight = data.state;
                    }
                    else if ( data.inputId === 'down') {
                        connectedPlayer.pressingDown = data.state;
                    }
                    else if ( data.inputId === 'up') {
                        connectedPlayer.pressingUp = data.state;
                    } 
                }
            }
            function disconnect() {
                leaveGame();
                socketList = socketList.filter( (s) => s !== socket );
            }
            function leaveGame() {
                playerList = playerList.filter( (p) => p !== connectedPlayer );
                sendData('players-list-update', playerList.map(
                    player => ({
                        name: player.name,
                        id: player.id,
                    })
                ));
                sendMessage(connectedPlayer.name + ' is leaving' )
            }
        }
    ) 
    socketList.push(socket);
    sendMessage('socket connection registered for anonymous watcher');
    
});

function sendMessage(message) {
    socketList.forEach((s) => {
        s.emit('server-message', message)
    });
}

function sendData(packetType, data) {
    socketList.forEach((s) => {
        s.emit(packetType, data);
    });
}

setInterval(function() {
    var playersUpdate = [];
    playersUpdate = playerList.map( function(currentPlayer) {
        currentPlayer.updatePosition();
        
        return {
            id: currentPlayer.id,
            x: currentPlayer.getX(),
            y: currentPlayer.getY()
        };
    });

    socketList.forEach( function(socket) {
        socket.emit('new position', playersUpdate);
        //console.log("Emiting update for player", player.id);
    });
}, 1000/25); //25 frames per second
