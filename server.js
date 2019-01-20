const existFile = ['/chat.html', '/404.html', '/main.js', '/server.js', '/favicon.ico', '/mainsolve.js', '/static/vue.min.js', '/timg.jpg', '/timg.png', '/timg2.jpg', '/webchat.css'];// First is main page,else are file exist on the server.
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
    } else {
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
let clientList = {};//在服务器端也要维护一个列表，列表格式如下：{username:{socket:,lastLogin:}}
function broadcast(message) {//服务器对所有在“在线列表”中的用户发送消息。
    for (let key in clientList) {//客户端发送消息，服务器对其进行广播
        if (clientList.hasOwnProperty(key)) clientList[key]['socket'].send(message);
    }
}

function buildCommand(commandList) {//传入一个列表，函数返回这个列表的命令形式（返回Component编码字符串）。
    if (commandList[0] === 'addUser') {
        return 'addUser,' + encodeURIComponent(commandList[1]) + ',' + encodeURIComponent(commandList[2]);
    }
    if (commandList[0] === 'deleteUser') {
        return 'deleteUser,' + encodeURIComponent(commandList[1]);
    }
}

//websocket service
webSocketServer = new ws({
    server: httpServer,
    port: 8081
});
webSocketServer.on('connection', function(clientWebSocket) {//服务器建立监听，等待客户端连接
    clientWebSocket.on('close', function(code, reason) {
        for (let user in clientList) {
            if (clientList[user].socket === clientWebSocket) {
                delete clientList[user];
                broadcast(buildCommand(['deleteUser', user]));
                break;
            }
        }
    });
    clientWebSocket.on('message', function(encodeMessage) {
        if (encodeMessage.toString()[0] === '{' && encodeMessage.toString()[encodeMessage.toString().length - 1] === '}') {//客户端发送消息，服务器对其进行广播
            // let messageContent = JSON.parse(encodeMessage.toString());
            //向数据库记录这条消息
            broadcast(encodeMessage);//向所有用户发送这条消息
        } else {//客户端发送用户名
            let username = decodeURI(encodeMessage.toString());
            let dat = new Date();
            broadcast(buildCommand(['addUser', username, dat.toTimeString().slice(0, 8)]));//在用户加入上线列表之前广播用户上线的消息，然后单独发送在线人数
            clientList[username] = {'socket': clientWebSocket, 'lastLogin': dat.toTimeString().slice(0, 8)}; //绑定用户名和socket
            //向客户发送陈年老消息
            for (let poster in clientList) {
                if (clientList.hasOwnProperty(poster)) {//首次登录发送登录信息
                    clientWebSocket.send(buildCommand(['addUser', poster, clientList[poster]['lastLogin']]));
                }
            }
        }
    });
});
