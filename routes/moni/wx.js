var async=require('async');
var express = require('express');
var fs=require('fs');
var http=require('http');
var https=require('https');
var qs=require('querystring');
var rawBody=require('raw-body');
var sha1=require('sha1');
var utils=require('utils');
var xml2js=require('xml2js');

var router = express.Router();

var config={
    wechat:{
      appID:'wxdb3fd49799fafa0f',
      appSecret:'22d4ef99ea1984a33b44d18ee90f9d0a',
      token:'xiaogu',
      prefix:'https://api.weixin.qq.com'
    },
    api:{
        menu:{
            create:'/cgi-bin/menu/create?',
            get:'/cgi-bin/menu/get?',
            delete:'/cgi-bin/menu/delete?',
            genInfo:'/cgi-bin/menu/get_current_selfmenu_info?'
        }
    }
}

//GET 方法用于验证是否为微信服务器发起的请求
router.get('/', function(req, res, next) {
    if (checkSignature(req)) {
        res.send(200, req.query.echostr);
    }else {
        res.send(200, 'fail');
    }
});

router.post('/',async function(req,res,next){
    await checkAccessToken();
    var text="";
    var buf="";
    var midObject={};
    req.setEncoding('utf8');
    //二进制转 xml
    req.on('data', function(chunk){ 
        buf += chunk;
        // xml2js 默认将子节点的值变为数组，将 explicitArray 设为 false 即可
        xml2js.parseString(buf,{explicitArray : false},function(err, json) {
            midObject.err=err;
            midObject.json=json;
        });
        if(midObject.err){
            throw midObject.err;
        }else{
            var createTime = new Date().getTime();   
            console.log(midObject.json);         
            if(midObject.json.xml.MsgType === 'event'){
                if(midObject.json.xml.Event === 'subscribe'){
                    text=text+'<xml>'+
                    '<ToUserName><![CDATA['+ midObject.json.xml.FromUserName +']]></ToUserName>'+
                    '<FromUserName><![CDATA['+ midObject.json.xml.ToUserName +']]></FromUserName>'+
                    '<CreateTime>'+createTime+'</CreateTime>'+
                    '<MsgType><![CDATA[text]]></MsgType>'+
                    '<Content><![CDATA[欢迎关注沈阳啸谷科技有限公司]]></Content>'+
                    '</xml>';
                }
              }
              else if(midObject.json.xml.MsgType === 'text'){
                text=text+'<xml>'+
                '<ToUserName><![CDATA['+ midObject.json.xml.FromUserName +']]></ToUserName>'+
                '<FromUserName><![CDATA['+ midObject.json.xml.ToUserName +']]></FromUserName>'+
                '<CreateTime>'+createTime+'</CreateTime>'+
                '<MsgType><![CDATA[text]]></MsgType>'+
                '<Content><![CDATA[您好，您的Openid是'+midObject.json.xml.FromUserName+']]></Content>'+
                '</xml>';
              }

            // handleMessage(midObject.json.xml,res);            
        }
    });
    req.on('end', function(chunk){ 
        res.status(200);
        res.contentType('application/xml');
        res.send(text);
    });
});

router.get('/redirect',function(req,res,next){
    var destination=req.query['jump'];
    var url="https://open.weixin.qq.com/connect/oauth2/authorize?appid="+config.wechat.appID+"&redirect_uri=http://wechat.xiaogu-tech.com/wx/oauth/?jump="+destination+"?response_type=code&scope=snsapi_base&state=1&connect_redirect=1#wechat_redirect";
    res.redirect(url);
    console.log(url);
    res.end();
});

router.get('/oauth',function(req,res,next){
    var code=req.query['code'];
    var url="https://api.weixin.qq.com/sns/oauth2/access_token?appid="+config.wechat.appID+"&secret="+config.wechat.appSecret+"&code="+code+"&grant_type=authorization_code";
    https.get(url, function(res) {
        res.on('data',function(d){
            try{
                data=JSON.parse(d);
                if(data.openid!=undefined){
                    console.log(data.openid);
                    res.render('index', { openid:openid});
                }else{
                    console.log("Fail to get a openid!");
                }
            }catch(e){
                console.log("An error happen when the services try to format a response for getting a openid");
            }
            // //有了用户的opendi就可以的到用户的信息了
            // //地址为https://api.weixin.qq.com/sns/userinfo?access_token=ACCESS_TOKEN&openid=OPENID&lang=zh_CN
            // //得到用户信息之后返回到一个页面
            // model.addAttribute("user", wechatUser);
            // return "vip/userInfo";
        })
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
});

// router.post('/createmenu',async  function(req,res,next){
//     await checkAccessToken();  
//     createMenu();
//     res.end();
// })





//验证微信签名
function checkSignature(req){
    var token=config.wechat.token;
    var signature=req.query.signature;
    var nonce=req.query.nonce;
    var timestamp=req.query.timestamp;
    var echostr=req.query.echostr;
    //按字典排序，拼接字符串
    var str=[token,timestamp,nonce].sort().join('');
    //字符串加密
    var sha=sha1(str);
    if(sha===signature){
        return true;
    }else{
        return false;
    }
}

//检查 access_token 是否过期，过期则更新
function checkAccessToken(){
    fs.readFile('./data/access_token.db',function(err,data){
        if(err){
            throw err;
        }
        var jsonObj=JSON.parse(data);
        if(jsonObj['access_token']==undefined){
            console.log("There is no access_token now");
            getAccessToken();       
        }
        else{
            var current_time=new Date();
            var update_time=new Date(jsonObj.update_time);
            //距离上次更新 access_token 已经过去 7000
            if((current_time-update_time)>7000000){
                console.log("Access_token need to be updated");
                getAccessToken();            
            }else{
                config.wechat.access_token=jsonObj['access_token'];
            }
        }
    });
}


//获取 access_token
function getAccessToken(){
    var url=config.wechat.prefix+"/cgi-bin/token?grant_type=client_credential&appid="+config.wechat.appID+"&secret="+config.wechat.appSecret;
    https.get(url, function(res) {
        res.on('data',function(d){
            // process.stdout.write(d);            
            try{
                data=JSON.parse(d);
                if(data.access_token!=undefined){
                    console.log("Got a new access_token: "+data.access_token);
                    updateAccessToken(data.access_token);
                }else{
                    console.log("Fail to get a new access_token!");
                }
            }catch(e){
                console.log("An error happen when the services try to format a response for getting a new access_token");
            }
        })
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}

//更新 access_token 文件
function updateAccessToken(access_token){
    var date=new Date();
    var obj={};
    obj.access_token=access_token;
    obj.update_time=date;
    fs.writeFile('./data/access_token.db',JSON.stringify(obj),function(err){
        if(err){
            throw err;
        }
        console.log("A new access_token is saved");
    });
    config.wechat.access_token=access_token;
}



function createMenu(){
    checkAccessToken();
    fs.readFile('./data/menu.db',function(err,data){
        if(err){
            throw err;
        }
        var jsonStr=JSON.stringify(JSON.parse(data));
        // var url=config.wechat.prefix+config.api.menu.create+'access_token'+config.wechat.access_token;
        var post_options = {
            host: config.wechat.prefix,
            path: config.api.menu.create,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': jsonStr.length
            }
          };
         
          var post_req = http.request(post_options, function (response) {
            var responseText=[];
            var size = 0;
            response.on('data', function (data) {
              responseText.push(data);
              size+=data.length;
            });
            response.on('end', function () {
              responseText = Buffer.concat(responseText,size);
              console.log(responseText);
            });
          });

          post_req.end();
    });
}




module.exports = router;



  