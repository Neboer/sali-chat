const existFile = ['/chat.html', '/404.html', '/main.js', '/server.js', '/favicon.ico', '/mainsolve.js', '/static/vue.min.js', '/timg.jpg', '/timg.png', '/timg2.jpg', '/webchat.css'];// First is main page,else are file exist on the server.
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const mysql = require('mysql');
const Bind = require('./static/mysql_zscg');//关于消息列表的增删查改方法，目前实现了“增”和“查”
const ws = require('ws').Server;
// main http server

const httpServer = http.createServer(function(request, response) {
    // console.log(request.url);
    // console.log(request.headers['user-agent']);
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

let clientList = {};//在服务器端也要维护一个列表，列表格式如下：{username:{socket:(socket对象),lastLogin:(Date对象),lastLogout:(Date对象)}}，若用户第一次登陆，其lastLogout为空，如果用户不在线，socket为null
function broadcast(message) {//服务器对所有在“在线列表”中的用户发送消息。
    for (let user in clientList) {//客户端发送消息，服务器对其进行广播
        if (clientList.hasOwnProperty(user) && clientList[user].socket !== null) {
            clientList[user].socket.send(message);
        }
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

//sql service
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: fs.readFileSync('./static/password', 'utf-8'),//同步获取数据库密码
    database: 'sali_chat'
});
const mesTable = new Bind(connection, 'message');//将数据库连接和表绑定在一起建立一个bind对象，实现一种弱设计模式的类ORM操作

//websocket service
webSocketServer = new ws({
    server: httpServer,
    port: 8081
});
webSocketServer.on('connection', function(clientWebSocket) {//服务器建立监听，等待客户端连接
    clientWebSocket.on('close', function() {//用户登出
        for (let user in clientList) {
            if (clientList[user].socket === clientWebSocket && clientList.hasOwnProperty(user)) {
                clientList[user].socket = null;
                clientList[user].lastLogout = new Date();
                broadcast(buildCommand(['deleteUser', user]));
                break;
            }
        }
    });
    clientWebSocket.on('message', function(messageReceive) {
        let dat = new Date();
        let messageString = messageReceive.toString();
        if (messageString[0] === '{' && messageString[messageString.length - 1] === '}') {//客户端发送消息，服务器对其进行广播
            let messageContent = JSON.parse(messageString);
            mesTable.insert(messageContent.poster, new Date(messageContent.time), messageContent.messageContent);//向数据库记录这条消息
            broadcast(messageReceive);//向所有用户发送这条消息
        } else {//客户端发送用户名
            let username = decodeURI(messageString);
            broadcast(buildCommand(['addUser', username, dat.toTimeString().slice(0, 8)]));//在用户加入上线列表之前广播用户上线的消息，然后单独发送在线用户。
            if (username in clientList) {//用户在用户列表中，老用户再次登录
                clientList[username].lastLogin = dat;//更新用户最后一次上线的时间
                clientList[username].socket = clientWebSocket;//更新用户socket
                mesTable.findBetweenTime(clientList[username].lastLogout, dat, function(mess) {//向数据库查询上次登出到此次登录中的消息
                    for (let i = 0; i <= mess.length - 1; i++) {
                        clientWebSocket.send(JSON.stringify(mess[i]));//将这些消息发送给用户
                    }
                });
            } else {
                clientList[username] = {'socket': clientWebSocket, 'lastLogin': dat, 'lastLogout': null};//新用户登录，系统记录socket和登陆时间，登出时间留空。
            }
            for (let poster in clientList) {
                if (clientList.hasOwnProperty(poster) && clientList[poster].socket !== null) {//首次登录发送登录信息
                    clientWebSocket.send(buildCommand(['addUser', poster, clientList[poster].lastLogin.toTimeString().slice(0, 8)]));
                }
            }
        }
    });
});
