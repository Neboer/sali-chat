import Vue from 'static/vue.min';

const submitButton = document.getElementById('submit');
const username = document.getElementById('username');
const mes = document.getElementById('message');
const loginButton = document.getElementById('login');
let newWebSocket = null;
const supportCommandList = ['addMessageToDocument', 'addUser', 'deleteUser'];

// const request = new XMLHttpRequest();
function addMessage(sendTime, messageSender, messageContent) {
    thisVue.$data.sites.push({text: sendTime + ' ' + messageSender + ':' + messageContent});
}

function addMessageToDocument(message) {
    thisVue.$data.sites.push({text: message});
}

function addUser(inUsername, inLastLogin) {
    userVue.$data.clientList.push({'username': inUsername, 'lastLogin': inLastLogin});
}

function deleteUser(inUsername) {
    for (let i = userVue.$data.clientList.length - 1; i >= 0; i--) {
        if (userVue.$data.clientList[i].username === inUsername) userVue.$data.clientList.splice(i, 1);
    }
}

function executeCommandList(commandList) {//解析服务端传递的命令字符串，生成函数并执行
    if (supportCommandList.indexOf(supportCommandList[0]) > -1) {
        let varList = [];
        let originList = commandList.split(',');
        let command = originList[0];
        for (let i = 1; i <= originList.length - 1; i++) {
            varList.push('"' + decodeURIComponent(originList[i]) + '"');
        }
        let functionString = command + '(' + varList.join(',') + ')';
        eval(functionString);
    }
}



//服务器与客户端的模拟握手的原理：客户端首先向服务器发起连接请求，连接打开后，客户端立即响应发送用户名,服务器处理用户名，连接正式建立。
//客户端发送消息，仅仅是发送消息，并不做任何动作。
//服务器接受到一条客户端发送的消息后，将这条消息存储，然后尝试广播给包含发送者在内的所有用户。
//如果服务器发来的数据并不是JSON，就说明这是一条指令，指令是一个普通的字符串集，除首个元素，每个字符串都是encodeURIComponent编码的，由不编码的逗号","分隔。
//第一个元素是函数名，也就是命令名，其余项解码后都是函数传入的参数。
loginButton.onclick = function() {
    newWebSocket = new WebSocket('ws://localhost:8081');//发起连接请求
    newWebSocket.onopen = function(ev) {//连接打开且有效，客户端准备发送用户名
        newWebSocket.send(encodeURI(username.value));//客户端发送用户名
        newWebSocket.onmessage = function(messageEvent2) {//信息监听
            if (messageEvent2.data[0] !== '{') {
                executeCommandList(messageEvent2.data);
            }//首个字符不是{，说明传入了命令。客户端只需要解码命令再执行就可以。
            else {//常规消息字符串
                let s = JSON.parse(messageEvent2.data);//信息内容（JSON串）
                addMessage(s.time, decodeURI(s.poster), decodeURI(s.messageContent));//将信息打印在屏幕上
            }
        };
    };
    loginButton.hidden = Boolean(1);//隐藏登录按钮，连接正式建立。
    username.hidden = Boolean(1);
    mes.hidden = Boolean(0);
    submitButton.hidden = Boolean(0);
};

let userListComponent = {
    props: ['user'],
    template: '<p>{{ user.username }} last login:{{ user.lastLogin }}</p>'
};

let userVue = new Vue({
    el: '#onlinePeople',
    data: {
        clientList: []
    },
    components: {
        "userlist":userListComponent
    }
});
let messageList = {
    props: ['todo'],
    template: '<dd>{{ todo.text }}</dd>'
};

let thisVue = new Vue({
    el: '#app',
    data: {
        sites: []
    },
    components: {
        "todo-item":messageList
    }
});

let submit = function() {
    let time = new Date();
    let usernameWaitForSend = encodeURI(username.value);
    let messageContentWaitForSend = encodeURI(mes.value);
    let messageWaitForSend = {
        poster: usernameWaitForSend,
        messageContent: messageContentWaitForSend,
        time: time.toTimeString().slice(0, 8)
    };
    newWebSocket.send(JSON.stringify(messageWaitForSend));//仅仅是发送信息而已，并不把信息增加到页面上，等待服务端回传信息时添加。
    console.log(JSON.stringify(messageWaitForSend));
    mes.value = '';
};

submitButton.onclick = submit;//提交按钮点击事件
mes.onkeydown = function(event) {
    if (event.code === 'Enter' || event.code === 'NumpadEnter') submit();//enter按下事件
};
