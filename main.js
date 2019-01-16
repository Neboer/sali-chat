import Vue from 'static/vue.min';

const submitButton = document.getElementById('submit');
const username = document.getElementById('username');
const mes = document.getElementById('message');
const loginButton = document.getElementById('login');
let newWebSocket = null;

// const request = new XMLHttpRequest();
function addMessageToDocument(messageSender, messageContent) {
    thisVue.$data.sites.push({text: username.value + ':' + mes.value});
}

//服务器与客户端的模拟握手的原理：客户端首先向服务器发起连接请求，连接打开后，客户端立即响应发送用户名,服务器处理用户名，连接正式建立。
//客户端发送消息，仅仅是发送消息，并不做任何动作。
//服务器接受到一条客户端发送的消息后，将这条消息存储，然后尝试广播给包含发送者在内的所有用户。
loginButton.onclick = function() {
    newWebSocket = new WebSocket('ws://localhost:8081');//发起连接请求
    newWebSocket.onopen = function(ev) {//连接打开且有效，客户端准备发送用户名
        for(let i =0;i<=100;i++){
            newWebSocket.send(encodeURI(username.value));//客户端发送用户名
        }
        newWebSocket.onmessage = function(messageEvent2) {//信息监听
            let s = JSON.parse(messageEvent2.data);//信息内容（JSON串）
            addMessageToDocument(s.poster, s.messageContent);//将信息打印在屏幕上
        };
    };
    loginButton.hidden = Boolean(1);//隐藏登录按钮，连接正式建立。
};

// const messageList = {
//     numberOfMessage: 0,
//     poster: [],
//     messageContent: [],
//     addPost: function (posterName, postMessage) {
//         this.poster.push(posterName);
//         this.messageContent.push(postMessage);
//         this.numberOfMessage++
//     },
//     returnPostList: function (callback) {
//         let cachePosterList = [];
//         for (let i = 0; i <= this.numberOfMessage - 1; i++) {
//             cachePosterList.push(callback(this.poster[i],this.messageContent[i]))
//         }
//         return cachePosterList
//     }
// };

Vue.component('todo-item', {
    props: ['todo'],
    template: '<dd>{{ todo.text }}</dd>'
});

let thisVue = new Vue({
    el: '#app',
    data: {
        sites: []
    }
});
submitButton.onclick = function() {
    //send the message to server
    let usernameWaitForSend = encodeURI(username.value);
    let messageContentWaitForSend = encodeURI(mes.value);
    let messageWaitForSend = {poster: usernameWaitForSend, messageContent: messageContentWaitForSend};
    newWebSocket.send(JSON.stringify(messageWaitForSend));//仅仅是发送信息而已，并不把信息增加到页面上，等待服务端回传信息时添加。
    // let url = "send";
    // request.open("POST", url, true);
    // request.setRequestHeader("authorization", encodeURI(username.value));
    // request.send(mes.value);
    // addMessageToDocument(username.value, mes.value);
};

