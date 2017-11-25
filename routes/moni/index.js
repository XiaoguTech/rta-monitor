var bodyParser=require('body-parser');
var express = require('express');
var fs=require('fs');
var util = require('util');
var querystring=require('querystring');
var router = express.Router();
var http = require('http');
var sha1 = require('sha1');

router.get('/', function(req, res, next) {
  res.render('moni/index', { title: '首页',user: req.session.moni.user});
});

// 登录
router.get('/login',function(req,res){
  //已经登录过直接跳出
  if(req.session.moni.user!=null){
    res.redirect('/');
  }else{
      res.render('moni/login');
  }
});

// 验证登录
router.post('/checkLogin',function(req,res){
  var uname=req.body['username'];
  var pwd=sha1(req.body['password']);
  var db = req.app.db;
  var status=400;    
  db.moni_users.findOne({"userId":uname,"token":pwd},function(err,result){
    if(result != null){
        status=200;
        req.session.moni={};
        req.session.moni.user=uname;
        req.session.moni.orgId=result.orgId;
    }
    res.status(status);
    res.end();
    return;
  });   
});

// 登出
router.get('/logout',function(req,res){
    req.session.moni.user=null;
    req.session.moni.orgId=null;    
    res.redirect('/');
});
module.exports = router;
