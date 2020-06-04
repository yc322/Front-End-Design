var nodejieba = require("nodejieba");
var pgsql = require('./pg.js');
var fs = require("fs");


var fetchGetSql = 'select id_fetches, word from splitwords where id_fetches > 1 and id_fetches < 20 group by word, id_fetches';


pgsql.query_noparam(fetchGetSql, function(err, result) {
    // console.log(result);
    var d;
    var getTotalNum = 'select count(distinct id_fetches) as num from splitwords ';
    pgsql.query_noparam(getTotalNum, function(err, res) {
        d = res.rows[0].num;
        console.log("d = " + d);
        for(var i = 0; i < result.rows.length; i++)  {
            // compute tf
            var word = result.rows[i].word;
            // console.log(word);
            var id = result.rows[i].id_fetches;
            // console.log(id);
            TFIDF(id, word, d);
       }
    });   
});


function TFIDF(id, word, d) {
    var getCountSql = 'select count(*) as num from splitwords where id_fetches = ' + id;
    var getAmountSql = 'select count(*) as num from splitwords where id_fetches = ' + id +' and word =\''  + word + '\'';
    var tf = 0.0;
    pgsql.query_noparam(getCountSql, function(err, result) {
        // console.log(getCountSql);
        tf = result.rows[0].num;
        // console.log("&&&&&& " + tf);
        pgsql.query_noparam(getAmountSql, function(err, result) {
            // console.log(getAmountSql);
            var temp = result.rows[0].num;
            tf = temp / tf;
            // console.log("tf =  " + tf);
            // compute idf
            var idf = d;
            var getIDFCount = 'select count(distinct id_fetches) as num from splitwords where word = \''+ word + '\'';
            pgsql.query_noparam(getIDFCount, function(err, result) {
                // console.log(getIDFCount);
                var temp = result.rows[0].num;
                idf = idf / temp;
                // console.log("idf = " + idf);
                idf = Math.log(idf);
                console.log('Result = ' + idf * tf + "word : " + word);
                var InsertSql = 'insert into WordWeight(id_fetches, word, weight)' + ' VALUES ($1, $2, $3)';
                var InsertParams = [id, word, idf * tf];
                pgsql.query(InsertSql, InsertParams, function(err, result) {
                    console.log(InsertSql);
                    if(err) {
                        console.log(err);
                    }
                });
            });
        });
    });
}