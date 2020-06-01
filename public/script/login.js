
function fnLogin() {
    var oUname = document.getElementById("uname")
    var oUpass = document.getElementById("upass")
    var oError = document.getElementById("error_box")
    console.log(oUname);
    var isError = true;
    
    if (oUpass.value.length > 10 || oUpass.value.length < 3) {
        oError.innerHTML = "密码请输入3-10位字符"
        isError = false;
        return;
    }

    var params = '/process_login';
    $.post(params, {name: oUname.value,passwd: oUpass.value},function(text, status) {
        JSON.parse(text, function(k,v) {
            console.log(k);
            console.log(v);
            window.alert(v);
            if(v == 'login success') {
                window.location.href = "http://localhost:3000/search.html";
            }
            if(v == 'not regist') {
                window.location.href = "http://localhost:3000/regist.html";
            }
        })
        // if(text.status == 1) {
        //     window.alert("登陆成功");
        // } else if(text.status == 2){
        //     window.alert("密码错误");
        // }else {
        //     window.alert("未注册");
        // }
        // console.log(text);
        // for (let list of text) {
        //     console.log(Object.values(list));
        // }
        // console.log(typeof(text));
    })
    // window.alert("登录成功")
}

function Regist() {
    var oUname = document.getElementById("uname");
    var oUpass = document.getElementById("upass");
    var oError = document.getElementById("error_box")
    var isError = true;
    console.log(oUname.value);

    if (oUpass.value.length > 10 || oUpass.value.length < 3) {
        oError.innerHTML = "密码请输入6-20位字符"
        isError = false;
        return;
    }
    if (oUname.value.length > 10 || oUname.value.length < 3) {
        oError.innerHTML = "用户名请输入3-10位字符";
        isError = false;
        return;
    }
    var params = '/process_regist';
    $.post(params, {name: oUname.value,passwd: oUpass.value},function(text, status) {
        console.log(text);
        JSON.parse(text, function(k,v) {
            if(v == true) {
                window.alert("注册成功");
            } else {
                window.alert("已经注册过");
            }
            window.location.href = "login.html";
            // location.reload();
        })
    })
}