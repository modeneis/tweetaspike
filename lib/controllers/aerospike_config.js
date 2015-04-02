'use strict';

var aerospikeCluster  = '172.16.159.141';
var aerospikeClusterPort = 3000;

exports.aerospikeConfig = function()	{
	return	{
		hosts: [ { addr: aerospikeCluster, port: aerospikeClusterPort } ]
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
