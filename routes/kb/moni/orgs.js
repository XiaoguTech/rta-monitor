var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require('fs');
var getSlug = require('speakingurl');
var common = require('../common');
var _ = require('lodash');
var mime = require('mime-types');
var lunr = require('lunr');
var generator_passwd = require('generate-password');
var config = common.read_config();
var appDir = path.dirname(require('require-main-filename')());

// orgs display page
router.get('/orgs', common.restrict, function (req, res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var db = req.app.db;
    common.dbQuery(db.moni_users, {}, null, null, function (err, users){
        res.render('kb/moni/moniorgs', {
            show_xiaogukb: true,
            title: 'Orgs',
            users: users,
            config: config,
            is_admin: req.session.is_admin,
            helpers: req.handlebars,
            session: req.session,
            message: common.clear_session_value(req.session, 'message'),
            message_type: common.clear_session_value(req.session, 'message_type')
        });
    });
});

// orgs
router.get('/org/edit/:id', common.restrict, function (req, res){
    var db = req.app.db;
    db.moni_users.findOne({_id: common.getId(req.params.id)}, function (err, user){
        // if the user we want to edit is not the current logged in user and the current user is not
        // an admin we render an access denied message
        if(req.session.is_admin === 'false'){
            req.session.message = req.i18n.__('Access denied');
            req.session.message_type = 'danger';
            res.redirect(req.app_context + '/orgs');
            return;
        }

        res.render('kb/moni/moniorg_edit', {
            show_xiaogukb: true,
            title: 'Org edit',
            user: user,
            session: req.session,
            message: common.clear_session_value(req.session, 'message'),
            message_type: common.clear_session_value(req.session, 'message_type'),
            helpers: req.handlebars,
            config: config
        });
    });
});

// delete user
router.get('/org/delete/:id', common.restrict, function (req, res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }

    var db = req.app.db;
    // remove the article
    if(req.session.is_admin === 'true'){
        db.moni_users.remove({_id: common.getId(req.params.id)}, {}, function (err, numRemoved){
            req.session.message = req.i18n.__('User deleted.');
            req.session.message_type = 'success';
            res.redirect(req.app_context + '/orgs');
        });
    }else{
        req.session.message = req.i18n.__('Access denied.');
        req.session.message_type = 'danger';
        res.redirect(req.app_context + '/orgs');
    }
});

// orgs
router.get('/org/new', common.restrict, function (req, res){
    // only allow admin
    if(req.session.is_admin !== 'true'){
        res.render('kb/error', {show_xiaogukb: true,message: 'Access denied', helpers: req.handlebars, config: config});
        return;
    }
    var defaulPasswd = generator_passwd.generate({length:6});
    res.render('kb/moni/moniorg_new', {
        show_xiaogukb: true,
        title: 'Org - New',
        defaulPasswd:defaulPasswd,
        session: req.session,
        message: common.clear_session_value(req.session, 'message'),
        message_type: common.clear_session_value(req.session, 'message_type'),
        config: config,
        helpers: req.handlebars
    });
});
// update a org
router.post('/org_update', common.restrict, function (req, res){
    var db = req.app.db;
    var bcrypt = req.bcrypt;
    var is_admin = req.body.user_admin === 'on' ? 'true' : 'false';

    // get the user we want to update
    db.moni_users.findOne({_id: common.getId(req.body.user_id)}, function (err, user){
        // if the user we want to edit is not the current logged in user and the current user is not
        // an admin we render an access denied message
        if(req.session.is_admin === 'false'){
            req.session.message = req.i18n.__('Access denied');
            req.session.message_type = 'danger';
            res.redirect(req.app_context + '/orgs');
            return;
        }
        // create the update doc
        var update_doc = {};
        update_doc.users_name = req.body.users_name;
        if(req.body.user_password){
            update_doc.user_password = req.body.user_password;
        }
        db.moni_users.update({_id: common.getId(req.body.user_id)},
            {
                $set: update_doc
            }, {multi: false}, function (err, numReplaced){
                if(err){
                    console.error('Failed updating user: ' + err);
                    req.session.message = req.i18n.__('Failed to update user');
                    req.session.message_type = 'danger';
                    res.redirect(req.app_context + '/org/edit/' + req.body.user_id);
                }else{
                    // show the view
                    req.session.message = req.i18n.__('User account updated.');
                    req.session.message_type = 'success';
                    res.redirect(req.app_context + '/orgs');
                }
            });
    });
});
// insert a org
router.post('/org_insert', common.restrict, function (req, res){
    var db = req.app.db;
    // sets up the opemkb document
    var defaulPasswd = generator_passwd.generate({length:6});
    var doc = {
        users_name: req.body.users_name,
        user_password: defaulPasswd
    };
    // check for existing user
    db.moni_users.findOne({'user_name': req.body.users_name}, function (err, user){
        if(user){
            // user already exists with that email address
            console.error('Failed to insert org, possibly already exists: ' + err);
            req.session.message = req.i18n.__('A user with that org already exists');
            req.session.message_type = 'danger';
            res.redirect(req.app_context + '/org/new');
        }else{
            // org is ok to be used.
            db.moni_users.insert(doc, function (err, doc){
                // show the view
                if(err){
                    console.error('Failed to insert user: ' + err);
                    req.session.message = req.i18n.__('User exists');
                    req.session.message_type = 'danger';
                    res.redirect(req.app_context + '/org/edit/' + doc._id);
                }else{
                    req.session.message = req.i18n.__('Org account inserted');
                    req.session.message_type = 'success';
                    res.redirect(req.app_context + '/orgs');
                }
            });
        }
    });
});

module.exports = router;