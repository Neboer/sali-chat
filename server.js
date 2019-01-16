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
let clientList = {};//username:socket
//websocket service
webSocketServer = new ws({
    server: httpServer,
    port: 8081
});
webSocketServer.on('connection', function(clientWebSocket) {//服务器建立监听，等待客户端连接
    clientWebSocket.on('close', function(code, reason) {
        for (let user in clientList) {
            if (clientList[user] === clientWebSocket) {
                delete clientList[user];
                // console.log("someone disconnect")
            }
        }
    });
    clientWebSocket.on('message', function(encodeMessage) {
        if (encodeMessage.toString()[0] === '{' && encodeMessage.toString()[encodeMessage.toString().length - 1] === '}') {
            // let messageContent = JSON.parse(encodeMessage.toString());
            //向数据库记录这条消息
            for (let key in clientList) {//客户端发送用户名
                if (clientList.hasOwnProperty(key)) clientList[key].send(encodeMessage);
            }
        } else {
            let username = decodeURI(encodeMessage.toString());
            clientList[username] = clientWebSocket; //绑定用户名和socket
            //向客户发送陈年老消息
        }

    });
});
