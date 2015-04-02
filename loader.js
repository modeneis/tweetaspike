var args = require('yargs').argv;
//console.log(args);
var f = args.f;

if (f === undefined) { 
  console.log('\n::U::s::a::g::e:: Yo, here is how to use this thang!');
  console.log('node loader.js -f [putusers] || [puttweets] || [agg] || [gettweets] || [alltweets] || [updatepwd]\n');
  return;
}

var asConfig = require('./lib/controllers/aerospike_config');
var aerospikeConfig = asConfig.aerospikeConfig();
var aerospikeDBParams = asConfig.aerospikeDBParams();
var aerospike = require('aerospike');

// Connect to the cluster
var client = aerospike.client(aerospikeConfig);
client.connect(function (response) {
  if ( response.code === 0) {
    // handle success
    console.log("\nConnection to Aerospike cluster succeeded!\n");
    createIndexOnUsername();
    createIndexOnTweetcount();
  }
  else {
    // handle failure
    console.log("\nConnection to Aerospike cluster failed!\n");
    process.exit(0);
  }
});

function seedUsers()  {
  var start = 1;
  var end = 10000;
  var key;
  var uid;
  var userRecord;
  var record;
  var auth;
  var password;
  var genders = ['m','f','m','f','m','f','m','f','m','f','m','f'];
  var regions = ['e','w','s','n','e','w','s','n','e','w','s','n'];
  var interests = ['soccer','music','baseball','photography','technology','travel','soccer','music','baseball','photography','technology','travel'];
  
  for (var i = start; i <= end; i++) {

    uid = 'usr'+i;
    auth = "auth_" + (Math.random() / +new Date()).toString(36).replace(/[^a-z]+/g, '');
    password = 'password'+i;
    var gender = genders[Math.floor((Math.random() * 10) + 1)]
    var region = regions[Math.floor((Math.random() * 10) + 1)]
    var interest = interests[Math.floor((Math.random() * 10) + 1)]

    userRecord = {uid: uid, username: uid, password: password, auth: auth, gender: gender, region: region, tweetCount: 0, interest: interest};

    console.log(userRecord);

    key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,uid);
    client.put(key, userRecord, function(err, rec, meta) {
      if ( err.code === aerospike.status.AEROSPIKE_OK ) {
        // The record was successfully created.
      } else {
         console.log('seedUsers error: ', err);
      }
    });

  }
}

function seedUsersTweets()  {
  var start = Math.floor((Math.random() * 1) + 1);
  var end = Math.floor((Math.random() * 5000) + 1);
  var tweets = 0;
  var uid;
  var randomTweets = ['For just $1 you get a half price download of half of the song. You will be able to listen to it just once.','People tell me my body looks like a melted candle','Come on movie! Make it start!','Byaaaayy','Please, please, win! Meow, meow, meow!','Put. A. Bird. On. It.','A weekend wasted is a weekend well spent','Would you like to super spike your meal?','We have a mean no-no-bring-bag up here on aisle two.','SEEK: See, Every, EVERY, Kind... of spot','We can order that for you. It will take a year to get there.','If you are pregnant, have a soda.','Hear that snap? Hear that clap?','Follow me and I may follow you','Which is the best cafe in Portland? Discuss...','Portland Coffee is for closers!','Lets get this party started!','How about them portland blazers!',"You got school'd, yo",'I love animals','I love my dog',"What's up Portland",'Which is the best cafe in Portland? Discuss...','I dont always tweet, but when I do it is on Tweetaspike'];

  for (var i = start; i <= end; i++) {
    uid = Math.floor((Math.random() * 10000) + 1);
    // console.error('processing usr'+uid);

    // create tweets
    tweets = Math.floor((Math.random() * 10) + 1);
    console.error('usr'+uid+' === '+tweets);
    for (var j = 1; j <= tweets; j++) {
      var tweetKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,uid+':'+j);
      // update tweet count
      updateTweetCount(uid);
      client.put(tweetKey, {username: 'usr'+uid, tweet: randomTweets[Math.floor((Math.random() * 10) + 1)], ts: randomDate(new Date(2014, 0, 1), new Date())}, function(err, rec, meta) {
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // tweet was successfully created          
        } else {
          // An error occurred
          console.error('seedUsersTweets error: ', err);
        }
      });

      for (var k=0;k<2000000;k++){                    
        // dummy sleep to get the tweetcount some time to update. NOT FOR PROD USE.
      }

    }
  }
}

function updateTweetCount(uid)  {
  var userKey = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,'usr'+uid); 
  var operator = aerospike.operator;
  var operations = [operator.incr('tweetCount', 1),operator.read('tweetCount')];
  client.operate(userKey, operations, function(err, bins, metadata, key) {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // console.error('usr'+uid+' tweetCount : ', bins.tweetCount);
    }
  });  
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toString();
}

function getBatchUsersPosts()  {
  var start = Math.floor((Math.random() * 1) + 1);
  var end = Math.floor((Math.random() * 100000) + 1);
  var keys = [];
  var tweets;

  for (var i = start; i <= end; i++) {
    keys.unshift(aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,'usr'+i));
  }

  console.log(keys);

  // batch records record to the database
  client.batchGet(keys, function (err, results) {
    if ( err.code == aerospike.status.AEROSPIKE_OK ) {
      for (var i = 0; i < results.length; i++ ) {
        switch ( results[i].status ) {
          case aerospike.status.AEROSPIKE_OK:
            console.log("OK - ", results[i].record);
        }
      }
    }
    else {
      console.log("getBatchUsersPosts error: ", err);
    }
    client.close();
  });
}

function getUsersPosts()  {
  var start = Math.floor((Math.random() * 1) + 1);
  var end = Math.floor((Math.random() * 100000) + 1);
  var key;
  var uid;

  for (var i = start; i <= end; i++) {
    uid = Math.floor((Math.random() * 100000) + 1);

    key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable,uid);

    console.log("user # " + i + " of " + end + " ===== reading tweets for usr" + uid);

    client.get(key, function(err, rec, meta) {
        // Check for errors
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // The record was successfully read.
          // console.log(rec, meta);
        }
        else {
          // An error occurred
          // console.error('retrieveTweets error:', err);
        }
    });
  };
}

function getUsers()  {
  var start = Math.floor((Math.random() * 1) + 1);
  var end = Math.floor((Math.random() * 10000) + 1);
  var key;
  var uid;

  for (var i = start; i <= end; i++) {
    uid = Math.floor((Math.random() * 10000) + 1);

    key = aerospike.key(aerospikeDBParams.dbName,aerospikeDBParams.usersTable,uid);

    console.log("user # " + i + " of " + end + " ===== reading usr" + uid);

    client.get(key, function(err, rec, meta) {
        // Check for errors
        if ( err.code === aerospike.status.AEROSPIKE_OK ) {
          // The record was successfully read.
          // console.log(rec, meta);
        }
        else {
          // An error occurred
          // console.error('retrieveTweets error:', err);
        }
    });
  };
}

function scanAllTweets() {
  var query = client.query(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable);
  var stream = query.execute();
  var tweetCount = 0;
  stream.on('data', function(record)  {
    // console.log(record);
    console.log(record.bins.username + " has tweeted " + record.bins.tweet);
    tweetCount++;
  });
  stream.on('error', function(err)  {
    console.log('Error: ',err);
  });
  stream.on('end', function()  {
    console.log('tweetCount: ', tweetCount);
    console.log('scanAllTweets: ', '!done!');
  });  
}

function scanAllTweetsWithUDF() {
  //register UDF
  client.udfRegister('updatePassword.lua', function(err) {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // udf registered  
      var statement = {concurrent: true, UDF: {module:'updatePassword', funcname: 'update', args: ['pwd']}};
      var query = client.query(aerospikeDBParams.dbName,aerospikeDBParams.usersTable, statement);
      var stream = query.execute();
      stream.on('error', function(err)  {
        console.log('scanAllTweetsWithUDF Error: ',err);
      });
      stream.on('end', function()  {
        console.log('scanAllTweetsWithUDF: ', '!done!');
      });  
    } else {
      // An error occurred
      console.error('scanAllTweetsWithUDF registeration error: ', err);
    }
  });
}

function createIndexOnUsername()  {
  var options = {
    ns:  'test',
    set: 'tweets',
    bin : 'username',
    index: 'username_index'
  };
  client.createStringIndex(options, function(err)  {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // index created       
    } else {
      // An error occurred
      console.error('createIndexOnUsername error: ', err);
    }
  });
}

function getTweetsForUser(uid)  {
  var statement = {filters:[aerospike.filter.equal('username', uid)]};
  statement.select = ['tweet'];
  var query = client.query(aerospikeDBParams.dbName,aerospikeDBParams.tweetsTable, statement);
  var stream = query.execute();
  stream.on('data', function(record)  {
    console.log(record.bins.tweet);
  });
  stream.on('error', function(err)  {
    console.log('getTweetsForUser Error: ',err);
  });
  stream.on('end', function()  {
    console.log('getTweetsForUser: ', '!done!');
  });
}

function createIndexOnTweetcount()  {
  var options = {
    ns:  'test',
    set: 'users',
    bin : 'tweetCount',
    index: 'tweetCount_index'
  };
  client.createIntegerIndex(options, function(err)  {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // index created       
    } else {
      // An error occurred
      console.error('createIndexOnTweetcount error: ', err);
    }
  });
}

function getUsersByTweetCount(min,max)  {
  var statement = {filters:[aerospike.filter.range('tweetCount', min, max)]};
  statement.select = ['username', 'tweetCount'];
  var query = client.query(aerospikeDBParams.dbName,aerospikeDBParams.usersTable, statement);
  var stream = query.execute();
  stream.on('data', function(record)  {
    console.log(record.bins.username + ' === ' + record.bins.tweetCount);
  });
  stream.on('error', function(err)  {
    console.log('getTweetsByTweetCount Error: ',err);
  });
  stream.on('end', function()  {
    console.log('getTweetsByTweetCount: ', '!done!');
  });
}

function aggregateTweetsByRegion(min,max)  {
  //register UDF
  client.udfRegister('aggregateTweets.lua', function(err) {
    if ( err.code === aerospike.status.AEROSPIKE_OK ) {
      // udf registered  
      // console.error('aggregateTweets registeration complete!');
      var statement = {filters:[aerospike.filter.range('tweetCount', min, max)], aggregationUDF: {module: 'aggregateTweets', funcname: 'sum'}, select: ['region','tweetCount']};
      var query = client.query('test', 'users', statement);
      var stream = query.execute();
      stream.on('data', function(result)  {
        console.log('result: ', result);
      });
      stream.on('error', function(err)  {
        console.log('aggregateTweetsByRegion Error: ',err);
      });
      stream.on('end', function()  {
        console.log('aggregateTweetsByRegion: ', '!done!');
      });
    } else {
      // An error occurred
      console.error('aggregateTweets registeration error: ', err);
    }
  });
}

if (f === 'putusers') { 
  seedUsers();
} else if (f === 'puttweets')  {
  seedUsersTweets();
} else if (f === 'agg')  {
  aggregateTweetsByRegion(5,10);
} else if (f === 'gettweets')  {
  getUsersByTweetCount(1,10);
} else if (f === 'alltweets')  {
  scanAllTweets();
} else if (f === 'updatepwd')  {
  scanAllTweetsWithUDF();
} else {
  console.log('\n::U::s::a::g::e:: Yo, here is how to use this thang!');
  console.log('node loader.js -f [putusers] || [puttweets] || [agg] || [gettweets] || [alltweets] || [updatepwd]\n');
  return;
}
