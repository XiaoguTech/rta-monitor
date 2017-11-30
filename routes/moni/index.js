var bodyParser=require('body-parser');
var express = require('express');
var fs=require('fs');
var util = require('util');
var querystring=require('querystring');
var router = express.Router();
var http = require('http');
var sha1 = require('sha1');

router.get('/', function(req, res, next) {
  res.render('moni/index', { title: '首页',user: req.session.moni.user,activeIndex:true});
});

// 登录
router.get('/login',function(req,res){
  //已经登录过直接跳出
  if(req.session.moni.user!=null){
    res.redirect('/');
  }else{
      res.render('moni/login',{hide_footer:"hide_footer",hide_navigation:"hide_navigation"});
  }
});

// 验证登录
router.post('/checkLogin',function(req,res){
  var bcrypt = req.bcrypt;
  var db = req.app.db;
  var status = 400;
  db.moni_users.findOne({"users_name":req.body.username},function(err,user){
      if(user === undefined || user === null){
          console.log("error,null user");
      }else{
          // we have a user under that email so we compare the password
          if(bcrypt.compareSync(req.body.password, user.user_password) === true){
              // req.session.user = req.body.email;
              req.session.moni={};
              req.session.moni.user = user.users_name;
              req.session.moni.orgId = user._id.toString();
              status=200;
          }
      }
      res.status(status);
      res.end();
      return;
  });
    return;
});

// 登出
router.get('/logout',function(req,res){
    req.session.moni.user=null;
    req.session.moni.orgId=null;    
    res.redirect('/');
});
module.exports = router;
