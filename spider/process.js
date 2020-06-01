var nodejieba = require("nodejieba");
var pgsql = require('./pg.js');
var fs = require("fs");
var readLine = require("readline");
var fetchAddSql = 'select id_fetches, content from fetches where id_fetches < 20';

var stop_words = new Set();

fs.readFile('./search_site/spider/hit_stopwords.txt','utf-8', function(err, data) {
    if(err) {
        console.log(err);
    } else {
        var temp = data.split('\n');
        console.log(temp.length);
        for(var i = 0; i < temp.length; i++) {
            stop_words.add(temp[i]);
        }
    }
})

// //执行sql，数据库中fetch表里的url属性是unique的，不会把重复的url内容写入数据库
pgsql.query_noparam(fetchAddSql, function(err, result) {
    for(var i = 0; i < result.rows.length; i++) {
        console.log(result.rows[i])
        console.log(typeof(result.rows[i]));
        var words = nodejieba.cut(result.rows[i].content);
        console.log(words);
        var id_fetch = result.rows[i].id_fetches;
        var insert_word_Sql;
        var insert_word_Params;
        for(var j = 0; j < words.length; j++) {
            if(!stop_words.has(words[j]) && words[j].length > 1) {
                insert_word_Sql = 'insert into Splitwords(id_fetches, word)' + ' VALUES ($1, $2)';
                insert_word_Params = [id_fetch, words[j]];  
                // console.log(words[j]);
                pgsql.query(insert_word_Sql,insert_word_Params, function(err, result) {
                    if(err) {
                        console.log(err);
                    }
                });
            }
        }
    }
    
});

