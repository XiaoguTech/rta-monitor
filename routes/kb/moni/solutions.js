var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require('fs');
var getSlug = require('speakingurl');
var common = require('../common');
var _ = require('lodash');
var mime = require('mime-types');
var lunr = require('lunr');
var config = common.read_config();

var appDir = path.dirname(require('require-main-filename')());
//render solution orgs
router.get('/solutions',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db;
    common.dbQuery(db.moni_users, {}, null, null, function (err, solutions){
        res.render('kb/moni/moniorg_solution', {
            show_xiaogukb: true,
            title: 'Solutions',
            solutions: solutions,
            config: config,
            is_admin: req.session.is_admin,
            helpers: req.handlebars,
            session: req.session,
            message: common.clear_session_value(req.session, 'message'),
            message_type: common.clear_session_value(req.session, 'message_type')
        });
    });
});

//render coresponding org's solutions list
router.get('/solutions/:orgId',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            result._id = null;
            // result.arraylength = result.alertArray.length;
            res.render('kb/moni/monisolutions',{
                show_xiaogukb: true,
                title: 'Alert Solutions',
                result: result,
                config: config,
                is_admin: req.session.is_admin,
                helpers: req.handlebars,
                session: req.session,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type')
            });
        }
        else{
            var solutionDoc = {
                "orgID":req.params.orgId,
                "alertSumUrl":"",
                "alertArray":[]
            };

            db.insert(solutionDoc, function (err, solutionDoc){
                // show the view
                if(err){
                    console.error('Failed to insert solution: ' + err);
                }else{
                    solutionDoc._id = null;                    
                    res.render('kb/moni/monisolutions',{
                        show_xiaogukb: true,
                        title: 'Alert Solutions',
                        result: solutionDoc,
                        config: config,
                        is_admin: req.session.is_admin,
                        helpers: req.handlebars,
                        session: req.session,
                        message: common.clear_session_value(req.session, 'message'),
                        message_type: common.clear_session_value(req.session, 'message_type')
                    });                
                }
            });
        }
        return;
    });
    return;
});
//update sum alert panel url
router.post('/solutions/:orgId/updatesumpanelurl',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null && req.body.sumpanel_url!=null && req.body.sumpanel_url!=result.alertSumUrl){
            db.update({"orgID":req.params.orgId},{$set:{alertSumUrl:req.body.sumpanel_url}},{},function(){});
            req.session.message = req.i18n.__('Sum alert panel updated');
            req.session.message_type = 'success';
            res.redirect(req.app_context+'/solutions/'+req.params.orgId);
        }else{
            res.status(400).json({message:"some error occured in updatesumpanelurl"});
        }
        return;
    });
    return;
});
//new a solution
router.get('/solutions/:orgId/new',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            result._id = null;
            res.render('kb/moni/monisolution_new',{
                show_xiaogukb: true,
                title: 'Solutions',
                result: result,
                config: config,
                is_admin: req.session.is_admin,
                helpers: req.handlebars,
                session: req.session,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type')
            });
        }else{
            res.status(400).json({message:"error occured in new a solution"});
        }
        return;
    });
    return;
});
//insert a new solution
router.post('/solutions/:orgId/insert',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            var iAlertIndex = result.alertArray.findIndex(function(element){
                return element.alertID === req.body.new_alertId;
            });
            if(iAlertIndex === -1){
                var oDoc = {
                    alertID:req.body.new_alertId,
                    openKBURL:req.body.new_openKB,
                    alertPanelURL:req.body.new_alertPanel
                };
                result.alertArray.push(oDoc);
                db.update({"orgID":req.params.orgId},{$set:{alertArray:result.alertArray}},{},function(){});
                req.session.message = req.i18n.__('Sum alert panel updated');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/solutions/'+req.params.orgId);
            }else{
                res.status(400).json({message:"error alertid conflict"});
            }
        }
        return;
    });
    return;
});
//render edit solution page
router.get('/solutions/:orgId/edit/:alertId',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            var iAlertIndex = result.alertArray.findIndex(function(element){
                return element.alertID === req.params.alertId;
            });
            if(iAlertIndex === -1){
                res.status(400).json({message:"error occured in edit a solution alertID"});
            }else{
                var oDoc = {
                    orgID:req.params.orgId,
                    alertID:req.params.alertId,
                    openKBURL:result.alertArray[iAlertIndex].openKBURL,
                    alertPanelURL:result.alertArray[iAlertIndex].alertPanelURL
                };
                res.render('kb/moni/monisolution_edit',{
                    show_xiaogukb: true,
                    title: 'Edit Solutions',
                    result: oDoc,
                    config: config,
                    is_admin: req.session.is_admin,
                    helpers: req.handlebars,
                    session: req.session,
                    message: common.clear_session_value(req.session, 'message'),
                    message_type: common.clear_session_value(req.session, 'message_type')
                });
            }
        }else{
            res.status(400).json({message:"error occured in edit a solution"});
        }
        return;
    });
    return;
});
//render edit solution page
router.get('/solutions/:orgId/delete/:alertId',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            var iAlertIndex = result.alertArray.findIndex(function(element){
                return element.alertID === req.params.alertId;
            });
            if(iAlertIndex !== -1){
                result.alertArray.splice(iAlertIndex,1);
                db.update({"orgID":req.params.orgId},{$set:{alertArray:result.alertArray}},{},function(){});
                req.session.message = req.i18n.__('Rule deleted');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/solutions/'+req.params.orgId);
            }
        }else{
            res.status(400).json({message:"error occured in edit a solution"});
        }
        return;
    });
    return;
});
//update a solution
router.post('/solutions/:orgId/update',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_solutions;
    db.findOne({"orgID":req.params.orgId},function(err,result){
        if(result!=null){
            var iAlertIndex = result.alertArray.findIndex(function(element){
                return element.alertID === req.body.old_alertId;
            });
            if(iAlertIndex === -1){
                res.status(400).json({message:"error occured in update a solution alertID"});
            }else{
                var oDoc = {
                    alertID:req.body.new_alertId,
                    openKBURL:req.body.new_openKB,
                    alertPanelURL:req.body.new_alertPanel
                };
                result.alertArray.splice(iAlertIndex,1,oDoc);
                db.update({"orgID":req.params.orgId},{$set:{alertArray:result.alertArray}},{},function(){});
                req.session.message = req.i18n.__('alert rule updated');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/solutions/'+req.params.orgId);
            }
        }else{
            res.status(400).json({message:"error occured in edit a solution"});
        }
        return;
    });
    return;
});
module.exports = router;