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
console.log(server_port);
http.listen(server_port, function() {
    console.log('Listening on port 2000...');
});



var playerList = [];
var lastId = 0;

const io = require('socket.io')(http, {});
io.on('connection', function(socket) {
    var currentPlayer = {
        socket,
        id: lastId,
        x: 0,
        y: 0,
    }
    playerList.push(currentPlayer);

    console.log('socket connection registered for player', lastId++);
    socket.on('disconnect', function(){
        playerList = playerList.filter( (player) => player !== currentPlayer );
    });
});



setInterval(function() {
    var playersUpdate = [];
    playersUpdate = playerList.map( function(player) {
        player.x++;
        player.y++;
        return {
            id: player.id,
            x: player.x,
            y: player.y
        };
    });

    playerList.forEach( function(player) {
        player.socket.emit('new position', playersUpdate);
        //console.log("Emiting update for player", player.id);
    });
}, 1000/25); //25 frames per second
