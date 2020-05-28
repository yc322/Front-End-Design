var express = require('express');
var router = express.Router();
var pgsql = require('../pg.js');


var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const cookieParser=require("cookie-parser");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/process_getall', function(request, response) {
    fetchSql = "select publish_date, source_name, count(*) as num from fetches  group by publish_date, source_name having count(*) > 10";
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
})

router.get('/process_getuserinfo', function(request, response)  {
    fetchSql = "select  username, count(*) as num from logs group by username";
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
})

router.get('/check', function(request, response) {
    var oUname = request.cookies.username;
    if(typeof(oUname) != undefined) {
        console.log(oUname);
        var fetch_name_Sql = 'select * from UserInfo where name= $1';
        var fetch_name_Sql_Params = [oUname];
        pgsql.query(fetch_name_Sql, fetch_name_Sql_Params, function(err, result) {
            // console.log(result);
            if (err) {
                // console.log(err)
                console.log(err);
            } else { 
                if(result.rows.length == 0) {
                    console.log("the user not login");                    
                    response.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    response.write('false');
                    response.end();
                    return ;
                }
                response.writeHead(200, {
                    "Content-Type": "application/json"
                });
                response.write('true');
                response.end();
                return ;
            }
        });
    } else {
        response.writeHead(200, {
            "Content-Type": "application/json"
        });
        response.write('false');
        // console.log(response);
        response.end();
        return ;
    }
});


router.get('/process_get', function(request, response) {
    //sql字符串和参数
    console.log(request.query.title);
    console.log(request.query.sort);
    var oUname = request.cookies.username;
    if(typeof(oUname) != undefined) {
    console.log("*****************************");
    var title = request.query.title;
    var fetchSql;
    try {
        var params = title.split(' ');
        if(params.length == 3) {
            var op = params[1];
            console.log(op);
            if(op.toLowerCase() == 'and') {
                fetchSql = "select url,source_name,title,author,publish_date " +
        "from fetches where title like '%" + params[0] + "%'" + "and title like '%" + params[2] + "%'"
        "order by " + request.query.sort;
            } 
            if(op.toLowerCase() == 'or') {
                fetchSql = "select url,source_name,title,author,publish_date " +
        "from fetches where title like '%" + params[0] + "%'" + "or title like '%" + params[2] + "%'"
        "order by " + request.query.sort;
            }
        } else {
            fetchSql = "select url,source_name,title,author,publish_date " +
        "from fetches where title like '%" + request.query.title + "%'" +
        " order by " + request.query.sort;
        }
        console.log(fetchSql);
        pgsql.query_noparam(fetchSql, function(err, result, fields) {
            if(err) {
                console.log(err)
            }

            var fetchInsertSql = 'INSERT INTO Logs (username, operation)' + 'VALUES ($1, $2)';
            var fetchInsertSql_Params = [oUname, 'query: ' + request.query.title + " order by " + request.query.sort];
            pgsql.query(fetchInsertSql, fetchInsertSql_Params, function(err,result) {
                if(err) {
                    console.log(err);
                }
            })

            response.writeHead(200, {
                "Content-Type": "application/json"
            });
            console.log(result.rows);
            response.status = true;
            response.write(JSON.stringify(result.rows));
            response.end();
        });
    }catch(e) {
        console.log(e);
    }
});

router.post('/process_login', urlencodedParser, function (req, res) {
    oUname = req.body.name;
    oUpass = req.body.passwd;
    console.log(oUname);
    var response = {};
    var fetch_name_Sql = 'select passwd from UserInfo where name= $1';
    var fetch_name_Sql_Params = [oUname];
    pgsql.query(fetch_name_Sql, fetch_name_Sql_Params, function(err, result) {
        // console.log(result);
        if (err) {
            console.log(err)
        } else { 
            if(result.rows.length == 0) {
                console.log("the user not regist");
                response.status = 'not regist';
                console.log('not regist');
                console.log(response);
                res.end(JSON.stringify(response));
                return ;
            }
            right_passwd = result.rows[0].passwd;
            console.log("query result " + result.rows[0].passwd);
            if(right_passwd != null && right_passwd == oUpass) {
                var fetchInsertSql = 'INSERT INTO Logs (username, operation)' + 'VALUES ($1, $2)';
                var fetchInsertSql_Params = [oUname, 'login'];
                pgsql.query(fetchInsertSql, fetchInsertSql_Params, function(err,result) {
                    if(err) {
                        console.log(err);
                    }
                })
                response.status = 'login success';
                // Cookie cookie = new Cookie"user", oUname);
                res.cookie("username", oUname);
                console.log(response);
                res.end(JSON.stringify(response));
                return ;
            } else {
                response.status = 'passwd error';
                console.log('passwd error');
                console.log(response);
                res.end(JSON.stringify(response));
                return ;
            }
        }}
    )
})


router.post('/process_regist', urlencodedParser, function (req, res) {
    response = {};
    oUname = req.body.name;
    oUpass = req.body.passwd;
    console.log(oUname);

    var fetch_name_Sql = 'select name from UserInfo where name= $1';
    var fetch_name_Sql_Params = [oUname];
    pgsql.query(fetch_name_Sql, fetch_name_Sql_Params, function(err, result) {
        if (err) {
            console.log(err)
        } else { 
            if(result.rows[0] != null) {
                console.log("the user have regist")

                response.status = false;
                console.log(response);
                res.end(JSON.stringify(response));
                return ;
            } else {
                var fetchAddSql = 'INSERT INTO UserInfo (name, passwd)' + 'VALUES ($1, $2)';
                var fetchAddSql_Params = [oUname, oUpass];

                pgsql.query(fetchAddSql, fetchAddSql_Params, function(err, result) {
                    if(err) {
                        console.log(err);
                        oError.innerHTML = "用户注册失败";
                        response.status = false;
                        console.log(response);
                        res.end(JSON.stringify(response));
                        return ;
                    } else {
                        var fetchInsertSql = 'INSERT INTO Logs (username, operation)' + 'VALUES ($1, $2)';
                        var fetchInsertSql_Params = [oUname, 'regist'];
                        pgsql.query(fetchInsertSql, fetchInsertSql_Params, function(err,result) {
                            if(err) {
                                console.log(err);
                            }
                        })
                    }
                });
                response.status = true;
                console.log(response);
                res.end(JSON.stringify(response));
            }
        }
    });
})

module.exports = router;
