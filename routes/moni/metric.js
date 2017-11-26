var util = require("util")
var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();

/* GET metric page. */
router.get('/', function(req, res) {
  var db = req.app.db;
  if(req.session.moni.user ==null){
    res.redirect('/login');
  }
  else{
    db.moni_categorys.find({}, function (err, docs) {
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
      res.render('moni/metric', {
        title: '监控显示',
        result: loadedURL.metric,
        normalMenu: loadedURL.normalMenu,
        alertMenu: null,
        user: req.session.moni.user
      });
    });
  }
});

// /metric/normal/:id
router.get('/monitor/:id', function(req, res) {
  if(req.session.moni.user!=null){
      var db = req.app.db;
      var categoryId = req.params.id-1;
      db.moni_categorys.find({}, function (err, docs) {
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
        res.render('moni/metric', {
          title: obj.category_name+'显示',
          result: loadedURL.metric,
          normalMenu: loadedURL.normalMenu,
          alertMenu: null,
          user: req.session.moni.user
        });
    });
  }else{
    res.redirect('/login');
  }

});

module.exports = router;
