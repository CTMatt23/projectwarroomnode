let express = require('express');
let app = express();

let http = require('http');
let server = http.Server(app);
let usercount = 0;
let socketIO = require('socket.io');
let io = socketIO(server);

const port = process.env.PORT || 3002;

var chatList = [];
var messageList = [];
var userNameList = [];
var topMessageList = [];
var topUsersList = [];
try {
    io.on('connection', (socket) => {

        usercount++;

        console.log("Entered chat count: " + usercount.toString());

        socket.on('join-main-chat', (message) => {
            io.emit('get-top-comments', topMessageList);
            io.emit('get-top-users', topUsersList);
            io.emit('get-count', usercount.toString());
            io.emit('get-list', chatList);
        });

        socket.on('vote', (ballet) => {
            messageList[ballet.id].rank += ballet.vote;
            var newBallet = {msgId: ballet.id, newRank: messageList[ballet.id].rank};

            var userid = findWithAttr(chatList, 'user', ballet.user);

            chatList[userid].rank += ballet.vote;
            var newUserRank = {user: ballet.user, newRank: chatList[userid].rank};

            io.to('main room').emit('new-rank', newBallet);
            io.emit('new-user-rank', newUserRank);

            if (messageList.length > 4) {
                spliceTopComments();
                socket.on('show-top-comments', () => {
                    io.emit('get-top-comments', topMessageList);
                });
            }
            if (userNameList.length > 4) {
                spliceTopUsers();
                socket.on('show-top-users', () => {
                    io.emit('get-top-users', topUsersList);
                });
            }
        });

        socket.on('new-message', (data) => {
            //Create messageObj. Use another method to get messageid.
            messageId = messageList.length;
            messageList.push({
                user: data.user,
                messageid: messageId,
                date: data.date,
                message: data.message,
                rank: data.rank,
                voted: false
            });
            io.to('main room').emit('new-message', messageList[messageId]);
        });

        socket.on('show-list', () => {
            io.emit('get-list', chatList);
        });
        //update-chat-list variable message is a username.
        socket.on('update-chat-list-add', (name) => {
            chatList.push({socketid: socket.id, user: name, userId: chatList.length, rank: 0});
        });

        //update-chat-list variable message is a username.
        socket.on('update-chat-list-remove', (message) => {
            var delUser = chatList.filter(obj => {
                return obj.id === socket.id;
            });
            userNameList.splice(chatList.indexOf(delUser.user), 1);
            chatList.splice(chatList.findIndex(item => item.id === socket.id), 1);

            console.log("Removed " + delUser + " from chat list");
        });

        socket.on('disconnect', (message) => {
            usercount--;
            var delUser = chatList.filter(obj => {
                return obj.id === socket.id;
            });
            userNameList.splice(chatList.indexOf(delUser.user), 1);
            chatList.splice(chatList.findIndex(item => item.id === socket.id), 1);
            console.log("Left chat count: " + usercount.toString());
            io.emit('get-count', usercount.toString());
        });
    });
} catch (error) {
    console.log(error);
}

function findWithAttr(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

function spliceTopUsers() {
    topUsersList = userNameList.slice();
    topUsersList.sort(function (a, b) {
        return b.rank - a.rank
    });
    topUsersList = topUsersList.splice(0, 5);
}

function spliceTopComments() {
    topMessageList = messageList.slice();
    topMessageList.sort(function (a, b) {
        return b.rank - a.rank
    });
    topMessageList = topMessageList.splice(0, 5);
}


server.listen(port, () => {
    console.log(`started on port: ${port}`);
});

