let express = require('express')
let bodyParser = require('body-parser')
let session = require('express-session');
let db = require('./initModule.js')
let app = express()
let bcrypt = require('bcrypt-as-promised')
const nodemailer = require('nodemailer'); //sandgrid?

let multer  = require('multer');
let upload = multer({ dest: 'upload/'});
let fs = require('fs');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

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
	let userId = req.session.userId
	res.render("searchpost", {userId})
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

app.get("/profile", function(req, res) {
	res.render("profile")
})

app.post('/uploadhandler', upload.single("profilepic"), function (req,res) {

  /** When using the "single"
      data come in "req.file" regardless of the attribute "name". **/
  var tmp_path = req.file.path;

  /** The original name of the uploaded file
      stored in the variable "originalname". **/
  var target_path = 'uploads/' + req.file.originalname;

  console.log(tmp_path)
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

	bcrypt.hash(password, null, null, function(err, hash){ 
		password = hash
		return password
	})
	.then( password => {
		User.create( {
			firstName: firstName,
			lastName: lastName,
			email: email,
			password: password
		})
		.then(newUser => {
			console.log("New User created: " + newUser.get({
					plain: true
				})
			)
			let transporter = nodemailer.createTransport({
			    service: 'gmail',
			    auth: {
			        user: process.env.GMAIL_USERNAME,
			        pass: process.env.GMAIL_PASSWORD
			    }
			});
			
			//this validation hash is the same for every user. 	
			let activate = bcrypt.hash("activate", null, null, function(err, hash){ 
				return hash
			})

			// setup email data with unicode symbols
			let mailOptions = {
			    from: '"Fred Foo 👻" <foo@blurdybloop.com>', // sender address
			    to: newUser.email, // list of receivers
			    subject: 'Activate your account', // Subject line
			    text: 'Please activate your account', // plain text body
			    html: '<b>Please activate your account</b>' // html body
			};

			transporter.sendMail(mailOptions, (error, info) => {
			    if (error) {
			        return console.log(error);
			    }
			    console.log('Message %s sent: %s', info.messageId, info.response);
			});
		})
		.then( function(){
			res.redirect("login")
		})
	})
	.catch(function(e) {
		console.log(e)
	})	
})

//test
app.get("/validationhandler", function(req, res) {
	let validationhash = req.params.val
	let userId = req.params.userId

	bcrypt.compare("activate", validationhash, function(err, res) {
	})
	.then( userId => {
		return User.findById(userId)
	})
	.then(user => {
		user.update({
			activated: true
		})
	})
	.then( function() {
		//do something
	})

})

//Login Handler
app.post('/loginhandler', function(req, res){
	let email = req.body.email
	let password = req.body.password

	User.findOne({where: {email: email}})
	.then(function(userRow){
		bcrypt.compare(password, userRow.password, function(err, res) {
		})
		.then( function() {
			console.log("Well hello there, " + userRow.firstName)
			//start session
			req.session.userId = userRow.id
			req.session.loggedIn = true
			req.session.firstName = userRow.firstName
			res.redirect('/viewmessagesofuser')		
		})
		.catch(function(e){
			console.log(e)
			res.redirect("/login")
		})
	})
	.catch(function(e) {
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
	let userId = req.session.userId
	userName = userName.split(" ")

	//when searched for combination of first- and lastname
	if(userName.length === 2) {
	User.findAll({ where: {firstName: userName[0], lastName: userName[1]}})
	.then(followers => {
		res.render("showfollowers", {followers, userId}) //followers as a name is not optimal, but the principle is very similar
	})}
	//when just searched for firstName (just lastName not implemented)
	else if (userName.length === 1) {
		UserName.findAll({ where: {firstName: userName[0], lastName: userName[1]}})
		.then(followers => {
		res.render("showfollowers", {followers, userId}) //name of pug file and variable are not optimal, but the principle is very similar
		})
	}
})

app.post("/checkmailavailability", function(req, res) {
	let email = req.body.email

	User.findAll({where: {email: email}})
	.then( result => {
		//result.length is to check if user with email adress is found
		if(result.length === 0) {
			res.send("not found")
		}
		else {
			console.log("found")
			res.send("found")
		}
	})
})


let server = app.listen(2500, function () {
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