let Sequelize = require('sequelize')
//connect to DB
var sequelize = new Sequelize('blog', 'piepongwong', 'Wongpong', {
  host: 'localhost',
  dialect: 'postgres'
})

sequelize
.authenticate()
.then(function(err) {
  console.log('Connection has been established successfully.');
  sequelize.sync(/*{force: true}*/)
  .catch( (error) => { console.log(error                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   )})
})
.catch(function (err) {
  console.log('Unable to connect to the database:', err);
})

//define Users
  const User = sequelize.define('user', {
    firstName: {
      type: Sequelize.STRING
    },
    lastName: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    activated: {
      type: Sequelize.BOOLEAN
    }
  })

//define Posts
const Post = sequelize.define('post', {
    title: {
      type: Sequelize.STRING
    },
    body: {
      type: Sequelize.STRING
    }
})

//define Comments
const Comment = sequelize.define('comment', {
    body: {
      type: Sequelize.STRING
    }
})

User.hasMany(Post)
Post.belongsTo(User)

User.hasMany(Comment) 
Comment.belongsTo(User)

Post.hasMany(Comment)
Comment.belongsTo(Post)


User.belongsToMany(User, {as: {singular: "Follower", plural: "Followers"}, foreignKey: "FollowerId", through: "Follower_Followeds"})
User.belongsToMany(User, {as: {singular: "Followed", plural: "Followeds"}, foreignKey: "FollowedId", through: "Follower_Followeds"})

module.exports = { 
  //Define Users
  User: User,
  //Define Posts
  Post: Post,
  //Define Comments
  Comment: Comment,
  //for sync operations
  sequelize: sequelize
}

/*Optional Define Tags

Optional Define Categories
*/
  //signup page




 

