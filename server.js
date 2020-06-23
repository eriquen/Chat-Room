// import express.js and assign to variable
var express = require('express');
// call express function
var app = express();
// import and create http server
var server = require('http').createServer(app);
// import socket.io
var io = require('socket.io').listen(server);
// user list array
var users = {};

// run server at port 8787
server.listen(process.env.PORT || 8787);
console.log('Server running...');

// route. need request and respond
// This will display index.html to the page
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
});

// open connection
io.sockets.on('connection', function (socket) {

    // create new user
    socket.on('new user', function (data, callback) {
        // check if the username already exist inside array 
        if (data in users) {
            // return false if user already exist
            callback(false);
        } else {
            // return trune to client side
            callback(true);
        
            // receive username from client and assign to socket
            socket.username = data;
            // assign the random color when new user was detected
            socket.color = randDarkColor();
            
            users[socket.username] = socket;
            // update username to online user list
            updateUsernames();
        }
    });

    // receive message from client
    socket.on('send message', function (data, callback) {
        // remove blank space at front and back of the string
        var msg = data.trim();
        // check first character of mesage is @
        if (msg.substr(0, 1) === '@') {
            // this mean that user want to send private message to specific user
            console.log("Private message");
            // remove @ symbol
            msg = msg.substr(1);
            // divide string with space
            var ind = msg.indexOf(' ');
            // if variable not empty
            if (ind !== -1) {
                // extract assign receiver name
                var name = msg.substring(0, ind);
                // extract assign message
                var msg = msg.substring(ind + 1);
                if (name in users) {
                    // send the private message to specific client 
                    users[name].emit('private message', {
                        msg: msg,
                        user: socket.username,
                    });
                    console.log("Private message");
                } else {
                    // user not found
                    callback('User not found');
                }

            } else {
                // message empty
                callback('No message');
            }
        } else {
            // user just want to broadcast the message
            io.sockets.emit('new message', {
                msg: msg,
                user: socket.username,
                color: socket.color
            });
        }

    });

    // Disconnect when user close the tab or refresh
    socket.on('disconnect', function (data) {
        // if user not found just return
        if (!socket.username) return;
        // if user found, remove the username from the user list array
        delete users[socket.username];
        // update client list at the client page
        updateUsernames();

    });

    // update latest online user list 
    function updateUsernames() {
        io.sockets.emit('get users', Object.keys(users))
    }

    // this function is to generate random dark color 
    // to prevent user be assign to light color, so the message more readable
    function randDarkColor() {
        var lum = -0.25;
        var hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '');
        if (hex.length < 6) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        var rgb = "#",
            c, i;
        for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i * 2, 2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }
        return rgb;
    }
});