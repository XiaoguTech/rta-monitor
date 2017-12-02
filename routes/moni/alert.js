var express = require('express');
var router = express.Router();
var util = require('util');
var fs=require('fs');

/* GET alert page. */
router.get('/', function(req, res, next) {
  if(req.session.moni.user!=null){
    var db = req.app.db.moni_solutions.findOne({"orgID":req.session.moni.user},function(err,result){
      if(result!=null){
        res.render('moni/alert', {
          title: '报警信息',
          user: req.session.moni.user,
          alertSumUrl:result.alertSumUrl,
          activeAlert:true
        });
      }
    });
  }else{
    res.redirect('/login');     
  }
  return;
});

router.get('/refresh',function(req,res){
  var orgID=req.session.moni.user;
  var db = req.app.db;
  db.moni_alerts.find({"orgID":orgID},function(err,data){
    if(err)return res.status(500).json({message:err});
    if(data[0]!=null){
      var jsonObj=data[0];
      var alertArray=jsonObj["alertArray"];
      var latestTime=alertArray[0].time;
      var latestMessage=alertArray[0].message;
      var alertObject={
        alertArray:alertArray,
        latestTime:latestTime,
        latestMessage:latestMessage
      };
    }
    res.send(alertObject);
    return;
  });    
});
/*
return size from timestamp:intenger
 */
router.get('/getNewNum',function(req,res){
  var dTimeStamp = req.query.timestamp;
  var sOrgID = req.session.moni.user;
  var db = req.app.db.moni_alerts;
  db.findOne({"orgID":sOrgID},function(err,result){
    if(result == null){
      // not found orgID
      return res.status(200).json({
        message:"not found your orgID",
        orgID:sOrgID
      });
    }else{
      // found
      var aAlert = result.alertArray;
      var iAlertIndex = aAlert.findIndex(function(element){
        return element.time <= dTimeStamp;
      });
      // not found 
      if(iAlertIndex === -1){
        return res.status(200).json({
          message:"not found"
        });
      }else{
        return res.status(200).json({iNewNum:iAlertIndex});
      }
    }
  });
});



/*
alert/getLatestMessage?timestamp=xxx
 */
router.get('/getLatestMessage',function(req,res){
  var dTimeStamp = req.query.timestamp;
  var sOrgID = req.session.moni.user;
  var db = req.app.db.moni_alerts;
  db.findOne({"orgID":sOrgID},function(err,result){
    if(result == null){
      // not found orgID
      return res.status(200).json({
        message:"not found your orgID",
        orgID:sOrgID
      });
    }else{
      // found
      var aAlert = result.alertArray;
      var iAlertIndex = aAlert.findIndex(function(element){
        return element.time <= dTimeStamp;
      });
      // not found 
      if(iAlertIndex === -1){
        if(aAlert.length>0){
          return res.status(200).json({
            message:"not found",
            sMessage:aAlert[0].message,
            sTime:aAlert[0].time
          });
        }else{
          return res.status(200).json({
            message:"not found",
            iNewNum:iAlertIndex,
          });
        }
      }else{
        if(iAlertIndex === 0){
          return res.status(200).json({
            iNewNum:iAlertIndex
          });
        }else{
          return res.status(200).json({
            iNewNum:iAlertIndex,
            sMessage:aAlert[0].message,
            sTime:aAlert[0].time
          });
        }
      }
    }
    return;
  });
  return;
});
module.exports = router;
