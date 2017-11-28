var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.moni.user!=null){
    res.render('moni/problem', {
      user: req.session.moni.user,
      activeProblem:true,
    });
  }else{
    res.redirect('/login');     
  }
});

module.exports = router;
