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
    db.moni_categorys.findOne({"orgId":req.session.moni.user}, function (err, doc) {
      if(doc!=null){
        var loadedURL={};
        loadedURL.metric=[];
        loadedURL.normalMenu=[];
        loadedURL.metric.push.apply(loadedURL.metric,doc.categoryArray[0].metric);
        for(var i in doc.categoryArray){
          var obj={};
          obj.category_name=doc.categoryArray[i].category_name;
          obj.category_id=doc.categoryArray[i].category_id;
          loadedURL.normalMenu.push(obj);
        }
        res.render('moni/metric', {
          title: '监控显示',
          result: loadedURL.metric,
          normalMenu: loadedURL.normalMenu,
          alertMenu: null,
          user: req.session.moni.user,
          activeMetric:true
        });
      }else{
        res.render('moni/metric', {
          title: '监控显示',
          alertMenu: null,
          user: req.session.moni.user,
          activeMetric:true
        });
      }
      return;
    });
  }
  return;
});

// /metric/normal/:id
router.get('/monitor/:id', function(req, res) {
  if(req.session.moni.user!=null){
      var db = req.app.db;
      db.moni_categorys.findOne({"orgId":req.session.moni.user}, function (err, docs) {
        if(docs!=null){
          var categoryId = docs.categoryArray.findIndex(function(element){
            return element.category_id  === req.params.id;
          });
          if(categoryId!==-1){
            var loadedURL={};
            loadedURL.metric=[];
            loadedURL.normalMenu=[];

            loadedURL.metric.push.apply(loadedURL.metric,docs.categoryArray[categoryId].metric);
            for(var i in docs.categoryArray){
              var obj={};
              obj.category_name=docs.categoryArray[i].category_name;
              obj.category_id=docs.categoryArray[i].category_id;
              loadedURL.normalMenu.push(obj);
            }
            res.render('moni/metric', {
              title: '监控显示',
              result: loadedURL.metric,
              normalMenu: loadedURL.normalMenu,
              alertMenu: null,
              user: req.session.moni.user,
              activeMetric:true
            });
            
          }
        }
      return;
    });
  }else{
    res.redirect('/login');
  }

});

module.exports = router;
