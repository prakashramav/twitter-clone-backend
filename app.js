const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const dbPath = path.join(__dirname, 'twitterClone.db')
const app = express()
app.use(express.json())
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//API 1

app.post('/register/', async (req, res) => {
  const {username, name, password, gender} = req.body
  if (password.length > 6) {
    const selectUserQuery = `
      SELECT * FROM user WHERE username = '${username}';
    `
    const dbUser = await db.get(selectUserQuery)
    if (dbUser !== undefined) {
      res.status(400)
      res.send('User already exists')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const createUserQuery = `
        INSERT INTO user (name, username, password, gender)
        VALUES(
          '${name}',
          '${username}',
          '${hashedPassword}',
          '${gender}'
        )
      `
      await db.run(createUserQuery)
      res.send('User created successfully')
    }
  } else {
    res.status(400)
    res.send('Password is too short')
  }
})

//API 2

app.post('/login/', async (req, res) => {
  const {username, password} = req.body
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
  `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    res.status(400)
    res.send('Invalid user')
  } else {
    const compareHashedPassword = await bcrypt.compare(
      password,
      dbUser.password,
    )
    if (compareHashedPassword === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'My_secreat_token_key')
      res.send({jwtToken})
    } else {
      res.status(400)
      res.send('Invalid password')
    }
  }
})

//Autherization

const authorizationToken = async (req, res, next) => {
  let jwtToken
  const autheHeaders = req.headers['authorization']
  if (autheHeaders !== undefined) {
    jwtToken = autheHeaders.split(' ')[1]
  }
  if (jwtToken === undefined) {
    res.status(401)
    res.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'My_secreat_token_key', async (error, payload) => {
      if (error) {
        res.status(401)
        res.send('Invalid JWT Token')
      } else {
        console.log(payload)
        req.username = payload.username
        next()
      }
    })
  }
}

//API 3

app.get('/user/tweets/feed/', authorizationToken, async (req, res) => {
  const {username} = req

  // 1. Get logged-in user's ID
  const getUserQuery = `SELECT user_id FROM user WHERE username = ?;`
  const dbUser = await db.get(getUserQuery, [username])

  // 2. Fetch latest 4 tweets of people the user follows
  const getTweetsQuery = `
    SELECT 
      user.username,
      tweet.tweet,
      tweet.date_time AS dateTime
    FROM
      follower
      INNER JOIN tweet ON follower.following_user_id = tweet.user_id
      INNER JOIN user ON tweet.user_id = user.user_id
    WHERE
      follower.follower_user_id = ?
    ORDER BY
      tweet.date_time DESC
    LIMIT 4;
  `

  const tweets = await db.all(getTweetsQuery, [dbUser.user_id])

  res.send(tweets)
})

//API 4

app.get('/user/following/', authorizationToken, async (req, res) => {
  const {username} = req

  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const getFollowingQuery = `
    SELECT user.name AS name
    FROM follower
    INNER JOIN user ON follower.following_user_id = user.user_id
    WHERE follower.follower_user_id = ?;
  `
  const followingList = await db.all(getFollowingQuery, [dbUser.user_id])

  res.send(followingList)
})

//API 5

app.get('/user/followers/', authorizationToken, async (req, res) => {
  const {username} = req

  // Find logged-in user id
  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const getFollowersQuery = `
    SELECT user.name AS name
    FROM follower
    INNER JOIN user ON follower.follower_user_id = user.user_id
    WHERE follower.following_user_id = ?;
  `
  const followersList = await db.all(getFollowersQuery, [dbUser.user_id])

  res.send(followersList) // [{name: "Follower1"}, {name: "Follower2"}]
})

//API 6

app.get('/tweets/:tweetId/', authorizationToken, async (req, res) => {
  const {username} = req
  const {tweetId} = req.params

  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const checkAccessQuery = `
    SELECT 1
    FROM follower
    INNER JOIN tweet ON follower.following_user_id = tweet.user_id
    WHERE follower.follower_user_id = ? AND tweet.tweet_id = ?;
  `
  const access = await db.get(checkAccessQuery, [dbUser.user_id, tweetId])

  if (!access) {
    res.status(401)
    res.send('Invalid Request')
    return
  }

  const getTweetDetailsQuery = `
    SELECT 
      tweet.tweet AS tweet,
      COUNT(DISTINCT like.like_id) AS likes,
      COUNT(DISTINCT reply.reply_id) AS replies,
      tweet.date_time AS dateTime
    FROM tweet
    LEFT JOIN like ON tweet.tweet_id = like.tweet_id
    LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id
    WHERE tweet.tweet_id = ?;
  `
  const tweetDetails = await db.get(getTweetDetailsQuery, [tweetId])

  res.send(tweetDetails)
})

//API 7

app.get('/tweets/:tweetId/likes/', authorizationToken, async (req, res) => {
  const {username} = req
  const {tweetId} = req.params

  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const checkAccessQuery = `
    SELECT 1
    FROM follower
    INNER JOIN tweet ON follower.following_user_id = tweet.user_id
    WHERE follower.follower_user_id = ? AND tweet.tweet_id = ?;
  `
  const access = await db.get(checkAccessQuery, [dbUser.user_id, tweetId])

  if (!access) {
    res.status(401)
    res.send('Invalid Request')
    return
  }

  const getLikesQuery = `
    SELECT user.username
    FROM like
    INNER JOIN user ON like.user_id = user.user_id
    WHERE like.tweet_id = ?;
  `
  const likesArray = await db.all(getLikesQuery, [tweetId])

  const usernames = likesArray.map(each => each.username)

  res.send({likes: usernames})
})

// TWEETid

app.get('/tweets/', async (req, res) => {
  const selectTweetQuery = `
    SELECT * FROM Tweet;
  `
  const tweet = await db.all(selectTweetQuery)
  res.send(tweet)
})

//API 8

app.get('/tweets/:tweetId/replies/', authorizationToken, async (req, res) => {
  const {username} = req
  const {tweetId} = req.params

  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const checkAccessQuery = `
    SELECT 1
    FROM follower
    INNER JOIN tweet ON follower.following_user_id = tweet.user_id
    WHERE follower.follower_user_id = ? AND tweet.tweet_id = ?;
  `
  const access = await db.get(checkAccessQuery, [dbUser.user_id, tweetId])

  if (!access) {
    res.status(401)
    res.send('Invalid Request')
    return
  }

  const getRepliesQuery = `
    SELECT user.name AS name, reply.reply AS reply
    FROM reply
    INNER JOIN user ON reply.user_id = user.user_id
    WHERE reply.tweet_id = ?;
  `
  const repliesArray = await db.all(getRepliesQuery, [tweetId])

  res.send({replies: repliesArray})
})

//API 9

app.get('/user/tweets/', authorizationToken, async (req, res) => {
  const {username} = req

  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  const getUserTweetsQuery = `
    SELECT
      tweet.tweet AS tweet,
      COUNT(DISTINCT like.like_id) AS likes,
      COUNT(DISTINCT reply.reply_id) AS replies,
      tweet.date_time AS dateTime
    FROM tweet
    LEFT JOIN like ON tweet.tweet_id = like.tweet_id
    LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id
    WHERE tweet.user_id = ?
    GROUP BY tweet.tweet_id
    ORDER BY tweet.date_time DESC;
  `
  const userTweets = await db.all(getUserTweetsQuery, [dbUser.user_id])

  res.send(userTweets)
})

//API 10 Create a Tweet

app.post('/user/tweets/', authorizationToken, async (req, res) => {
  const {username} = req
  const {tweet} = req.body

  // Find logged-in user_id
  const selectUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(selectUserQuery, [username])

  // Insert new tweet
  const createTweetQuery = `
    INSERT INTO tweet (tweet, user_id, date_time)
    VALUES (?, ?, DATETIME('now'));
  `
  await db.run(createTweetQuery, [tweet, dbUser.user_id])

  res.send('Created a Tweet')
})

//API 11

app.delete('/tweets/:tweetId/', authorizationToken, async (req, res) => {
  const {username} = req
  const {tweetId} = req.params

  const getUserQuery = `
    SELECT user_id FROM user WHERE username = ?;
  `
  const dbUser = await db.get(getUserQuery, [username])

  const getTweetQuery = `
    SELECT * FROM tweet 
    WHERE tweet_id = ? AND user_id = ?;
  `
  const tweet = await db.get(getTweetQuery, [tweetId, dbUser.user_id])

  if (!tweet) {
    res.status(401)
    res.send('Invalid Request')
  } else {
    const deleteTweetQuery = `
      DELETE FROM tweet WHERE tweet_id = ?;
    `
    await db.run(deleteTweetQuery, [tweetId])
    res.send('Tweet Removed')
  }
})

module.exports = app
