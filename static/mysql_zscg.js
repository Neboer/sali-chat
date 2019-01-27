//实现四个方法。插入数据，删除数据，查找数据，修改数据。
function Bind(sqlConnection, tableName) {//传入一个connection和表名，获得一个bind对象
    // sqlConnection.query("SHOW FULL COLUMNS FROM ? FROM ?",[tableName,sqlConnection.database],function(err,result) {
    //     if(err){throw err.name;}
    //     else {this.columnData = result}
    // })
    if (tableName === 'message') {
        this.insert = function(poster,time,messageContent) {
            sqlConnection.query('INSERT INTO sali_chat.message(poster, time, messageContent) values (?,?,?)', [poster,time,messageContent], function(err, data) {
                if (err) {
                    throw err;
                } else {
                    return data;
                }
            });
        };
        this.findBetweenTime = function(timeStart, timeEnd, callback) {
            sqlConnection.query('SELECT poster, time, messageContent FROM sali_chat.message WHERE time>=? AND time<=? ORDER BY time',[timeStart,timeEnd], function(err, data) {
                if (err) {
                    throw err;
                } else {
                    callback(data);
                }
            })
        }
    }
}

module.exports = Bind;