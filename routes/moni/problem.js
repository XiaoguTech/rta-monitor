var express = require('express');
var router = express.Router();
var fs = require('fs');
var common = require('../kb/common');
var lunr = require('lunr');
var config = common.read_config();

/* GET users listing. */
router.get('/', function(req, res, next) {
  var db = req.app.db;
  common.config_expose(req.app);
  // get sortBy from config, set to 'kb_viewcount' if nothing found
  var sortByField = typeof config.settings.sort_by.field !== 'undefined' ? config.settings.sort_by.field : 'kb_viewcount';
  var sortByOrder = typeof config.settings.sort_by.order !== 'undefined' ? config.settings.sort_by.order : -1;
  var sortBy = {};
  sortBy[sortByField] = sortByOrder;
  
  // get the top results based on sort order
  common.dbQuery(db.kb, {kb_published: 'true'}, sortBy, config.settings.num_top_results, function (err, top_results){
    res.render('moni/problem', {
      title: '常见问题',
      top_results: top_results,
      user: req.session.moni.user,
      message: common.clear_session_value(req.session, 'message'),
      message_type: common.clear_session_value(req.session, 'message_type'),
      config: config,
      helpers: req.handlebars
    });
    return;
  });
  return;
});

router.get('/:id',function(req,res){
  var db = req.app.db;
  var classy = require('../../public/javascripts/markdown-it-classy');
  var markdownit = req.markdownit;
  markdownit.use(classy);
  db.kb.findOne({kb_permalink:req.params.id}, function (err, doc) {
    if(doc==null)return res.status(404).json({messsage:"not found your kb_permalink"});
    var result = doc;
    res.render('moni/solution', {
      show_alert: false,
      title: result.kb_title,
      result: result,
      kb_body: common.sanitizeHTML(markdownit.render(result.kb_body)),
      openKBURL: req.params.id,
      user: req.session.moni.user
    });
    return;
  });
  return;
});

module.exports = router;
