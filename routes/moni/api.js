var express = require('express');
var path = require('path');
var fs = require('fs');
var util = require("util")
var router = express.Router();
var common = require('../data/common');

// get all alert info from db
router.get('/',function(req,res){
	var db = req.app.db;
	db.alerts.find({},function(err,docs){
	  res.send(util.inspect(docs,{depth:null}));
	})
});


// alert test post req.body
router.post('/test', function(req, res){
	var alertContents = req.body.series;
	// get an alert info,including: orgId,alertId,time,isRead,message,value
	var alertQuery = {};
	for(var i in alertContents){
		alertQuery.orgID = alertContents[i].name;
		alertQuery.time = alertContents[i].values[0][0];
		alertQuery.alertID = alertContents[i].tags.alertID;
		alertQuery.message = alertContents[i].values[0][2];
		alertQuery.value   = alertContents[i].values[0][3];
		break;
	}
	// db manupulation: alerts
	var db = req.app.db.alerts;
	// if db is null ,return status 200 and send message
	if(db == false){
		res.status(200).json({message:"db is null"});
		return ;
	}
	// using orgID searching through database
	db.findOne({"orgID":alertQuery.orgID},function(err,result){
		// not finding the orgID in database
		if(result == null){
			var aAlert = [];
			var oAlert = {
				time:alertQuery.time,
				alertID:alertQuery.alertID,
				message:alertQuery.message,
				value:alertQuery.value
			};
			aAlert.push(oAlert);
			var oOrg = {
				orgID:alertQuery.orgID,
				alertArray:aAlert
			};
			db.insert((oOrg), (err, ret) => {});
			res.status(200).json(oOrg);
			return;
		}else{
		// finding the result in the database
			var bChange = false;
			var aAlert = result.alertArray;
			if(aAlert.length>=100){
				aAlert.pop();
			}
			var iAlertIndex = aAlert.findIndex(function(element){
				return element.time === alertQuery.time;
			});
			// not finding the same time
			if(iAlertIndex === -1){
				var oAlert={
					time:alertQuery.time,
					alertID:alertQuery.alertID,
					message:alertQuery.message,
					value:alertQuery.value
				};
				result.alertArray.unshift(oAlert);
				bChange = true;
			}else if(iAlertIndex >= 0){
			// find the same time
				var oAlert={
					time:alertQuery.time,
					alertID:alertQuery.alertID,
					message:alertQuery.message,
					value:alertQuery.value
				};
				bChange = true;
				result.alertArray.unshift(oAlert);
			}
			// sort the data and flush data into the database
			if(bChange === true){
				// sort the alert array
				result.alertArray.sort(function(a,b){
					if(a.time > b.time){
						return -1;
					}else if(a.time < b.time){
						return 1;
					}else if(a.time === b.time){
						var aAlert_ = a.alertID.toUpperCase();
						var bAlert_ = b.alertID.toUpperCase();
						return aAlert_<bAlert_?-1:1;
					}
				});
				db.remove({"orgID":alertQuery.orgID}, {}, function (err, numRemoved) {});
				db.insert(result, (err, ret) => {});
				return res.status(200).json({
					message:"flush into database"
				});
			}else{
				// nothing change log
				return res.status(200).json({
					message:"nothing change"
				});
			}
		}
	});
	return;
});

// alert test get req.query
router.get('/test', function(req, res){
	var db = req.app.db;
	db.alerts.insert((req.query), (err, ret) => {});
	console.log(util.inspect(req.query,{depth:null}));
	res.send(util.inspect(req.query,{depth:null}));
});


// get all alert info from db
router.get('/alertdb',function(req,res){
	var db = req.app.db;
	db.alerts.find({},function(err,docs){
	  res.send(util.inspect(docs,{depth:null}));
	})
});


// insert alert solution: {corresponding alert panel and alert kb passage}
router.post('/solution', function(req,res){
	var oSolution = req.body.solution;
	var db = req.app.db.solutions;
	if(db == null){
		return res.status(200).json({messgae:"database is empty"});
	}else{
		db.findOne({"orgID":oSolution.orgID},function(err,result){
			if(result == null){
				db.insert(oSolution,(err,ret)=>{});
				return res.status(200).json({
					message:"inserted,but not found your orgID in the solution list",
					orgID:oSolution.orgID
				});
			}else{
				var bChange = false;
				var aAlert = result.alertArray;
				var iAlertIndex = aAlert.findIndex((element)=>{
					return element.alertID === oSolution.alertArray[0].alertID;
				});
				if(iAlertIndex === -1){
					result.alertArray.push(oSolution.alertArray[0]);
					bChange = true;
				}else{
					result.alertArray.remove(iAlertIndex);
					result.alertArray.push(oSolution.alertArray[0]);
					bChange = true;
				}
				if(bChange === true){
					db.remove({"orgID":oSolution.orgID}, {}, function (err, numRemoved) {});
					db.insert(result, (err, ret) => {});
					return res.status(200).json({message:"flush into database"});
				}
			}
		});
	}
	return ;
});

// req.query
// /api/solution?alertID=xxx
// return obj = {alertID:xxx,openKBURL:xxx,alertPanelURL:xxx}
router.get('/solution',function(req,res){
	var sAlertID = req.query.alertID;
	var sOrgID = req.session.user;
	var db = req.app.db.solutions;
	if(db == null){
		return res.status(200).json({messgae:"database is empty"});
	}else{
		db.findOne({"orgID":sOrgID},function(err,result){
			if(result == null){
				return res.status(200).json({
					message:"not found your orgID in the solution list",
					orgID:sOrgID
				});
			}else{
				var aArray = result.alertArray;
				var iAlertIndex = aArray.findIndex(function(element){
					return element.alertID === sAlertID;
				});
				if(iAlertIndex === -1){
					return res.status(200).json({
						message:"not found your alertID in the solution list",
						alertID:sAlertID
					});
				}else{
					return res.status(200).json(aArray[iAlertIndex]);
				}
			}
		});
	}
	return ;
});

// get all solution info from db
router.get('/solutiondb',function(req,res){
	var db = req.app.db;
	db.solutions.find({},function(err,docs){
	  res.send(util.inspect(docs,{depth:null}));
	})
});


module.exports = router;