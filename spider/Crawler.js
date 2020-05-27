var source_name = "东方财富网";
var domain = 'https://www.eastmoney.com/';
var myEncoding = "utf-8";
var seedURL = 'https://www.eastmoney.com/';

var seedURL_format = "$('a')";
//var category_format = " $('meta[name=\"keywords\"]').eq(0).attr(\"content\")";
var keywords_format = "";
// var date_format = "$('.article-meta').attr('span').text()";
// var content_format = "$('.article-body').text()";

//var title_format = "$('.article-title').text()";
var title_format = "$('.newsContent').children().eq(0).text()";
var date_format = "$('.time').text()";
// var author_format = "$('.auth').text()";
var author_format = "";
var content_format = "$('.Body').text()";
var desc_format = " $('meta[name=\"description\"]').eq(0).attr(\"content\")";
var source_format = "$('.source data-source').children().eq(1).text()";

var fs = require('fs');
var myRequest = require('request')
var myCheerio = require('cheerio')
var myIconv = require('iconv-lite')
require('date-utils');
var pgsql = require('./pg.js');

//防止网站屏蔽我们的爬虫
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
}

//request模块异步fetch url
function request(url, callback) {
    var options = {
        url: url,
        encoding: null,
        //proxy: 'http://x.x.x.x:8080',
        headers: headers,
        timeout: 10000 //
    }
    myRequest(options, callback)
}

request(seedURL, function(err, res, body) { //读取种子页面
    //用iconv转换编码
    var html = myIconv.decode(body, myEncoding);
    //console.log(html);
    //准备用cheerio解析html
    var $ = myCheerio.load(html, { decodeEntities: true });

    var seedurl_news;

    try {
        seedurl_news = $('a');
        //console.log(seedurl_news);
    } catch (e) { console.log('url列表所处的html块识别出错：' + e) };
    seedurl_news.each(function(){
        try {
            var href = "";
            href = $(this).attr('href');
        }catch(e) {
            console.log('get the seed url err' + e);
        }
        href = String(href);
        if (href.indexOf("http://finance.eastmoney.com/a/") != 0) {
            // console.log(href + " not match the right url");
            return ;
        }

        // not try to crawl the repeat page
        var fetch_url_Sql = 'select url from fetches where url= $1';
        var fetch_url_Sql_Params = [href];
        pgsql.query(fetch_url_Sql, fetch_url_Sql_Params, function(err, result) {
            if (err) {
                console.log(err)
            } else { // a new page
                if(result.rows[0] != null) {
                    console.log(result.rows[0]);
                    console.log("URL " + href + " repeat");
                } else {
                    newsGet(href);
                }
            }
        });
    })

});


function newsGet(myURL) { //读取新闻页面
    request(myURL, function(err, res, body) { //读取新闻页面
        try {
        var html_news = myIconv.decode(body, myEncoding); //用iconv转换编码
        //console.log(html_news);
        //准备用cheerio解析html_news
        var $ = myCheerio.load(html_news, { decodeEntities: true });
        myhtml = html_news;
        } catch (e) {    console.log('读新闻页面并转码出错：' + e);};

        console.log("转码读取成功:" + myURL);
        //动态执行format字符串，构建json对象准备写入文件或数据库
        var fetch = {};
        fetch.title = "";
        fetch.content = "";
        fetch.publish_date = (new Date()).toFormat("YYYY-MM-DD");
        //fetch.html = myhtml;
        fetch.url = myURL;
        fetch.source_name = source_name;
        fetch.source_encoding = myEncoding; //编码
        fetch.crawltime = new Date();

        if (keywords_format == "") fetch.keywords = source_name; // eval(keywords_format);  //没有关键词就用sourcename
        else fetch.keywords = eval(keywords_format);

        if (title_format == "") fetch.title = ""
        else fetch.title = eval(title_format); //标题

        if (date_format != "") fetch.publish_date = $('.time').text(); //$('.article-meta').children().eq(1).text(); //刊登日期   
        
        fetch.publish_date = fetch.publish_date.split(" ")[0];
        console.log('date: ' + fetch.publish_date);
        fetch.publish_date = fetch.publish_date.replace('年', '-')
        fetch.publish_date = fetch.publish_date.replace('月', '-')
        fetch.publish_date = fetch.publish_date.replace('日', '')
        fetch.publish_date = new Date(fetch.publish_date).toFormat("YYYY-MM-DD");

        if (author_format == "") fetch.author = source_name; //eval(author_format);  //作者
        else fetch.author = eval(author_format);
        console.log(fetch.author);

        if (content_format == "") fetch.content = "";
        else fetch.content = eval(content_format).replace('\n', "").replace(/\s+/g, ""); //内容,是否要去掉作者信息自行决定
        //console.log(fetch.content);

        if (source_format == "") fetch.source = fetch.source_name;
        else fetch.source = source_name;
        console.log(fetch.source);
        fetch.read_num = $('.num.ml5').text();
        
        // var filename = source_name + "_" + (new Date()).toFormat("YYYY-MM-DD") +
        //     "_" + myURL.substr(myURL.lastIndexOf('/') + 1) + ".json";
        // ////存储json
        // try{
        //     fs.writeFileSync(filename, JSON.stringify(fetch));
        // } catch(e) {
        //     console.log("save the file: " + myURL + " error :" + e);
        // }

        // save the result in postgresql
        var fetchAddSql = 'INSERT INTO fetches (url, source_name, source_encoding, title, author, publish_date, content, read_num)' 
        + 'VALUES ($1, $2,$3,$4,$5, $6, $7,$8)';
        var fetchAddSql_Params = [fetch.url, fetch.source, fetch.source_encoding,
            fetch.title, fetch.author, fetch.publish_date,
            fetch.content, fetch.read_num
        ];

        //执行sql，数据库中fetch表里的url属性是unique的，不会把重复的url内容写入数据库
        pgsql.query(fetchAddSql, fetchAddSql_Params, function(err, result) {
            if(err) {
                console.log(err);
            }
        });
        
    });
}


// function newsGet(myURL) { //读取新闻页面
//     request(myURL, function(err, res, body) { //读取新闻页面
//         //try {
//         var html_news = myIconv.decode(body, myEncoding); //用iconv转换编码
//         //console.log(html_news);
//         //准备用cheerio解析html_news
//         var $ = myCheerio.load(html_news, { decodeEntities: true });
//         myhtml = html_news;
//         //} catch (e) {    console.log('读新闻页面并转码出错：' + e);};

//         console.log("转码读取成功:" + myURL);
//         //动态执行format字符串，构建json对象准备写入文件或数据库
//         var fetch = {};
//         fetch.title = "";
//         fetch.content = "";
//         fetch.publish_date = (new Date()).toFormat("YYYY-MM-DD");
//         //fetch.html = myhtml;
//         fetch.url = myURL;
//         fetch.source_name = source_name;
//         fetch.source_encoding = myEncoding; //编码
//         fetch.crawltime = new Date();

//         if (keywords_format == "") fetch.keywords = source_name; // eval(keywords_format);  //没有关键词就用sourcename
//         else fetch.keywords = eval(keywords_format);

//         if (title_format == "") fetch.title = ""
//         else fetch.title = eval(title_format); //标题

//         if (date_format != "") fetch.publish_date = $('.article-meta').children().eq(1).text(); //刊登日期   
//         console.log('date: ' + fetch.publish_date);
//         fetch.publish_date = fetch.publish_date.split(" ")[0];
//         console.log('date: ' + fetch.publish_date);
//         fetch.publish_date = fetch.publish_date.replace('年', '-')
//         fetch.publish_date = fetch.publish_date.replace('月', '-')
//         fetch.publish_date = fetch.publish_date.replace('日', '')
//         fetch.publish_date = new Date(fetch.publish_date).toFormat("YYYY-MM-DD");

//         if (author_format == "") fetch.author = source_name; //eval(author_format);  //作者
//         else fetch.author = eval(author_format);

//         if (content_format == "") fetch.content = "";
//         else fetch.content = eval(content_format).replace(" ", ""); //内容,是否要去掉作者信息自行决定

//         if (source_format == "") fetch.source = fetch.source_name;
//         else fetch.source = eval(source_format).replace("\r\n", ""); //来源

//         fetch.read_num = $('.text-primary').text();
//         var filename = source_name + "_" + (new Date()).toFormat("YYYY-MM-DD") +
//             "_" + myURL.substr(myURL.lastIndexOf('/') + 1) + ".json";
//         ////存储json
//         fs.writeFileSync(filename, JSON.stringify(fetch));
//     });
// }