'use strict';

var _this = this;
var async = require('async');
var asConfig = require('./aerospike_config');
var aerospikeConfig = asConfig.aerospikeConfig();
var aerospikeDBParams = asConfig.aerospikeDBParams();
var aerospike = require('aerospike');

// Connect to the cluster
var client = aerospike.client(aerospikeConfig);
client.connect(function (response) {
  if ( response.code === 0) {
    // handle success
    console.log("\nConnection to Aerospike cluster succeeded!\n");
  }
  else {
    // handle failure
    // console.log(response);
    console.log("\nConnection to Aerospike cluster failed!\n");
    process.exit(0);
  }
});

process.on('exit', function() {
  console.log("Goodbye!");

  if (client != null) {
    client.close();
  }
});

exports.createUser = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.uid);
  var userRecord = {uid: params.uid, username: params.username, password: params.password, auth: params.auth, tweetCount: 0};
  client.put(key, userRecord, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully created.
      // console.log(rec, meta);
      res.json({status : 'Ok'});
    }
    else {
      // An error occurred
      console.error('createUser error: ', err);
      res.json({status: err});
    }
  });
};

exports.checkUsername = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.username);
  // Read the record from the database
  client.get(key, function(err, rec, meta) {
      // Check for errors
      if ( err.code === aerospike.status.AEROSPIKE_OK ) {
        // The record was successfully read.
        // console.log(rec);
        res.json({status : 'Ok', uid : rec.uid, auth: rec.auth});
      }
      else {
        // An error occurred
        console.error('checkUsername error:', err);
        res.json({status : 'Invalid Username'});
      }
  });
};

exports.checkCredentials = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.uid);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK && rec.password === params.password) {
      // The record was successfully read.
      // console.log(rec, meta);
      res.json({status : 'Ok', uid : rec.uid, auth: rec.auth});
    }
    else {
      // An error occurred
      console.error('checkCredentials error: ', err);
      res.json({status: 'Invalid Credentials'});
    }
  });
};

exports.createTweet= function(req, res) {
  // console.log(req.body);
  var params = req.body;

  async.waterfall([
    function(callback){

      var userKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,params.uid); 
      var operator = aerospike.operator;
      var operations = [operator.incr('tweetCount', 1),operator.read('tweetCount')];
      client.operate(userKey, operations, function(err, bins, metadata, key) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // console.log(params.uid+'\'s new tweetcount: ', bins.tweetCount);
          callback(null, {status: 0, tweetCount: bins.tweetCount});
        } else {
          callback(null, {status: -1, tweetCount: -1});
        }
      });  

    }
  ], function (err, result) { 
    // console.log(result);
    
    if (result.status === 0)  {
      var tweetKey = params.uid+":"+(result.tweetCount);
      var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,tweetKey);
      client.put(key, {key: tweetKey, username: params.uid, tweet: params.tweet, ts: (new Date).getTime()}, function(err, rec, meta) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // tweet was successfully created
          res.json({status: "Ok"});      
        } else {
          // An error occurred
          console.error('createTweet error: ', err);
          res.json({status : err});
        }
      });
    }
    else  {
      res.json({status : err});
    }
  });
};

// NOTE: Batch operation
exports.retrieveTweets = function(req, res) {
  // console.log(req);
  var params = req.body;
  var uid = params.uid;
  if (uid === undefined || uid === null) {
    uid = req.query.uid;
  }

  async.waterfall([
    function(callback){

      var userKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,uid); 
      client.get(userKey, function(err, rec, meta) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // console.log(params.uid+'\'s tweetcount: ', rec.tweetCount);
          callback(null, {status: 0, tweetCount: rec.tweetCount});
        } else {
          callback(null, {status: -1, tweetCount: 0});
        }
      });  

    }
  ], function (err, result) { 
    // console.log(result);
    
    if (result.status === 0)  {

      var tweets = {};
      // create an array of keys
      var keys = [];
      for (var i = 1; i <= result.tweetCount; i++) {
        keys.unshift(aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,uid+":"+i));
      }

      // batch read records based on keys
      client.batchGet(keys, function (err, results) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          for (var i = 0; i < results.length; i++ ) {
            switch ( results[i].status ) {
              case aerospike.status.AEROSPIKE_OK:
                var record = results[i].record;
                // console.log(record);
                tweets[record.ts] = {tweet: record.tweet, key: record.key, uid: uid, ts: record.ts};
            }
          }

          res.json({status : 'Ok', tweets: _this.sortTweets(tweets,uid)});
        }
        else {
          console.log("retrieveTweetsInBatch error: ", err);
          res.json({status : err});
        }
      });

    }
    else  {
      res.json({status : err});
    }
  });

};

// NOTE: Secondary Index + Query operation
exports.retrieveTweetsUsingIndex = function(req, res) {
  // console.log(req);
  var params = req.body;
  var uid = params.uid;
  if (uid === undefined || uid === null) {
    uid = req.query.uid;
  }

  var options = {
    ns:  aerospikeDBParams.dbName,
    set: aerospikeDBParams.tweetsTable,
    bin : 'username',
    index: 'username_index'
  };
  // NOTE: In production environment, this should be done via aql
  client.createStringIndex(options, function(err)  {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // index created       

      var tweets = {};
      var statement = {filters:[aerospike.filter.equal('username', uid)], select: ['key','tweet','ts']};
      var query = client.query(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable, statement);
      var stream = query.execute();
      stream.on('data', function(record)  {
        // console.log(record.bins.tweet);
        tweets[record.bins.ts] = {tweet: record.bins.tweet, key: record.bins.key, uid: uid, ts: record.bins.ts};
      });
      stream.on('error', function(err)  {
        console.log('retrieveTweetsUsingIndex Error: ',err);
        res.json({status : err});
      });
      stream.on('end', function()  {
        console.log('retrieveTweetsUsingIndex:\n', tweets);
        res.json({status : 'Ok', tweets: _this.sortTweets(tweets,uid)});
      });

    } else {
      // An error occurred
      console.error('createIndexOnUsername error: ', err);
    }
  });

};

// NOTE: Map operation -- this goes hand-in-hand with exports.updateTweetsMap
exports.retrieveTweetsMap = function(req, res) {
  // console.log(req);
  var params = req.body;
  var uid = params.uid;
  if (uid === undefined || uid === null) {
    uid = req.query.uid;
  }
  
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsListTable,uid);
  // console.log(params.uid);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully read.
      // console.log(rec.tweets);
      var tweets = _this.sortTweets(rec.tweets,uid);
      // console.log('retrieveTweetsMap', tweets);
      res.json({status : 'Ok', tweets: tweets});
    }
    else {
      // An error occurred
      // console.error('retrieveTweetsMap error:', err);
      res.json({status : err});
    }
  });

};

exports.deleteTweet = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,params.tweetKey);
  client.remove(key, function(err, rec, meta) {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      _this.updateTweetCount(params.uid, -1);
      res.json({status : 'Ok'});
    }
    else {
      res.json({status : err});
    }
  });
};

exports.updateTweetCount = function(uid, byNumber)  {
  var userKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,uid); 
  var operator = aerospike.operator;
  var operations = [operator.incr('tweetCount', byNumber),operator.read('tweetCount')];
  client.operate(userKey, operations, function(err, bins, metadata, key) {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // console.log(uid+'\'s new tweetcount: ', bins.tweetCount);      
      return bins.tweetCount;
    }
  });  
};

exports.retrieveFollowing = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followingTable,params.uid);
  // console.log(params.uid);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully read.
      // console.log(rec, meta);
      res.json({status : 'Ok', following: rec.following});
    }
    else {
      // An error occurred
      // console.error('retrieveFollowing error:', err);
      res.json({status : err});
    }
  });
};

exports.updateFollowing = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followingTable,params.uid);
  var followers = [];
  var updatedFollowers = [];
  // add record to the database
  // console.log(params.following);
  client.put(key, {following: params.following}, function(err, rec, meta) {
      // Check for errors
      if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // The record was successfully read.
          // console.log(rec, meta);

          if (params.toFollow !== undefined)  {

            //add current user as follower of 'toFollow' user
            //1. retrieve 'toFollow' user's followers
            key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followersTable,params.toFollow);
            
            // console.log(params.toFollow);
            client.get(key, function(err, rec, meta) {
                // Check for errors
                if ( err.code === aerospike.status.AEROSPIKE_OK || err.code === aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                    // The record was successfully read.
                    // console.log(rec, meta);

                    //2. update followers list
                    if (rec.followers !== undefined)  {
                      followers = rec.followers;
                    }
                    followers.unshift(params.uid);

                    // add record to the database
                    // console.log(params.followers);
                    client.put(key, {followers: followers}, function(err, rec, meta) {
                        // Check for errors
                        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
                            // The record was successfully read.
                            // console.log(rec, meta);
                            // console.log("added you as follower of " + params.toFollow);
                            res.json({status : 'Ok', followers: followers});
                        }
                        else {
                            // An error occurred
                            console.error('updateFollowing 1 error:', err);
                            res.json({status : err});
                        }
                    });

                }
                else {
                    // An error occurred
                    console.error('updateFollowing 2 error:', err);
                    res.json({status : err});
                }
            });

          }

          if (params.toUnfollow !== undefined)  {

            //remove current user as follower of 'toUnfollow' user
            //1. retrieve 'toUnfollow' user's followers
            key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followersTable,params.toUnfollow);

            // console.log('toUnfollow key = ' + 'uid:'+params.toUnfollow+':followers');
            client.get(key, function(err, rec, meta) {
                // Check for errors
                if ( err.code === aerospike.status.AEROSPIKE_OK || err.code === aerospike.status.AEROSPIKE_ERR_RECORD_NOT_FOUND) {
                    // The record was successfully read.
                    // console.log(rec, meta);

                    //2. update followers list
                    if (rec.followers !== undefined)  {
                      followers = rec.followers;
                    }
                    for (var i = 0; i < followers.length; i++)  {
                      // console.log(followers[i]);
                      if (followers[i] !== params.uid)  {
                        updatedFollowers.push(followers[i]);
                      }
                    }
                    // console.log(updatedFollowers);

                    // add record to the database
                    client.put(key, {followers: updatedFollowers}, function(err, rec, meta) {
                        // Check for errors
                        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
                            // The record was successfully read.
                            // console.log(rec, meta);
                            // console.log("added you as follower of " + params.toFollow);
                            res.json({status : 'Ok', followers: updatedFollowers});
                        }
                        else {
                            // An error occurred
                            console.error('updateFollowing 3 error:', err);
                            res.json({status : err});
                        }
                    });

                }
                else {
                    // An error occurred
                    console.error('updateFollowing 4 error:', err);
                    res.json({status : err});
                }
            });

          }

      }
      else {
          // An error occurred
          console.error('updateFollowing 0 error:', err);
          res.json({status : err});
      }
  });
};

exports.retrieveFollowers = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followersTable,params.uid);
  // console.log(params.uid);
  client.get(key, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully read.
      // console.log(rec, meta);
      res.json({status : 'Ok', followers: rec.followers});
    }
    else {
      // An error occurred
      // console.error('retrieveFollowers error:', err);
      res.json({status : err});
    }
  });
};

exports.updateFollowers = function(req, res) {
  // console.log(req.body);
  var params = req.body;
  var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.followersTable,params.uid);
  // add record to the database
  // console.log(params.followers);
  client.put(key, {followers: params.followers}, function(err, rec, meta) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // The record was successfully read.
      // console.log(rec, meta);
      res.json({status : 'Ok'});
    }
    else {
      // An error occurred
      console.error('updateFollowers error:', err);
      res.json({status : err});
    }
  });
};

exports.retrieveStats = function(req, res) {
  client.info("statistics", function(err, response, host) {
    // Check for errors
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // console.log(response);
      res.json({status : 'Ok', stats: response});
    }
    else {
      console.error('retrieveStats error:', err);
      res.json({status : err});
    }
  });
};

exports.updateTweetsMap = function(req, res) {
  // NOTE: This is an alternative way to store tweets in a map. Record UDF is used to update the map. 

  // console.log(req.body);
  var params = req.body;
  var uid = params.uid;
  if (uid === undefined || uid === null) {
    uid = req.query.uid;
  }

  async.waterfall([
    function(callback){

      var userKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,uid); 
      var operator = aerospike.operator;
      var operations = [operator.incr('tweetCount', 1),operator.read('tweetCount')];
      var tweetCount = 0;
      client.operate(userKey, operations, function(err, bins, metadata, key) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // console.log(params.uid+'\'s new tweetcount: ', bins.tweetCount);
          tweetCount = bins.tweetCount

          // see if the tweetsList record exists. if not, create it before calling the UDF to add new tweet to the map
          var key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsListTable,uid);
          client.get(key, function(err, rec, meta) {
            // Check for errors
            if ( err.code === aerospike.status.AEROSPIKE_OK ) {
              // tweetsList record exists
              // console.log('tweetsList record exists');
            } else {
              // tweetsList record does not exist so create it before calling the UDF
              client.put(key, {tweets: {}}, function(err, rec, meta) {
                // Check for errors
                if ( err.code === aerospike.status.AEROSPIKE_OK ) {
                  // console.log('tweetsList record created');
                }
                else {
                  // console.log('tweetsList record not created');
                  callback(null, {status: -1});
                }
              });
            }
          });

          callback(null, {status: 0});

        } 
      });  

    }
  ], function (err, result) { 
    // console.log(result);
    
    if (result.status === 0)  {

      // Register UDF
      client.udfRegister('udf/updateTweetsMap.lua', function(err) {
        if ( err.code === 0 ) {
          var tweetKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsListTable,uid);
          var tweet = params.tweet;
          var ts = (new Date).getTime();
          var UDF = {module:'updateTweetsMap', funcname: 'updateList', args: [tweet,ts]};
          client.execute(tweetKey, UDF, function(err, result) {
            // Check for errors
            if ( err.code === 0 ) {
              res.json({status: "Ok", tweets: _this.sortTweets(result,uid)}); 
            }
            else {
              console.log("updateTweetsMap ERROR:\n", err);
              res.json({status : err});
            }
          });
        } else {
          // An error occurred
          console.error("updateTweetsMap UDF registeration ERROR:\n", err);
          res.json({status : err});
        }
      });
    }
    else  {
      res.json({status : err});
    }

  });
};

exports.sortTweets = function(map, uid)  {
  var keys = Object.keys(map);
  var totalKeys = keys.length;
  keys.sort();
  var tweets = [];
  var start = totalKeys - 1;
  var end = 0;
  for (var i = start; i >= end; i--)
  {
    var k = keys[i];
    tweets.push({ts: k, tweet: (map[k].tweet || map[k]), key: map[k].key, uid: (map[k].uid || uid)});
  }
  // console.log(tweets);
  return tweets;
}
