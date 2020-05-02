var source_name = "中国财经网";
var domain = 'http://www.chinanews.com/';
var myEncoding = "utf-8";
var seedURL = 'http://www.chinanews.com/finance/';

var seedURL_format = "$('a')";
var keywords_format = "";
var title_format = "$('.content > h1').text()";
var date_format = "$('#pubtime_baidu').text()";
var author_format = "$('#author_baidu').text()";
var content_format = "$('.left_zw').text()";
var source_format = "$('.left-t').text()";
var url_reg = /\/(\d{4})\/(\d{2})-(\d{2})\/(\d{7}).shtml/;
var regExp = /((\d{4}|\d{2})(\-|\/|\.)\d{1,2}\3\d{1,2})|(\d{4}年\d{1,2}月\d{1,2}日)/


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
        //if (href.startsWith('//')) href = 'http:' + href;
        if (!url_reg.test(href)) {
            console.log(href + " not match the url_reg");
            return;
        }
        href = String(href);
        if (href.indexOf("//www.chinanews.com/cj") != 0) {
            // console.log(href + " not match the right url");
            return ;
        }
        href = 'http:' + href;
        console.log("crawler " + href);

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

        if (title_format == "") fetch.title = ""
        else fetch.title = eval(title_format); //标题

        if (date_format != "") fetch.publish_date = eval(date_format); //$('.article-meta').children().eq(1).text(); //刊登日期   
        console.log(fetch.publish_date);
        fetch.publish_date = fetch.publish_date.split(" ")[0];
        console.log('date: ' + fetch.publish_date);
        fetch.publish_date = fetch.publish_date.replace('年', '-')
        fetch.publish_date = fetch.publish_date.replace('月', '-')
        fetch.publish_date = fetch.publish_date.replace('日', '')
        fetch.publish_date = new Date(fetch.publish_date).toFormat("YYYY-MM-DD");

        if (author_format == "") fetch.author = source_name; //eval(author_format);  //作者
        else fetch.author = eval(author_format).replace('作者：','');
        console.log("作者 " + fetch.author);

        if (content_format == "") fetch.content = "";
        else fetch.content = eval(content_format).replace('\n', "").replace(" ", ""); //内容,是否要去掉作者信息自行决定
        //console.log(fetch.content);

        console.log("get the source");
        if (source_format == "") fetch.source = fetch.source_name;
        else fetch.source = eval(source_format).split('：')[1]; //来源
        fetch.source = fetch.source.replace('参与互动', '');
        console.log(fetch.source);
        
        var filename = source_name + "_" + (new Date()).toFormat("YYYY-MM-DD") +
            "_" + myURL.substr(myURL.lastIndexOf('/') + 1) + ".json";
        ////存储json
        try{
            fs.writeFileSync(filename, JSON.stringify(fetch));
        } catch(e) {
            console.log("save the file: " + myURL + " error :" + e);
        }

        // save the result in postgresql
        var fetchAddSql = 'INSERT INTO fetches (url, source_name, source_encoding, title, author, publish_date, content)' 
        + 'VALUES ($1, $2,$3,$4,$5, $6, $7)';
        var fetchAddSql_Params = [fetch.url, fetch.source, fetch.source_encoding,
            fetch.title, fetch.author, fetch.publish_date, fetch.content
        ];

        //执行sql，数据库中fetch表里的url属性是unique的，不会把重复的url内容写入数据库
        pgsql.query(fetchAddSql, fetchAddSql_Params, function(err, result) {
            if(err) {
                console.log(err);
            }
        });
        
    });
}
