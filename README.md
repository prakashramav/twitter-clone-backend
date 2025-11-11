# 🐦 Twitter Clone Backend

This is the **backend** for the Twitter Clone project built using **Node.js**, **Express.js**, and **SQLite** database.  
It provides APIs for user authentication, tweets, followers, likes, and replies — simulating a simplified version of Twitter’s core features.

---

## 🚀 Features

- 👤 **User Authentication**
  - Register new users with unique usernames
  - Login using JWT-based authentication

- 🐦 **Tweets Management**
  - Post new tweets
  - View user tweets and feeds
  - Delete user tweets

- 💬 **Replies and Likes**
  - Like or reply to tweets
  - View list of users who liked or replied

- 👥 **Followers**
  - Follow other users
  - View followers and following lists

- 🔐 **Secure Routes**
  - Protected APIs using JSON Web Tokens (JWT)
  - Only authenticated users can access tweet and follower data

---

## 🛠️ Tech Stack

| Technology | Description |
|-------------|-------------|
| Node.js | JavaScript runtime environment |
| Express.js | Web framework for Node.js |
| SQLite | Lightweight relational database |
| bcrypt | Password hashing |
| jsonwebtoken | Authentication with JWT |
| dotenv | Manage environment variables |

---

## 📁 Project Structure


twitter-clone-backend/
│
├── app.js # Main application file
├── twitterClone.db # SQLite database
├── package.json # Project dependencies
├── .env # Environment variables (JWT secret, etc.)
└── README.md # Project documentation



---

## ⚙️ Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/prakashramav/twitter-clone-backend.git
cd twitter-clone-backend

2. Install dependencies
npm install

3. Create .env file
JWT_SECRET=your_secret_key
PORT=3000

4. Run the server
npm start

Server will start on:
http://localhost:3000/

```

# 🧩 API Endpoints
# 🔑 Authentication
Method	   Endpoint	    Description
POST	     /register/	  Register a new user
POST	     /login/	    Login user and get JWT token

# 🐦 Tweets
Method	      Endpoint	             Description
GET	          /user/tweets/	         Get all tweets of logged-in user
POST	        /user/tweets/	         Create a new tweet
DELETE	      /tweets/:tweetId/	     Delete user’s tweet
GET	         /user/tweets/feed/	     Get tweets from followed users

# 💬 Likes & Replies
Method	  Endpoint	                  Description
GET	      /tweets/:tweetId/likes/	    Get list of users who liked a tweet
GET	      /tweets/:tweetId/replies/	  Get replies for a tweet

# 👥 Followers
Method	        Endpoint	        Description
GET	            /user/following/	Get list of following users
GET	            /user/followers/	Get list of followers

# 🔒 Authentication

All endpoints except /register/ and /login/ require a JWT token.
# Include token in headers:
```bash
 Authorization: Bearer <your_jwt_token>
```

# 🧠 Database Schema

Tables:

user (user_id, name, username, password, gender)

tweet (tweet_id, tweet, user_id, date_time)

follower (follower_user_id, following_user_id)

reply (reply_id, tweet_id, user_id, reply)

like (like_id, tweet_id, user_id)

# 🧰 Example Requests
# Register
```bash
POST /register/
Content-Type: application/json

{
  "username": "rahul",
  "password": "rahul@2021",
  "name": "Rahul",
  "gender": "male"
}
```

# Login
```bash
POST /login/
Content-Type: application/json

{
  "username": "rahul",
  "password": "rahul@2021"
}
```


Response:
```bash
{ "jwtToken": "your_token_here" }
```

# 🧑‍💻 Developer Notes

Ensure SQLite DB file twitterClone.db exists in the root directory.

Do not push .env or database files to GitHub.

Update your JWT secret before deploying.

# 🤝 Contributing

Fork this repository

Create a feature branch (git checkout -b feature-name)

Commit your changes (git commit -m "Added new feature")

Push to your branch (git push origin feature-name)

Open a Pull Request

# 📄 License

This project is licensed under the MIT License — feel free to use and modify.
