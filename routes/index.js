var express = require('express');
var router = express.Router();
var pgsql = require('../pg.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/process_get', function(request, response) {
    //sql字符串和参数
    console.log(request.query.title);
    console.log(request.query.sort);
    try {
        var fetchSql = "select url,source_name,title,author,publish_date " +
        "from fetches where title like '%" + request.query.title + "%'" +
        "order by " + request.query.sort;
        pgsql.query_noparam(fetchSql, function(err, result, fields) {
            if(err) {
                console.log(err)
            }
            response.writeHead(200, {
                "Content-Type": "application/json"
            });
            console.log(result.rows);
            response.write(JSON.stringify(result.rows));
            response.end();
        });
    }catch(e) {
        console.log(e);
    }
});
module.exports = router;
