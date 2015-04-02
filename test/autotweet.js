var args = require('yargs').argv;;
// console.log(args);

var asConfig = require('../lib/controllers/aerospike_config');
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
    console.log("\nConnection to Aerospike cluster failed!\n");
    console.log(response);
  }
});

/**
 * High resolution timer.
 */
function timer(delay, callback)
{
    // self-reference
    var self = this;

    // attributes
    var counter = 0;
    var start = new Date().getTime();

    /**
     * Delayed running of the callback.
     */
    function delayed()
    {
        callback(delay);
        counter ++;
        var diff = (new Date().getTime() - start) - counter * delay;
        setTimeout(delayed, delay - diff);
    }

    // start timer
    delayed();
    setTimeout(delayed, delay);
}

function tweet()	{

	var handpickedUsers = ['dash','brian','claire','young','caitlin','mikel','monica','srini','chris','michael','brad','loren','theresa','joe'];
  var randomTweets = ['For just $1 you get a half price download of half of the song and listen to it just once.','People tell me my body looks like a melted candle','Come on movie! Make it start!','Byaaaayy','Please, please, win! Meow, meow, meow!','Put. A. Bird. On. It.','A weekend wasted is a weekend well spent','Would you like to super spike your meal?','We have a mean no-no-bring-bag up here on aisle two.','SEEK: See, Every, EVERY, Kind... of spot','We can order that for you. It will take a year to get there.','If you are pregnant, have a soda.','Hear that snap? Hear that clap?','Follow me and I may follow you','Which is the best cafe in Portland? Discuss...','Portland Coffee is for closers!','Lets get this party started!','How about them portland blazers!',"You got school'd, yo",'I love animals','I love my dog',"What's up Portland",'Which is the best cafe in Portland? Discuss...','I dont always tweet, but when I do it is on Tweetaspike'];
	var totalUsers = handpickedUsers.length;
	var totalTweets = randomTweets.length;
	var uid;
	var tKey;
	var randomTweet;
	var tweet;

	var t = new timer(1, function()	{
		// console.log('hello');
		uid = 'usr' + Math.floor((Math.random() * 10000) + 1);
		randomTweet = randomTweets[Math.floor((Math.random() * (totalTweets - 1)) + 0)];

    //TODO: add new tweet
    
	});
}

tweet();
