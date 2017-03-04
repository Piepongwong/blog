let express = require('express')
let bodyParser = require('body-parser')
let session = require('express-session');
let db = require('./initModule.js')
let app = express()

let User = db.User
let Post = db.Post
let Comment = db.Comment
let sequelize = db.sequelize

//necessary?
app.use(bodyParser.urlencoded({ extended: true })); 

app.set('view engine', 'pug');
app.set('views','./views');
app.use(express.static('public'))
// app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(session({
    secret: 'oh wow very secret much security',
    resave: true,
    saveUninitialized: false
}));


app.get("/signup", function(req, res) {
	res.render('signup')
})

app.get("/login", function(req, res) {
	res.render('login')
})

app.get("/logout", function(req, res) {
	req.session.destroy(function(err) {
		res.redirect("home")
	})
})

app.get(["/", "/home"], function(req, res) {
	let userId = req.session.userId

	res.render("home", {userId})
})

app.get("/postmessage", function(req, res) {

	if(req.session.userId === undefined) {
		res.end("Your are not logged in")
	}
	let userId = req.session.userId
	res.render('postmessage', {userId})
})

app.get("/login", function(req, res) {
	res.render('login')
})

//Signup Handler
app.post('/signuphandler', function(req, res){
	let firstName = req.body.firstName
	let lastName = req.body.lastName
	let email = req.body.email
	let password = req.body.password
	let passwordCheck = req.body.passwordCheck

	if(password != passwordCheck) {
		res.send("Passwords do not match you dumbass!")
	}
	else {
		User.create( {
			firstName: firstName,
			lastName: lastName,
			email: email,
			password: password
		})
		.then(function(newUser) {
			console.log("New User created: " + newUser.get({
				plain: true
			}))
			res.redirect("login")
		})
		.catch(function(e) {
			console.log("An error has occured, you probably did something dumb, you dumbass!")
		})
	}
})

//Login Handler
app.post('/loginhandler', function(req, res){
	let email = req.body.email
	let password = req.body.password

	User.findOne({where: {email: email}})
		.then(function(userRow){
			
			if( (password != userRow.password)) {
				console.log("Hmm, sure you got everything right?")
				res.redirect("/login")
			}
			else if(password === userRow.password) {
				console.log("Well hello there, " + userRow.firstName)
				//start session
				req.session.userId = userRow.id
				req.session.loggedIn = true
				req.session.firstName = userRow.firstName
				res.redirect('/viewmessagesofuser')
			}
		})
		.catch(function(e) {
			console.log("An error has occured, you probably did something dumb, you dumbass!")
			console.log(e)
			res.end()
		})
})

//Post Message Handler
app.post('/postmessagehandler', function(req, res) {
	if(req.session.loggedIn === undefined){
		res.redirect("login")
	}

	let userId = req.session.userId //session
	let title = req.body.title
	let body = req.body.body

	User.findById(userId)
	.then(user => {
		return user.createPost({
			title: title,
			body: body
		})
	})
	.then(createdPost => {
		res.redirect("/viewmessages")
	})
	.catch( e => console.log('An error has occured.' + e))
})

//Post Comment Handler
app.post('/postcommenthandler', function(req, res) {
	let userId =  req.session.userId
	let body = req.body.body
	let postId = req.body.postId

	sequelize.sync()
	.then( function(){
		return Post.findById(postId)
	})
	.then(post => {
		return post.createComment( {
			body: body
		})
	})
	.then( comment => {
		User.findById(userId)
		.then( user => {
			comment.setUser(user)
		})
	})
	.then(function(createdComment){
		console.log(createdComment)
		res.redirect('back')
	})
	.catch(function(e) {
		console.log(e)
	})
})

//View all messages
app.get('/viewmessages', function(req, res) {
	let allPosts;
	let userId = req.session.userId

	Post.findAll({include: [User, 
		{
			model: Comment,
			include: [
				User
			]
		}
	]})
	.then(function(posts){
		res.render("showallmessages2", {posts, userId})
	})
})

//View all messages of User
app.get('/viewmessagesofuser', function(req, res) {
	if(req.session.userId === undefined){
		res.redirect("login")
	}

	let userId = req.session.userId //session variable	
	
	console.log("THIS IS THE FOLLOWED ID: " + req.query.followedId)
	//Same route is used to view posts of followed
	if(req.query.followedId != undefined) {
		userId = req.query.followedId
	}	

	let allPosts;

	Post.findAll( 
		{
			where: {userId: userId},
			include: [User, 
				{
					model: Comment,
					include: [
						User
					]
				}
			]}	
	)
	.then(function(posts){
		res.render("showallmessages2", {posts, userId})
	})
})

app.post("/followhandler", function(req, res) {
	let userId = req.session.userId
	let followId = req.body.followId
	
	User.findById(userId)
	.then( currentUser => {
		User.findById(followId)
		.then( follows => {
			currentUser.addUser(follows)
		})
	})
	.catch(e => console.log(e))	
})

app.post("/unfollowhandler", function(req, res) {
	let userId = req.session.userId
	let followedId = req.body.followedId

	User.findById(userId)
	.then( currentUser => {
		User.findById(followedId)
		.then( follows => {
			currentUser.removeUser(follows)
		})
	})
	.catch(e => console.log(e))
})

app.get("/viewfollowed", function(req, res) {
	let userId = req.session.userId
	//maybe implement in followers the followed and their followers as well so that it is possible to count those and give and overview
	User.findById(userId, {include: [User]})
	.then( user => {
		let followed = user.users
		res.render("showfollowed", {followed, userId})
	})	
})

app.get("/viewfollowers", function(req, res) {
	let userId = req.session.userId

	User.findAll({
	    include: [{
	        model: User,
	    }],
	    where: { userId: {$col: 'user.userId'}}
	})
	.then( followers => {
		res.render("showfollowers", {followers, userId})

	})

	//if I follow someone else he will stop being a follower of me unless that person is myself?!

})

let server = app.listen(3000, function () {
	console.log('Server running on port: ' + server.address().port)
})

