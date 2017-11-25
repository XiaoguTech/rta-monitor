var express = require('express');
var util = require('util');
var router = express.Router();
var fs=require('fs');

/* GET alert page. */
router.get('/', function(req, res, next) {
  var orgID=req.session.user;
  var db = req.app.db;  
  if(req.session.user!=null){
    db.alerts.find({"orgID":orgID},function(err,data){
      if(data.length){
        var jsonObj=data[0];
        var alertArray=jsonObj["alertArray"];
        var latestTime=alertArray[0].time;
        var latestMessage=alertArray[0].message;
        for(var obj in alertArray){
          var time=new Date(alertArray[obj].time);
          var showTime=time.getFullYear()+"-"+(time.getMonth()+1)+"-"+time.getDate()+" "+time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
          alertArray[obj].time=showTime;
        }
      }
      var formatTime=alertArray[0].time;
      res.render('alert', { title: '报警信息',user: req.session.user,alertArray:alertArray,latestTime:latestTime,latestMessage:latestMessage,formatTime:formatTime});

    });    
  }else{
    res.redirect('/login');     
  }
});

router.get('/refresh',function(req,res){
  var orgID=req.session.user;
  var db = req.app.db;  
  db.alerts.find({"orgID":orgID},function(err,data){
    if(data.length){
      var jsonObj=data[0];
      var alertArray=jsonObj["alertArray"];
      var latestTime=alertArray[0].time;
      var latestMessage=alertArray[0].message;
      for(var obj in alertArray){
        var time=new Date(alertArray[obj].time);
        var showTime=time.getFullYear()+"-"+(time.getMonth()+1)+"-"+time.getDate()+" "+time.getHours()+":"+time.getMinutes()+":"+time.getSeconds();
        alertArray[obj].time=showTime;
      }
    }
    var formatTime=alertArray[0].time;
    res.send(alertArray);
  });    

});
/*
return size from timestamp:intenger
 */
router.get('/getNewNum',function(req,res){
  var dTimeStamp = req.query.timestamp;
  var sOrgID = req.session.user;
  var db = req.app.db.alerts;
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
          message:"not found newer than your time stamp"
        });
      }else{
        return res.status(200).json({iNewNum:iAlertIndex});
      }
    }
  });
});



/*
get 方法
alert/getLatestMessage?timestamp=xxx
if 新消息的数量==0 返回数量
else if 新消息的数量>0 返回数量、最新的消息内容和最新的时间戳
 */

router.get('/getLatestMessage',function(req,res){
  var dTimeStamp = req.query.timestamp;
  var sOrgID = req.session.user;
  var db = req.app.db.alerts;
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
          message:"not found",
          iNewNum:iAlertIndex,
          sMessage:aAlert[0].message,
          sTime:aAlert[0].time
        });
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
  });
});
module.exports = router;
