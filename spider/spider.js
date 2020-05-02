var source_name = "雪球网";
var domain = 'https://xueqiu.com/';
var myEncoding = "utf-8";
var seedURL = 'https://xueqiu.com/';
//var seedURL_format = "$('a[class=\"AnonymousHome_a__placeholder_3RZ\"]').attr(\"href\")";
var seedURL_format = "$('.AnonymousHome_home__timeline__item_3vU')"
var title_format = "$('.article__bd__title').text()";
var date_format = "$('.time').text()";
var author_format = "$('.name').text()";
var source_format = ""
var content_format = "$(\".article__bd__detail\").children().eq(2).text()";

var regExp = /((\d{4}|\d{2})(\-|\/|\.)\d{1,2}\3\d{1,2})|(\d{4}年\d{1,2}月\d{1,2}日)/;
var url_reg = /\/(\d{4})\/(\d{2})-(\d{2})\/(\d{7}).shtml/;

var pgsql = require('./pg.js');
var fs = require('fs');
var myIconv = require('iconv-lite');
var myRequest = require('request');
var myCheerio = require('cheerio');
require('date-utils');

//防止网站屏蔽我们的爬虫
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}

function request(url, callback) {//request module fetching url
    var options = {
        url: url,
        encoding: null,
        headers: headers,
        timeout: 10000
    }
    myRequest(options, callback)
}


request(seedURL, function (err, res, body) {
    var html = myIconv.decode(body, myEncoding);
    var $ = myCheerio.load(html, { decodeEntities: true });
    //console.log($("a[class='AnonymousHome_a__placeholder_3RZ']").attr("href"));
    try {
        seedurl_news = $('.AnonymousHome_home__timeline__item_3vU');
    } catch (e) { console.log('url列表所处的html块识别出错：' + e) };

    seedurl_news.each(function(){
        try {
            var url = seedURL.substr(0, seedURL.lastIndexOf('/'))  + $(this).find('.AnonymousHome_a__placeholder_3RZ').attr("href");
            // console.log($(this).find('.AnonymousHome_a__placeholder_3RZ').attr("href"));
            read_num = $(this).find('.AnonymousHome_read_2t5').text().replace("万","").replace("人阅读", "");
            category = $(this).find('.AnonymousHome_category_5zp').text().replace(" · ", "");
            //时间
            time = $(this).find('.AnonymousHome_auchor_1RR').children().last().text();
            time = time.split(/\s+/)[0];
            time = '2020-' + time;
            console.log("time " + time)
        }catch (e) { 
            console.log('识别种子页面中的新闻链接出错：' + e) 
        }
        var fetch = {};
        fetch.url = url;
        fetch.source_name = source_name;
        fetch.source_encoding = myEncoding; //编码
        fetch.category = category;
        fetch.read_num = read_num * 10000;
        fetch.publish_date = time;
        
        // not try to crawl the repeat page
        var fetch_url_Sql = 'select url from fetches where url= $1';
        var fetch_url_Sql_Params = [url];
        pgsql.query(fetch_url_Sql, fetch_url_Sql_Params, function(err, result) {
            if (err) {
                console.log(err)
            } else { // a new page
                if(result.rows[0] != null) {
                    console.log(result.rows[0]);
                    console.log("URL " + url + " repeat");
                } else {
                    getDetail(fetch, url);
                }
            }
        });
    });
});

function getDetail(fetch, url) {//request module fetching url
    request(url, function(err, res, body) {
        var html_news = myIconv.decode(body, myEncoding);
        var $ = myCheerio.load(html_news, { decodeEntities: true });
        console.log("转码读取成功:" + url);
        //动态执行format字符串，构建json对象准备写入文件或数据库
        fetch.title = "";
        fetch.content = "";
        //fetch.html = myhtml;
        fetch.crawltime = new Date();

        if (title_format == "") fetch.title = ""
        else fetch.title = eval(title_format); //标题

        if (author_format == "") fetch.author = source_name; //eval(author_format);  //作者
        else fetch.author = eval(author_format).replace("()" , "");

        //内容
        var content = ""
        for(var i = 2; i < $(".article__bd__detail").children().length; i++){
                //console.log($(".article__bd__detail").children().eq(i).text());
                content += $(".article__bd__detail").children().eq(i).text()
        }
        fetch.content = content
        var filename = source_name + "_" + (new Date()).toFormat("YYYY-MM-DD") +
            "_" + url.substr(url.lastIndexOf('/') + 1) + ".json";
        ////存储json
        fs.writeFileSync(filename, JSON.stringify(fetch));

        // save the result in postgresql
        var fetchAddSql = 'INSERT INTO fetches (url, source_name, source_encoding, title, author, publish_date, content, category, read_num)' 
        + 'VALUES ($1, $2,$3,$4,$5, $6, $7,$8, $9)';
        var fetchAddSql_Params = [fetch.url, fetch.source_name, fetch.source_encoding,
            fetch.title, fetch.author, fetch.publish_date,
            fetch.content, fetch.category, fetch.read_num
        ];

        //执行sql，数据库中fetch表里的url属性是unique的，不会把重复的url内容写入数据库
        pgsql.query(fetchAddSql, fetchAddSql_Params, function(err, result) {
            if(err) {
                console.log(err);
            }
        });
    })
}



// request(myURL, function (err, res, body) {
//     var html = body;  
//     var $ = myCheerio.load(html, { decodeEntities: false });
//     console.log($("a[class='AnonymousHome_a__placeholder_3RZ']").attr("href"));
//     console.log($('.AnonymousHome_read_2t5').text());
//     $('.AnonymousHome_home__timeline__item_3vU').each(function() {
//         var url = 'https://xueqiu.com' + $(this).find('.AnonymousHome_a__placeholder_3RZ').attr("href");
//         console.log(url);
//         // console.log($(this).find('.AnonymousHome_a__placeholder_3RZ').attr("href"));
//         console.log($(this).find('.AnonymousHome_read_2t5').text());
//         request(url, function(err, res, body) {
//             var html = body;  
//             var $ = myCheerio.load(html, { decodeEntities: false });
//             //console.log($.html());
//             console.log("title " + $('.article__bd__title').text());
//             console.log($("a[class='name']").attr("data-screenname"));
//             console.log("author " + $('.name').text());
//             console.log("time " + $('.time').text().replace("发布于", ""));
//             console.log($(".article__bd__detail").children().eq(2).text());
//             for(var i = 2; i < $(".article__bd__detail").children().length; i++){
//                 console.log($(".article__bd__detail").children().eq(i).text());
//             }
//         })
//     })
//     // console.log($("a[class='AnonymousHome_a__placeholder_3RZ']").nextAll());
//     //console.log("description:" + $('meta[name="description"]').eq(0).attr("content"));    
// })   

