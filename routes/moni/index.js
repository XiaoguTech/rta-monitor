var bodyParser=require('body-parser');
var express = require('express');
var fs=require('fs');
var util = require('util');
var querystring=require('querystring');
var router = express.Router();
var http = require('http');
var sha1 = require('sha1');

router.get('/', function(req, res, next) {
  res.render('index', { title: '首页',user: req.session.user});
});

// 登录
router.get('/login',function(req,res){
  var openid=req.query.openid;
  var openExist=false;
  //已经登录过直接跳出
  if(req.session.user!=null){
    res.redirect('/');
  }
  else{
    //有 openid 字段则验证其是否已经绑定
    if(openid!=undefined){
      fs.readFile('./data/openid.db',function(err,data){
        if(err){
          throw err;
        }
        var jsonObj=JSON.parse(data);
        var openList=jsonObj["open"];
        for(var obj in openList){
          if(openList[obj].openid==openid){
            req.session.user=openList[obj].username;
            req.session.openid=openList[obj].openid;
            openExist=true;
            break;
          }
        }
        if(openExist){
          res.redirect('/');
        }
        else{
          res.render('login',{ openid:openid});    
        }
      });
    }
    else{
      res.render('login');      
    }

  }
});

// 验证登录
router.post('/checkLogin',function(req,res){
  var uname=req.body['username'];
  var pwd=sha1(req.body['password']);
  var openid=req.body['openid'];
  var db = req.app.db;
  var status=400;    
  db.users.find({"userId":uname,"token":pwd},function(err,result){
    if(result.length!=0){
      if(openid!=undefined){
        fs.readFile('./data/openid.db',function(err,data){
          if(err){
            throw err;
          }
          var jsonObj=JSON.parse(data);
          var obj={};
          obj.username=uname;
          obj.openid=openid;
          jsonObj.open.push(obj);
          fs.writeFile('./data/openid.db',JSON.stringify(jsonObj),function(err){
            if(err){
                throw err;
            }
            console.log("A new openid is saved");
          });
        })
        status=200;
        req.session.user=uname;
        req.session.openid=openid; username
        req.session.orgId=result[0].orgId;  
        console.log("Bind and login");
      }else{
        status=200;
        req.session.user=uname;
        req.session.orgId=result[0].orgId;
        console.log("Login but not bind")
      }
    }
    res.status(status);
    res.end();
  });   
});

// 登出
router.get('/logout',function(req,res){
  if(req.session.openid!=null && req.session.openid!=""){
    fs.readFile('./data/openid.db',function(err,data){
      if(err){
        throw err;
      }
      var jsonObj=JSON.parse(data);
      var openList=jsonObj['open'];
      var num=-1;// 该用户在 openid 数据库的位置 
      for(var obj in openList){
        if(openList[obj].openid==req.session.openid){
          num=obj;
          break;
        }
      }
      if(num!=-1){
        openList.splice(num,1);
        jsonObj.open=openList;
        fs.writeFile('./data/openid.db',JSON.stringify(jsonObj),function(err){
          if(err){
              throw err;
          }
          console.log("An openid has been deleted");
        });
      }
      req.session.user=null;
      req.session.openid=null;
      req.session.orgId=null;      
      res.redirect('/');
    })
  }else{
    req.session.user=null;
    req.session.openid=null; 
    req.session.orgId=null;    
    res.redirect('/');
  }
});
module.exports = router;
