'use strict';

angular.module('tweetabaseApp')
  .controller('FollowingCtrl', ['$scope', '$location', 'user', 'following', 'localStorageService', '$modal', function ($scope, $location, user, following, localStorageService, $modal){

		var uid = localStorageService.get('uid');
		var modalInstance = null;
		$scope.myFollowingList = [];
    $scope.user = {};
    $scope.message = null;
    $scope.oneAtATime = true;
    $scope.toUnfollow = null;
    $scope.matchingUsersList = [];

		$scope.retrieveFollowing = function	() {
			$scope.myFollowingList = [];
			following.retrieveFollowing({
				uid: uid
			},	function(response)	{
        // console.log('/api/retrieveFollowing response: ' + JSON.stringify(response));
        if (response && response.status === 'Ok' && response.following !== undefined)	{
					$scope.myFollowingList = response.following;
        }
			});
		};

		$scope.retrieveFollowing();

    $scope.follow = function(form) {

			//Cannot follow yourself
			if (uid === $scope.user.email)  {
				$scope.message = 'You cannot follow yourself!';
				$scope.user.email = '';
				return;
			}

			//Only allow unique followees
			for (var i = 0; i < $scope.myFollowingList.length; i++)  {
				if ($scope.myFollowingList[i].handle === $scope.user.email)  {
					$scope.message = 'You are already following ' + $scope.user.email + '!';
					$scope.user.email = '';
					return;
				}
			}

      $scope.submitted = true;
      
      if(form.$valid) {
        user.checkUsername({
          email: $scope.user.email
        }, function(response) {
					// console.log('user.checkUsername callback: ' + JSON.stringify(response));
					if (response && response.status === 'Ok') {
						var toFollow = $scope.user.email;
						$scope.myFollowingList.unshift({handle: toFollow, tweets:[]});
						// console.log($scope.myFollowingList);

						following.follow({
								uid: uid,
								followingList: $scope.myFollowingList,
								toFollow: toFollow
							}, function(fResponse)	{
								// console.log('following.follow callback: ' + JSON.stringify(fResponse));
								if (fResponse && fResponse.status === 'Ok') {
									$scope.message = 'You are now following ' + toFollow + '!';
									$scope.user.email = '';
								}
								else	{
									$scope.message = fResponse.message;
								}

							});

					} else {
	          $scope.message = response.message;
					}
        });
        // .then( function() {
          // Logged in, redirect to home
          // $location.path('/');
        // })
        // .catch( function(err) {
          // err = err.data;
          // $scope.errors.other = err.message;
        // });
      }
    };

		$scope.unfollowConfirmation = function (index) {
			$scope.toUnfollowIndex = index;
			$scope.toUnfollow = $scope.myFollowingList[$scope.toUnfollowIndex].handle;
			modalInstance = $modal.open({
				templateUrl: 'partials/confirmation_modal.html',
				controller: 'ConfirmationModalInstanceCtrl',
				backdrop: true,
				resolve: {
					options: function()	{
						return {header: 'Unfollow ' + $scope.toUnfollow, body: 'Are you sure you want to unfollow ' + $scope.toUnfollow + '?', parent: $scope, fn: '$scope.options.parent.unfollow()'};
					},
				}
			});
		};

		$scope.unfollow = function () {
			$scope.myFollowingList.splice($scope.toUnfollowIndex,1);
			following.unfollow({
					uid: uid,
					followingList: $scope.myFollowingList,
					toUnfollow: $scope.toUnfollow
				}, function(fResponse)	{
					$scope.message = 'You are no longer following ' + $scope.toUnfollow + '!';
				});
		};

		$scope.retrieveFolloweeTweets = function(index)	{
			var followee = $scope.myFollowingList[index];
			// console.log(followee);
			if (followee !== undefined && followee.tweets.length === 0)	{
				//retrieve followee's tweets

				following.retrieveFolloweeTweets({
					uid: followee.handle
				},	function(response)	{
	        if (response && response.status === 'Ok' && response.tweets !== undefined)	{
						followee.tweets = response.tweets;
	        }
	        // console.log($scope.myFollowingList);
				});

			}
		};

		$scope.search = function () {
			if ($scope.user.email === "" || $scope.user.email == null || $scope.user.email.length < 4)	{
				return;
			}

			user.lookupUsername({
				searchString: $scope.user.email
			},	function(response)	{
        // console.log(response);
        if (response && response.status === 'Ok')	{
					$scope.matchingUsersList = response.users;
					// console.log($scope.matchingUsersList);
        }
			});			
		};

		$scope.selectUser = function (index) {
			$scope.user.email = $scope.matchingUsersList[index].split(":")[0];
			$scope.matchingUsersList = [];
		};

	}]);

angular.module('tweetabaseApp')
  .controller('ConfirmationModalInstanceCtrl', ['$scope', '$modalInstance', 'options', function ($scope, $modalInstance, options){
		$scope.options = options;

	  $scope.yes = function () {
			$modalInstance.close();
			if ($scope.options.fn !== undefined)	{
				eval($scope.options.fn);
			}
	  };

	  $scope.no = function () {
	    $modalInstance.dismiss('cancel');
		};
	}]);
