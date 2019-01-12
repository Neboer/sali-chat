import Vue from "static/vue.min";
const sub = document.getElementById("submit");
const username = document.getElementById("username");
const mes = document.getElementById("message");
const request = new XMLHttpRequest();
sub.onclick = function () {
    let url = "send";
    request.open("POST", url, true);
    request.setRequestHeader("authorization", username.value);
    request.send(mes.value);
};

// Vue.component('messager',{
//     template:"<h1>自定义组件!</h1>"
// });
new Vue({
    el: '#mess',
    data: {
        mess: "ojg!"
    }
});
