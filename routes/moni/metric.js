var util = require("util")
var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var common = require('../data/common');

	// 读取json文件

/* GET metric page. */
router.get('/', function(req, res) {
  var db = req.app.db;
  if(req.session.user ==null){
    res.redirect('/login');
  }
  else{
    db.categorys.find({}, function (err, docs) {
      var loadedURL={};
      loadedURL.metric=[];
      loadedURL.normalMenu=[];
      loadedURL.metric.push.apply(loadedURL.metric,docs[0].metric);
      for(var i in docs){
        var obj={};
        obj.category_name=docs[i].category_name;
        obj.category_id=docs[i].category_id;
        loadedURL.normalMenu.push(obj);
      }
      res.render('metric', {
        title: '监控显示',
        result: loadedURL.metric,
        normalMenu: loadedURL.normalMenu,
        alertMenu: null,
        user: req.session.user
      });
    });
  }
});

// /metric/normal/:id
router.get('/monitor/:id', function(req, res) {
  if(req.session.user!=null){
      var db = req.app.db;
      var categoryId = req.params.id-1;
      db.categorys.find({}, function (err, docs) {
        var loadedURL={};
        loadedURL.metric=[];
        loadedURL.normalMenu=[];
        loadedURL.metric.push.apply(loadedURL.metric,docs[categoryId].metric);
        for(var i in docs){
          var obj={};
          obj.category_name=docs[i].category_name;
          obj.category_id=docs[i].category_id;
          loadedURL.normalMenu.push(obj);
        }
        res.render('metric', {
          title: obj.category_name+'显示',
          result: loadedURL.metric,
          normalMenu: loadedURL.normalMenu,
          alertMenu: null,
          user: req.session.user
        });
    });
  }else{
    res.redirect('/login');
  }

});

module.exports = router;
