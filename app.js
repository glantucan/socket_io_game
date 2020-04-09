const express = require('express');

const app = express();
const http = require('http').createServer(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
// Serve any requested files from the client folder (for example the images used on index.html)
app.use('/client', express.static(__dirname + '/client'));

http.listen(2000, function() {
    console.log('Listening on port 2000...');
});



const io = require('socket.io')(http, {});
io.sockets.on('connection', function(socket) {
    console.log('socket connection');
});
