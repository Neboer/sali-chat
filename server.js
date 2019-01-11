const existFile = ["/chat.html", "/404.html", "/main.js", "/server.js", "favicon.ico"];// First is main page,else are file exist on the server.
const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
// const express = require("express");
// const bodyPraser = require("body-parser");
// let app = express();
http.createServer(function (request, response) {
    let requestLink = url.parse(request.url).path;
    if (requestLink.localeCompare("/") === 0) {// main page logic
        requestLink = existFile[0];
    }
    if (existFile.includes(requestLink)) {//return the file
        let realPath = path.join(__dirname, requestLink);
        fs.readFile(realPath, function (err, data) {
            if (err) console.log(err.stack);
            else {
                response.writeHead(200);
                response.write(data, "binary");
                response.end();
            }
        })
    } else if (requestLink === "/send" && request.method === "POST") {
        let buffer = "";
        let username = request.headers.authorization;
        request.on("data", function (chunk) {
            buffer += chunk;
        });
        request.on("end", function () {
            console.log(username + ":" + buffer);// will be replaced with ...
            buffer = "";
        })
    } else {
        let realPath = path.join(__dirname, existFile[1]);
        fs.readFile(realPath, function (err, data) {
            if (err) console.log(err.stack);
            else {
                response.writeHead(404);
                response.write(data, "binary");
                response.end();
            }
        })
    }
}).listen(8080);
console.log("http://localhost:8080/");
