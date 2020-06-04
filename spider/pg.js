var pg = require('pg');

// 数据库配置
var config = {  
    user:"postgres",
    database:"Spider",
    password:"000",
    port:5432,
    // 扩展属性
    max:20, // 连接池最大连接数
    idleTimeoutMillis:3000, // 连接最大空闲时间 3s
}

// 创建连接池
var pool = new pg.Pool(config);
// 查询
// pool.connect(function(err, client, done) {  
//   if(err) {
//     return console.error('数据库连接出错', err);
//   }
//   // 简单输出个 Hello World
//   client.query('SELECT $1::varchar AS OUT', ["Hello World"], function(err, result) {
//     done();// 释放连接（将其返回给连接池）
//     if(err) {
//       return console.error('查询出错', err);
//     }
//     console.log(result.rows[0].out); //output: Hello World
//   });
// });


var query = function(sql, sqlparam, callback) {
    pool.connect(function(err, conn, done) {
        if (err) {
            console.log(err)
            callback(err, null, null);
        } else {
            conn.query(sql, sqlparam, function(err, result) {
                //conn.release(); //释放连接 
                done();
                callback(err, result); //事件驱动回调 
            });
        }
    });
};

var query_noparam = function(sql, callback) {
    pool.connect(function(err, conn, done) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, function(err, result) {
                // console.log(result);
                conn.release(); //释放连接 
                callback(err, result); //事件驱动回调 
            });
        }
    });
};

exports.query = query;
exports.query_noparam = query_noparam;