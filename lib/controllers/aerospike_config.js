'use strict';

var fs = require('fs');
var path = require('path');
var fd = fs.openSync(path.join(process.cwd(), 'apiLog.txt'), 'a')

var aerospikeCluster  = '172.16.159.165';
var aerospikeClusterPort = 3000;

exports.aerospikeConfig = function()	{
	return	{
		hosts: [ { addr: aerospikeCluster, port: aerospikeClusterPort } ],
    log: { 
      level: 0,
      file: fd
    },
    modlua: {
      userPath: 'udf/'
    } 
	};
};

exports.aerospikeDBParams = function()	{
  return {
    dbName: 'test',
    usersTable: 'users',
    tweetsTable: 'tweets',
    tweetsListTable: 'tweetsList',
    followingTable: 'following',
    followersTable: 'followers'
  };	
};
