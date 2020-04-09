const express = require('express');

const app = express();
const http = require('http').createServer(app);

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
// Serve any requested files from the client folder (for example the images used on index.html)
app.use('/client', express.static(__dirname + '/client'));

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 2000
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || 'localhost'
console.log(server_port, server_ip_address);
http.listen(server_port, server_ip_address, function() {
    console.log('Listening on port 2000...');
});



const io = require('socket.io')(http, {});
io.sockets.on('connection', function(socket) {
    console.log('socket connection');
});
