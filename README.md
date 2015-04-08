Tweetaspike
===========

The purpose of this sample application is to show that Aerospike APIs on top of a key-value store are an effective way to write applications with Aerospike as the only database. To demonstrate, this sample app describes the design and implementation of a "twitter-like" application called Tweetaspike.

The code is easy to follow and substantial enough to be a foundation in learning how to leverage Aerospike's technology and it can also be used as a "seed" application that you can expand.

This application is built using -- Aerospike + Express + Angular + Node -- ASEAN (/a-shawn/) Stack.

## Application Features

  * Register | Login | Logout
  * Post &mdash; similar to tweets, only cooler since there's no character limit :)
  * Follow &mdash; follow other users
  * Unfollow &mdash; unfollow users you are following
  * Following &mdash; list of users you follow including their posts
  * Followers &mdash; list of users that follow you including their posts
  * Alerts &mdash; real-time alerts when users you are following add new posts

## Aerospike's Open Source Technologies Used

  * Aerospike Server
  * Aerospike Node.js Client

## Other Technologies Used
  * <a href='http://nodejs.org/' target='_blank'>Node.js</a>
  * <a href='https://angularjs.org/' target='_blank'>AngularJS</a>
  * <a href='http://expressjs.com/' target='_blank'>Express</a>
  * <a href='http://socket.io/' target='_blank'>Socket.io</a>
  * <a href='http://angular-ui.github.io/bootstrap/' target='_blank'>Angular UI</a>

## Get Up and Running

### Compatibility

- Node.js:
    * Versions: v0.10.2 thru v0.10.36 (**IMP**: Aerospike Node.js Client currently does not support versions v0.11.x and greater)
- OS:
    * CentOS/RHEL 6.x, Debian 6+, Ubuntu 12.04, Ubuntu 14.04, Mac OS X (**IMP**: Aerospike Node.js Client currently does not have support for Windows)
- Mac OS X:
    * 10.8 or greater
    * Xcode 5 or greater
    * Xcode Dev Tools

### Prerequisites

- Aerospike Server – To install the latest version, [click here](http://www.aerospike.com/download/server/latest). The server should be running and accessible from this app.
- Node.js – To install a compatible version between v0.10.2 and v0.10.36, visit http://nodejs.org/dist/ 

Note: To easily manage your existing Node.js installations and switch between  versions, use version manager such as nvm. To install nvm, visit https://www.npmjs.com/package/nvm. Once installed, you may use it to install different versions of Node.js using command nvm install <version> or switch to a different version that you already have installed using command nvm use <version>

### Technical Know-How

Even though this is a pretty lightweight application, I’ve used different technologies to make it decent enough – ***visually & functionally*** – and covering all aspects as well as walking through the entire codebase is beyond the scope of this README. So, good understanding and working knowledge of the following technologies is presumed.

 * Node.js 
 * AngularJS 
 * Express
 * Socket.io
 * Angular UI

### Usage

#### Build

To build the application and resolve dependencies, run command: **npm install**

#### Config

In [aerospike_config.js](https://github.com/aerospike/tweetaspike/blob/master/lib/controllers/aerospike_config.js), update **aerospikeCluster** and **aerospikeClusterPort** such that it points to your instance running Aerospike Server.

#### Run

To run the application, run command: **node server**

You should see message **Connection to Aerospike cluster succeeded!**

If you see *Connection to Aerospike cluster failed!*, please make sure your instance of Aerospike Server is running and available. Also confirm that **aerospikeCluster** and **aerospikeClusterPort** are set correctly as described above in the Config section.

If all is well, open web browser and point it to: [http://localhost:9000](http://localhost:9000)

##### Updating Styles

After making changes to [app.scss](https://github.com/aerospike/tweetaspike/blob/master/app/styles/app.scss) or [main.scss](https://github.com/aerospike/tweetaspike/blob/master/app/styles/app.scss), run command **grunt** from the application root folder. This will compile modified .scss files and generate respective .css files and add/replace them in .tmp folder for the application to load.

## Additional Information

### Data Models

#### Users

Key: uid

Bins:
*   uid - String
*   username - String
*   password - String
*   auth - String
*   tweetCount - Integer

Sample Record:
```
{ ns: 'test', set: 'users', key: 'dash' } 
{ uid: 'dash',
  username: 'dash',
  password: 'dash',
  auth: 'c18d1b9a-19fb-4b2b-b4d3-560c8af07ef6',
  tweetCount: 3 }
```

Note: For simplicity, password is stored in plain-text

#### Tweets

Key: uid:tweetcount 

Bins:
*   key - String
*   username - String
*   tweet - String
*   ts - Integer

Sample Record:
```
{ ns: 'test', set: 'tweets', key: 'dash:0' } 
{ key: 'dash:0',
  username: 'dash',
  tweet: 'Put.a.Bird.On.It',
  ts: 1427945664001 }
```

Note: Key for Tweet record includes tweet counter so you can use Aerospike's Batch operation to retrieve all tweets for a given user. 

#### Followers

Key: uid

Bin:
*    followers - Array of Strings

Sample Record:
```
{ ns: 'test', set: 'followers', key: 'dash’ } 
{ followers:
   [ 'joe',
     'jane',
     'moe',
     'homer',
     'peter'] }
```

#### Following

Key: uid

Bin:
*    following - Array of Objects

Sample Record:

```
{ ns: 'test', set: 'following', key: 'dash' } 
{ following:
   [ { tweets: [], handle: 'claire' },
     { tweets: [], handle: 'brandon' },
     { tweets: [], handle: 'donovan' },
     { tweets: [], handle: 'mary' },
     { tweets: [], handle: 'mike' },
     { tweets: [], handle: 'eva' },
     { tweets: [], handle: 'mark' }] }
```

Note: The empty tweets array gets populated on-demand in the client when user clicks / wants to see the tweets for a given user.

### Application Flow

#### Register

* Enforces unique usernames
* Requires username and password
* Creates User record

#### Login
*    Check if User record with *username* key exists
    * If it does not exist, username entered is invalid 
    * If it exists, check if entered *password* matches the User record
      * If it does not, password entered is invalid 
      * If passwords match:
        * Store auth in HTML5 Web/Local Storage
          * This value is used to check if user is logged in when browsing to various pages within the app. If this value is not found, user is routed back to Login
          * This value is cleared when user Logs out
          * Log user in 

#### New Tweet/Post
*    Increments tweet count by 1 in the User record
*    Adds new Tweet record with key *\<uid\>:\<tweetCount\>*

#### Follow
*    Adds new object (tweets/posts array and handle of user-to-follow) to array of objects stored and accessed via *uid* key for the current user
*    Retrieves followers (array accessed via *uid* key) of user-to-follow user and adds current user as a follower 

#### Unfollow
*    Removes object (tweets/posts array and handle of user-to-unfollow) from array of objects stored and accessed via *uid* key for the current user
*    Retrieves followers (array accessed via *uid* key) of user-to-unfollow user and removes current user as a follower 

#### Following
*    Shows a list of users that current user is following
*    On initial load, only the list of `following` users is retrieved using *uid* key
*    The tweets/posts of `following` users are retrieved on-demand when user clicks on their row

#### Followers
*    Shows a list of users that are following current user
*    On initial load, only the list of `followers` users is retrieved using *uid* key
*    The tweets/posts of `followers` users are retrieved on-demand when user clicks on their row

#### Real-time Alerts
*    The technology used in this app to deliver real-time alerts is **Socket.io**
*    The app is setup to listen for `tweet` event -- which is triggered when a new tweet/post gets added by a user. The object sent as a message to Socket.io client emit API looks like `{uid: uid, tweet: tweetText}`
*    Upon receiving a `tweet` event it then gets emitted out (in our case as a `broadcast` event) to the connected clients along with data object `{uid: uid, tweet: tweetText}` it received
*    Individual clients are setup to listen on `socket:broadcast` event emitted as described above -- here the listener loops through users that the current user is following and if one of the users’ uid matches that of the data object it received `{uid: uid, tweet: tweetText}`, an alert is displayed

#### Logout
*    Clears out auth stored in HTML5 Web/Local Storage and routes the user back to Login



