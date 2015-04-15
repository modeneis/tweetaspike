function updateMap(userTweetRecord,tweet,ts)
	-- extract tweets map from userTweetRecord and store it in local variable
	local userTweets = userTweetRecord.tweets
	-- add new tweet 
	userTweets[ts] = tweet
	-- assign updated tweets map back to the record
	userTweetRecord.tweets = userTweets
	-- update record
	aerospike:update(userTweetRecord)
	-- return updated tweets map
  return userTweetRecord.tweets
end
