var express = require('express');
var path = require('path');
var router = express.Router();
var fs = require('fs');
var common = require('../kb/common');
var lunr = require('lunr');
var config = common.read_config();


// search kb's
router.post('/', common.restrict, function (req, res){
    var db = req.app.db;
    common.config_expose(req.app);
    var search_term = req.body.frm_search;
    var lunr_index = req.app.index;

    // we strip the ID's from the lunr index search
    var lunr_id_array = [];
    lunr_index.search(search_term).forEach(function (id){
        // if mongoDB we use ObjectID's, else normal string ID's
        if(config.settings.database.type !== 'embedded'){
            lunr_id_array.push(common.getId(id.ref));
        }else{
            lunr_id_array.push(id.ref);
        }
    });

    var featuredCount = config.settings.featured_articles_count ? config.settings.featured_articles_count : 4;

    // get sortBy from config, set to 'kb_viewcount' if nothing found
    var sortByField = typeof config.settings.sort_by.field !== 'undefined' ? config.settings.sort_by.field : 'kb_viewcount';
    var sortByOrder = typeof config.settings.sort_by.order !== 'undefined' ? config.settings.sort_by.order : -1;
    var sortBy = {};
    sortBy[sortByField] = sortByOrder;

    // we search on the lunr indexes
    common.dbQuery(db.kb, {_id: {$in: lunr_id_array}, kb_published: 'true', kb_versioned_doc: {$ne: true}}, null, null, function (err, results){
        common.dbQuery(db.kb, {kb_published: 'true', kb_featured: 'true'}, sortBy, featuredCount, function (err, featured_results){
            res.render('moni/problem', {
                title: 'Search results: ' + search_term,
                search_results: results,
                user: req.session.moni.user,
                search_term: search_term,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type'),
                config: config,
                helpers: req.handlebars
            });
        });
    });
});

router.get('/articles/:tag', function (req, res){
    var db = req.app.db;
    var lunr_index = req.app.index;
    
    // we strip the ID's from the lunr index search
    var lunr_id_array = [];
    lunr_index.search(req.params.tag + '*').forEach(function (id){
        lunr_id_array.push(id.ref);
    });
    
    // we search on the lunr indexes
    common.dbQuery(db.kb, {_id: {$in: lunr_id_array}}, {kb_published_date: -1}, null, function (err, results){
        res.render('moni/solution', {
            title: 'Articles',
            results: results,
            session: req.session,
            message: common.clear_session_value(req.session, 'message'),
            message_type: common.clear_session_value(req.session, 'message_type'),
            search_term: req.params.tag,
            config: config,
            helpers: req.handlebars
        });
    });
});

// search kb's
router.get(['/search/:tag', '/topic/:tag'], common.restrict, function (req, res){
    var db = req.app.db;
    common.config_expose(req.app);
    var search_term = req.params.tag;
    var lunr_index = req.app.index;
    
    // determine whether its a search or a topic
    var routeType = 'search';
    if(req.path.split('/')[1] === 'topic'){
        routeType = 'topic';
    }
    
    // we strip the ID's from the lunr index search
    var lunr_id_array = [];
    lunr_index.search(search_term).forEach(function (id){
        // if mongoDB we use ObjectID's, else normal string ID's
        if(config.settings.database.type !== 'embedded'){
            lunr_id_array.push(common.getId(id.ref));
        }else{
            lunr_id_array.push(id.ref);
        }
    });
    
    var featuredCount = config.settings.featured_articles_count ? config.settings.featured_articles_count : 4;
    
    // get sortBy from config, set to 'kb_viewcount' if nothing found
    var sortByField = typeof config.settings.sort_by.field !== 'undefined' ? config.settings.sort_by.field : 'kb_viewcount';
    var sortByOrder = typeof config.settings.sort_by.order !== 'undefined' ? config.settings.sort_by.order : -1;
    var sortBy = {};
    sortBy[sortByField] = sortByOrder;
    
    // we search on the lunr indexes
    common.dbQuery(db.kb, {_id: {$in: lunr_id_array}, kb_published: 'true', kb_versioned_doc: {$ne: true}}, null, null, function (err, results){
        common.dbQuery(db.kb, {kb_published: 'true', kb_featured: 'true'}, sortBy, featuredCount, function (err, featured_results){
            res.render('moni/problem', {
                title: 'Search results: ' + search_term,
                search_results: results,
                user_page: true,
                session: req.session,
                featured_results: featured_results,
                routeType: routeType,
                message: common.clear_session_value(req.session, 'message'),
                message_type: common.clear_session_value(req.session, 'message_type'),
                search_term: search_term,
                config: config,
                helpers: req.handlebars
            });
        });
    });
});
module.exports = router;