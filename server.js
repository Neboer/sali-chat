const existFile = ['/chat.html', '/404.html', '/main.js', '/server.js', '/favicon.ico', '/mainsolve.js', '/static/vue.min.js'];// First is main page,else are file exist on the server.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql');
const ws = require('ws').Server;
// main http server
const httpServer = http.createServer(function(request, response) {
    // console.log(request.url);
    let requestLink = url.parse(request.url).path;
    if (requestLink.localeCompare('/') === 0) { // main page logic
        requestLink = existFile[0];
    }
    if (existFile.includes(requestLink)) { //return the file
        let realPath = path.join(__dirname, requestLink);
        fs.readFile(realPath, function(err, data) {
            if (err) {
                console.log(err.stack);
            } else {
                response.writeHead(200);
                response.write(data, 'binary');
                response.end();
            }
        });
    }
    // receive POST data
    // else if (requestLink === '/send' && request.method === 'POST') {
    //     let buffer = '';
    //     let username = decodeURI(request.headers.authorization);
    //     request.on('data', function(chunk) {
    //         buffer += chunk;
    //     });
    //     request.on('end', function() {
    //         console.log(username + ':' + buffer);// will be replaced with ...
    //         buffer = '';
    //     });
    // }
    else {
        let realPath = path.join(__dirname, existFile[1]);
        fs.readFile(realPath, function(err, data) {
            if (err) {
                console.log(err.stack);
            } else {
                response.writeHead(404);
                response.write(data, 'binary');
                response.end();
            }
        });
    }
}).listen(8080);
console.log('http://localhost:8080/');

// mysql service
// const connection = mysql.createConnection({
//     'host': 'localhost'
//
// });

// const onlineList = {
//     usernameList: [],
//     socketList: [],
//     totalClient: 0,
//     addList: function(username, socket) {
//         this.usernameList.push(username);
//         this.socketList.push(socket);
//         this.totalClient++;
//     }
// };
let clientList = {};//username:socket
// function messagePiece(poster,messageContent,postDate){
//     this.poster=poster;
//     this.messageContent = messageContent;
//     this.postDate = postDate;
//     this.toJSON = function() {
//         let a = {};
//         a.poster = encodeURI(this.poster);
//         a.messageContent = encodeURI(this.messageContent);
//         a.postDate = this.postDate;
//         return a;
//     }
// }

//websocket service
webSocketServer = new ws({
    server: httpServer,
    port: 8081
});
webSocketServer.on('connection', function(clientWebSocket) {//服务器建立监听，等待客户端连接
    clientWebSocket.on('close',function(code,reason) {
        for(let user in clientList){
            if(clientList[user]===clientWebSocket){
                delete clientList[user];
                // console.log("someone disconnect")
            }
        }
    });
    clientWebSocket.on('message', function(encodeUsername) {//客户端发送用户名
        let username = decodeURI(encodeUsername.toString());
        clientList[username] = clientWebSocket; //绑定用户名和socket
        //向客户发送陈年老消息
        clientWebSocket.on('message', function(encodeMessage) {
            let messageContent = JSON.parse(encodeMessage.toString());
            //向数据库记录这条消息
            // webSocketServer.clients.forEach(function(userSocket) {
            //     userSocket.send(encodeMessage);//广播该条消息
            // });
            for(let key in clientList){
                if(clientList.hasOwnProperty(key)) clientList[key].send(encodeMessage);
            }
        });
    });
    // webSocketServer.on('message', function(encodeUsername) {//一旦连接建立，服务器就等待客户端发送用户名
    //     let username = decodeURI(encodeUsername);
    //     console.log(username);
    //     if(client[username]==null) {client[username] = webSocket}//服务器收到用户名，将其和socket一起加入等待列表
    //     //服务器尝试从数据库中获取陈年老消息传递给连接上的用户
    //     webSocketServer.on("message",function(newMessage) {//服务器修改监听状态，收到新消息立即广播给所有socket
    //         console.log(newMessage);
    //         //服务器尝试记录这条数据
    //         for(let username in client){
    //             if(client.hasOwnProperty(username)) client[username].send(newMessage);//服务器广播json串数据。
    //         }
    //     })
    // });
});
// webSocketServer.on('message', function(messageSend) {//messageSend is a JSON
//     // write message in database
//     // distribute the message to every client
//     for (let i = 0; i <= onlineList.totalClient - 1; i++) {
//         onlineList.socketList[i].send(JSON.parse(messageSend).messageContent)
//     }
// });
