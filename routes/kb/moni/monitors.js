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
//monitor render monitor org list
router.get('/monitors',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db;
    common.dbQuery(db.moni_users, {}, null, null, function (err, categorys){
        res.render('kb/moni/moniorg_category', {
            show_xiaogukb: true,
            title: 'Categorys',
            categorys: categorys,
            config: config,
            is_admin: req.session.is_admin,
            helpers: req.handlebars,
            session: req.session,
            message: common.clear_session_value(req.session, 'message'),
            message_type: common.clear_session_value(req.session, 'message_type')
        });
    });
});
//monitor--->org---->category list
router.get('/monitors/:orgId',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            result._id = null;
            res.render('kb/moni/monicategorys', {
                show_xiaogukb: true,
                title: 'Categorys',
                result: result,
                config: config,
                is_admin: req.session.is_admin,
                helpers: req.handlebars,
                session: req.session,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type')
            });
        }else{
            var monitorDoc={
                "orgId":req.params.orgId,
                "categoryArray":[]
            }
            
            db.insert(monitorDoc, function (err, monitorDoc){
                // show the view
                if(err){
                    console.error('Failed to insert solution: ' + err);
                }else{
                    monitorDoc._id = null;                    
                    res.render('kb/moni/monicategorys', {
                        show_xiaogukb: true,
                        title: 'Categorys',
                        result: monitorDoc,
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
// create a new category under an orgnization
router.get('/monitors/:orgId/new',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            result._id = null;
            res.render('kb/moni/monicategory_new', {
                show_xiaogukb: true,
                title: 'Categorys',
                result: result,
                config: config,
                is_admin: req.session.is_admin,
                helpers: req.handlebars,
                session: req.session,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type')
            });
        }else{
            res.status(500).json({error:err});
        }
        return;
    });
    return;
});
//insert a category to the org
router.post('/monitors/:orgId/category_insert',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var aCategory = result.categoryArray;
            var iCategoryIndex = aCategory.findIndex(function(element){
                return element.category_name === req.body.category_name;
            });
            if(iCategoryIndex === -1){
                var oCategory = {
                    category_name:req.body.category_name,
                    category_id:aCategory.length.toString(),
                    metric:new Array()
                };
                db.update({"orgId":req.params.orgId},{$push:{categoryArray:oCategory}},{},function(){});
                req.session.message = req.i18n.__('Category inserted');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/monitors/'+req.params.orgId);
            }
            return;
        }
    });
    return;
});
//edit category
router.get('/monitors/:orgId/edit/:category_id',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result) {
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found category"});
            }else{
                var oCategory = result.categoryArray[iCategoryIndex];
                oCategory.orgId = req.params.orgId;
                oCategory._id = null;
                res.render('kb/moni/monicategory_edit',{
                    show_xiaogukb: true,
                    title: 'Edit Categorys',
                    result: oCategory,
                    config: config,
                    is_admin: req.session.is_admin,
                    helpers: req.handlebars,
                    session: req.session,
                    message: common.clear_session_value(req.session, 'message'),
                    message_type: common.clear_session_value(req.session, 'message_type')
                });
            }
            return;
        }
    });
    return;
});
//update category
router.post('/monitors/:orgId/category_update',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.body.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"error category id not found"});
            }else if(result.categoryArray[iCategoryIndex] === req.body.category_name){
                res.status(400).json({message:"error category name conflict"});
            }else{
                var aCategory = result.categoryArray;
                var oCategory = {
                    category_name:req.body.category_name,
                    category_id:req.body.category_id,
                    metric:aCategory[iCategoryIndex].metric
                };
                aCategory.splice(iCategoryIndex,1,oCategory);
                db.update({"orgId":req.params.orgId},{$set:{categoryArray:aCategory}},{},function(){});
                req.session.message = req.i18n.__('Category inserted');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/monitors/'+req.params.orgId);
            }
        }
        return;
    });
    return;
});
//delete category
router.get('/monitors/:orgId/delete/:category_id',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"error category id not found"});
            }else{
                var aCategory = result.categoryArray;
                aCategory.splice(iCategoryIndex,1);
                db.update({"orgId":req.params.orgId},{$set:{categoryArray:aCategory}},{},function(){});
                req.session.message = req.i18n.__('Category deleted');
                req.session.message_type = 'success';
                res.redirect(req.app_context+'/monitors/'+req.params.orgId);
            }
        }
        return;
    });
    return;
});
//display panel lists
router.get('/monitors/:orgId/:category_id',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found your category id"});
            }else{
                var oCategory = result.categoryArray[iCategoryIndex];
                oCategory.orgId = req.params.orgId;
                oCategory._id = null;
                res.render('kb/moni/monipanels',{
                    show_xiaogukb: true,
                    title: 'Panels',
                    result: oCategory,
                    config: config,
                    is_admin: req.session.is_admin,
                    helpers: req.handlebars,
                    session: req.session,
                    message: common.clear_session_value(req.session, 'message'),
                    message_type: common.clear_session_value(req.session, 'message_type')
                });
            }
        }
        return;
    });
    return;
});
//new a panel
router.get('/monitors/:orgId/:category_id/new',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found your category"});
            }else{
                var oCategory = result.categoryArray[iCategoryIndex];
                oCategory.orgId = req.params.orgId;
                oCategory._id = null;
                res.render('kb/moni/monipanel_new',{
                    show_xiaogukb: true,
                    title: 'Panels',
                    result: oCategory,
                    config: config,
                    is_admin: req.session.is_admin,
                    helpers: req.handlebars,
                    session: req.session,
                    message: common.clear_session_value(req.session, 'message'),
                    message_type: common.clear_session_value(req.session, 'message_type')
                });
            }
        }
        return;
    });
    return;
});
// insert a new panel,need to fix some array findindex bug
router.post('/monitors/:orgId/:category_id/panel_insert',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found your category id"});
            }else{
                var oCategory =  result.categoryArray[iCategoryIndex];
                var aMetric = oCategory.metric;
                var iMetricIndex = aMetric.findIndex(function(element){
                    return element.name === req.body.panels_name
                });
                if(iMetricIndex === -1){
                    var oMetric = {
                        name:req.body.panels_name,
                        url:req.body.panels_url
                    }
                    result.categoryArray[iCategoryIndex].metric.push(oMetric);
                    db.update({"orgId":req.params.orgId},{$set:{categoryArray:result.categoryArray}},{},function(){});
                    req.session.message = req.i18n.__('Category inserted');
                    req.session.message_type = 'success';
                    res.redirect(req.app_context+'/monitors/'+req.params.orgId+'/'+req.params.category_id);
                }else{
                    res.status(400).json({message:"not found your metric name"});
                }
            }
        }
        return;
    });
    return;
});
//edit a panel,render kb/monipanel_edit
router.get('/monitors/:orgId/:category_id/edit/:panel_name',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result) {
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found category"});
            }else{
                var iMetric = result.categoryArray[iCategoryIndex].metric.findIndex(function(element){
                    return element.name === req.params.panel_name;
                });
                if(iMetric === -1){
                    res.status(400).json({message:"error,not found your metric name"})
                }else{
                    var oDoc = {
                        name:result.categoryArray[iCategoryIndex].metric[iMetric].name,
                        url:result.categoryArray[iCategoryIndex].metric[iMetric].url,
                        orgId:req.params.orgId,
                        category_id:req.params.category_id,
                        category_name:result.categoryArray[iCategoryIndex].category_name
                    };
                    res.render('kb/moni/monipanel_edit',{
                        show_xiaogukb: true,
                        title: 'Edit Panels',
                        result: oDoc,
                        config: config,
                        is_admin: req.session.is_admin,
                        helpers: req.handlebars,
                        session: req.session,
                        message: common.clear_session_value(req.session, 'message'),
                        message_type: common.clear_session_value(req.session, 'message_type')
                    });
                }
            }
            return;
        }
    });
    return;
});
//delete a panel,render kb/monipanel_edit
router.get('/monitors/:orgId/:category_id/delete/:panel_name',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result) {
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"not found category"});
            }else{
                var iMetric = result.categoryArray[iCategoryIndex].metric.findIndex(function(element){
                    return element.name === req.params.panel_name;
                });
                if(iMetric === -1){
                    res.status(400).json({message:"error,not found your metric name"})
                }else{
                    result.categoryArray[iCategoryIndex].metric.splice(iMetric,1);
                    db.update({"orgId":req.params.orgId},{$set:{categoryArray:result.categoryArray}},{},function(){});
                    req.session.message = req.i18n.__('Panels deleted');
                    req.session.message_type = 'success';
                    res.redirect(req.app_context+'/monitors/'+req.params.orgId+'/'+req.params.category_id);
                }
            }
        }
        return;
    });
    return;
});
//update a panel
router.post('/monitors/:orgId/:category_id/panel_update',common.restrict,function(req,res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db.moni_categorys;
    db.findOne({"orgId":req.params.orgId},function(err,result){
        if(result != null){
            var iCategoryIndex = result.categoryArray.findIndex(function(element){
                return element.category_id === req.params.category_id;
            });
            if(iCategoryIndex === -1){
                res.status(400).json({message:"error category id not found"});
            }else{
                var iMetric = result.categoryArray[iCategoryIndex].metric.findIndex(function(element){
                    return element.name === req.body.panels_old_name;
                });
                if(iMetric===-1){
                    res.status(400).json({message:"error panel old name not found"});
                }else{
                    result.categoryArray[iCategoryIndex].metric[iMetric].name=req.body.panels_name;
                    result.categoryArray[iCategoryIndex].metric[iMetric].url=req.body.panels_url;
                    db.update({"orgId":req.params.orgId},{$set:{categoryArray:result.categoryArray}},{},function(){});
                    req.session.message = req.i18n.__('Panel updated');
                    req.session.message_type = 'success';
                    res.redirect(req.app_context+'/monitors/'+req.params.orgId+'/'+req.params.category_id);
                }
            }
        }
        return;
    });
    return;
});
module.exports = router;