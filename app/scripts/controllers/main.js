'use strict';

angular.module('tweetabaseApp')
  .controller('MainCtrl', ['$scope', 'localStorageService', '$http', 'socket', '$modal', 'following', function ($scope, localStorageService, $http, socket, $modal, following) {

		var uid = localStorageService.get('uid');
		var modalInstance = null;

		$scope.uid = uid;
		$scope.myFollowingList = [];
		$scope.myTweets = [];
		$scope.myFollowingTweets = [];
		$scope.alertStatus = false;
		$scope.autoTweet = true;

		$scope.retrieveTweets = function	() {
      $http.post('/api/retrieveTweets', {uid: uid}).success(function(response) {
        // console.log('/api/retrieveTweets response: ' + JSON.stringify(response));
        if (response.status === 'Ok')	{
					// console.log(response.tweets);
					$scope.myTweets = response.tweets;
        }
      });
		};

		$scope.retrieveFollowing = function	() {
			$scope.myFollowingList = [];
			following.retrieveFollowing({
				uid: uid
			},	function(response)	{
        // console.log('/api/retrieveFollowing response: ' + JSON.stringify(response));
        if (response && response.status === 'Ok' && response.following !== undefined)	{
					$scope.myFollowingList = response.following;

					// retrieve and display people you are following's tweets
					for (var i = 0; i < $scope.myFollowingList.length; i++)  {
			      $http.post('/api/retrieveTweets', {uid: $scope.myFollowingList[i].handle}).success(function(response) {
			        // console.log('/api/retrieveTweets response: ' + JSON.stringify(response));
			        if (response.status === 'Ok')	{
								// console.log(response.tweets);
								var totalTweets = response.tweets.length;
								for (var j = totalTweets; j > 0; j--)  {
									var index = j - 1;
									var tweetObject = {key: response.tweets[index].key, tweet: response.tweets[index].tweet, ts: response.tweets[index].ts, uid: response.tweets[index].uid};
									$scope.myFollowingTweets.unshift(tweetObject);									
								}
			        }
			      });
					}					
        }
			});
		};

		if (uid != null)	{
			$scope.retrieveTweets();
			$scope.retrieveFollowing();
		}

		$scope.createTweet = function () {
			$scope.errors = '';
      if ($scope.myTweet === undefined || $scope.myTweet.trim().length === 0)  {
				$scope.errors = 'Please share your thought before you can tweet it';
        return;
      }
			var tweetObject = {key: uid+':'+($scope.myTweets.length+1),tweet: $scope.myTweet, ts: (new Date).getTime(), uid: uid};
			$scope.myTweets.unshift(tweetObject);
      $http.post('/api/createTweet', {uid: uid, tweet: $scope.myTweet}).success(function(response) {
        // console.log('/api/updateTweets response: ' + JSON.stringify(response));
				$scope.myTweet = '';
      });
      //this delegates to the Socket.IO client API emit method and sends the tweet
      //see server.js for the listener
      socket.emit('tweet',{uid: uid, tweet: tweetObject.tweet, realTweet: true});
		};

		$scope.deleteTweet = function (index) {
			var tweetKey = $scope.myTweets[index].key;
			$scope.myTweets.splice(index,1);
      $http.post('/api/deleteTweet', {uid: uid, tweetKey: tweetKey}).success(function(response) {
        // console.log('/api/deleteTweet response: ' + JSON.stringify(response));
      });
		};

		//NOTE: Displaying new tweet by 'pre-appending' it to existing tweets on the page
		$scope.$on('socket:broadcast', function (event,data) {
			// console.log(event.name);
			if ((data.realTweet || $scope.alertStatus) && $scope.uid != data.uid)	{
				var tweetObject = {key: data.uid+':'+($scope.myFollowingTweets.length+1),tweet: data.tweet, ts: (new Date).getTime(), uid: data.uid};
				$scope.myFollowingTweets.unshift(tweetObject);
			}
		});

		// auto-tweet every n seconds on behalf of the users the current user is following
		$scope.init = function() {

			// This can be turned off by setting $scope.autoTweet to false
			if (!$scope.autoTweet) {return;}

			tweetInterval = setInterval(function()	{
				console.log('hello auto-tweet');

				if ($scope.myFollowingList.length > 0)	{
					var randomTweets = ['For just $1 you get a half price download of half of the song and listen to it just once.','People tell me my body looks like a melted candle','Come on movie! Make it start!','Byaaaayy','Please, please, win! Meow, meow, meow!','Put. A. Bird. On. It.','A weekend wasted is a weekend well spent','Would you like to super spike your meal?','We have a mean no-no-bring-bag up here on aisle two.','SEEK: See, Every, EVERY, Kind... of spot','We can order that for you. It will take a year to get there.','If you are pregnant, have a soda.','Hear that snap? Hear that clap?','Follow me and I may follow you','Which is the best cafe in Portland? Discuss...','Portland Coffee is for closers!','Lets get this party started!','How about them portland blazers!','I love animals','I love my dog','What\'s up Portland','Which is the best cafe in Portland? Discuss...','I dont always tweet, but when I do it is on Tweetaspike'];
					var totalUsers = $scope.myFollowingList.length;
					var totalTweets = randomTweets.length;
					var randomFollowingUID;
					var randomTweet;

					randomFollowingUID = $scope.myFollowingList[Math.floor((Math.random() * totalUsers))].handle;
					randomTweet = randomTweets[Math.floor((Math.random() * (totalTweets - 1)) + 0)];

		      $http.post('/api/createTweet', {uid: randomFollowingUID, tweet: randomTweet}).success(function(response) {
		        // console.log('/api/createTweet response: ' + JSON.stringify(response));
		      });
		      //this delegates to the Socket.IO client API emit method and sends the post
		      //see server.js for the listener		      
		      socket.emit('tweet',{uid: randomFollowingUID, tweet: randomTweet, realTweet: false});
				}
			}, 10000);
		};

  }]);

angular.module('tweetabaseApp')
  .controller('InfoModalInstanceCtrl', ['$scope', '$modalInstance', 'options', function ($scope, $modalInstance, options){
		$scope.options = options;

	  $scope.ok = function () {
	    $modalInstance.close();
		};
	}]);
