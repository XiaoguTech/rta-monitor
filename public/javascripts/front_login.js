$('#loginUsername').bind('keyup', function(event) {
    if (event.keyCode == "13") {
        $('#loginSubmitButton').click();
    }
});
$('#loginPassword').bind('keyup', function(event) {
    if (event.keyCode == "13") {
        $('#loginSubmitButton').click();
    }
});
$('#loginSubmitButton').click(function(){
    checkUser();
});
function checkUser(){
    var loginUsername =$("#loginUsername").val();
    var loginPassword=$("#loginPassword").val();
    var openid=$("#openid").val();
    var data={"username":loginUsername,"password":loginPassword,"openid":openid};
    if(loginUsername==""){
        $('#loginErrorMessage').html("用户名不能为空");
        setTimeout(function(){$('#loginErrorMessage').html("");},1500);
    }else if(loginPassword==""){
        $('#loginErrorMessage').html("密码不能为空");
        setTimeout(function(){$('#loginErrorMessage').html("");},1500);
    }else{
        $.ajax({
            url:"/checkLogin",
            type:"post",
            data:data,
            success:function(data,status){
                if(status=="success"){
                    location.href="/";
                }
            },
            error:function(data,status){
                if(status=="error"){
                    $('#loginErrorMessage').html("用户名或密码错误");
                    setTimeout(function(){$('#loginErrorMessage').html("");},1500);
                }
            }
        });
    }
    return false;
}