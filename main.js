var sub = document.getElementById("submit");
var username = document.getElementById("username");
var mes = document.getElementById("message");
var request = new XMLHttpRequest();
sub.onclick = function () {
    let url = "send";
    request.open("POST", url, true);
    request.setRequestHeader("authorization", username.value);
    request.send(mes.value);
};
