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

app.use(session({
	secret: "wow much secret very security",
    resave: true,
    saveUninitialized: false
}));

app.get("/search", function(req, res) {
	let userId = req.session.userId
	res.render("search", {userId})
})

app.get("/searchpost", function (req, res) {
	res.render("searchpost")
})

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

	User.findById(userId).then( currentUser => {
	    User.findById(followId).then( follows => {
	        currentUser.addFollowed(follows); 
	    });
	});
})

app.post("/unfollowhandler", function(req, res) {
	let userId = req.session.userId
	let followedId = req.body.followedId

	User.findById(userId)
	.then( currentUser => {
		User.findById(followedId)
		.then( follows => {
			currentUser.removeFollowed(follows)
		})
	})
	.catch(e => console.log(e))
})

app.get("/viewfollowed", function(req, res) {
	let userId = req.session.userId
	
	User.findById(userId)
	.then( user => {
		user.getFolloweds()
		.then( followeds => {
			res.render("showfollowed", {followeds, userId})
		})		
	})	
})

app.get("/viewfollowers", function(req, res) {
	let userId = req.session.userId

	User.findById(userId)
	.then( user => {
		user.getFollowers()
		.then( followers => {
			res.render("showfollowers", {followers, userId})
		})		
	})
})

app.post('/livesearch', function(req, res) {
    let typed = req.body.typed

    User.findAll()
    .then( users => {
    	//custom function at bottom of this file
    	return searchUser(users, typed)
    })
    .then( searchResult => {
    	res.send(searchResult)
    })
})

app.post("/livesearchpost", function(req, res) {
	let typed = req.body.typed

	Post.findAll()
	.then( posts => {
		//custom function at bottom of this file
		return searchPost(posts, typed)
	})
	.then( searchResult => {
		console.log("Result: " + searchResult)
		res.send(searchResult)
	})
})

app.post("/searchposthandler", function(req, res) {
	let title = req.body.typed
	let userId = req.session.userId

	Post.findAll({where: {title: title}, 
		include: [User, 
			{
				model: Comment,
				include: [
					User
				]
			}
		]
	})
	.then(posts => {
		res.render("showallmessages2", {posts, userId})
	})
})

app.post("/searchuserhandler", function(req, res) {
	let userName = req.body.typed
	userName = userName.split(" ")

	//when searched for combination of first- and lastname
	if(userName.length === 2) {
	User.findAll({ where: {firstName: userName[0], lastName: userName[1]}})
	.then(followers => {
		res.render("showfollowers", {followers}) //followers as a name is not optimal, but the principle is very similar
	})}
	//when just searched for firstName (just lastName not implemented)
	else if (userName.length === 1) {
		UserName.findAll({ where: {firstName: userName[0], lastName: userName[1]}})
		.then(followers => {
		res.render("showfollowers", {followers}) //name of pug file and variable are not optimal, but the principle is very similar
		})
	}
})

let server = app.listen(3000, function () {
	console.log('Server running on port: ' + server.address().port)
})

//custom functions
function searchUser(users, typed) {
	let fullName = ""
	//returns search result if found else default(undefined)
	for(let i = 0; i <= (users.length - 1); i++) {
		let fullName =  users[i].firstName + users[i].lastName
		let partialName = fullName.slice(0, typed.length)
		
		if(partialName === typed){
			return (users[i].firstName + " " + users[i].lastName)
		}
	}
}

function searchPost(posts, typed) {
	let title = ""
	//returns search result if found else default(undefined)
	for(let i = 0; i <= (posts.length - 1); i++) {
		let title =  posts[i].title
		let partialName = title.slice(0, typed.length)
		
		if(partialName === typed){
			return (posts[i].title)
		}
	}
}