function validateSignup() {
	let validated = true;
	let regEmail = /^(.){1,20}@(.){1,20}\.[a-zA-Z]{1,6}$/
	let regName = /^[A-Za-z]{1,20}(’|-){0,1}[A-Za-z]{1,20}$/ 	//it also has to be possible to match O'Brian or Anna-Sophia
	let regPass = /^[A-Za-z0-9@\!+-_~§\^°\~%$&\s\?]*(?!password)$/

	let firstName = $('#firstName').val()
	let lastName = 	$('#lastName').val()
	let email = $('#email').val()
	let password = $('#password').val()
	let passwordCheck = $('#passwordCheck').val()

	if(!regName.test(firstName)) {
		$('#firstName').next().css("display", "inline")	
		validated = false;
	}

	if(!regName.test(lastName)) {
		$('#lastName').next().css("display", "inline")	
		validated = false;
	}

	if(!regEmail.test(email)) {
		$('#email').next().css("display", "inline")	
		validated = false;
	}
	else {
		//if email is in right format is checked with ajax request if email is available
		//function changes css to inline if not available and sets validated to false
		checkMailAvailability(email)
	}

	if(password !== passwordCheck) {
		//display error message at both password fields
		$('#password').next().html("* Passwords do not match")
		$('#password').next().css("display", "inline")
		$('#passwordCheck').next().html("* Passwords do not match")
		$('#passwordCheck').next().css("display", "inline")	
		validated = false;
	}

	else if(password === "Password") {
		$('#password').next().html("<p>* Please provide a password</p>")
		$('#password').next().css("display", "inline")
		$('#passwordCheck').next().html("<p>* Please provide a password</p>")
		$('#passwordCheck').next().css("display", "inline")
		validated = false;

	}
	else if(!regPass.test(password)) {
		$('#password').next().html("* Can not contain spaces or one of the following characters : \" ' , ; : #")
		$('#password').next().css("display", "inline")
		$('#passwordCheck').next().html("* Can not contain spaces or one of the following characters: \" ' , ; : #")
		$('#passwordCheck').next().css("display", "inline")
		validated = false;
	}

	if(validated) {
		return signuphandler
	}
	else {
		return false
	} 
}

function validateLogin() {
	let validated = true
	let regEmail = /^(.){1,20}@(.){1,20}\.[a-zA-Z]{1,6}$/
	let regPass = /^[A-Za-z0-9@\!+-_~§\^°\~%$&\s\?]*(?!password)$/
	
	let email = $('#email').val()
	let password = $('#password').val()

	if(!regPass.test(password)) {
		validated = false;
	}
	if(!regEmail.test(email)) {
		validated = false
	}

	if(validated) {
		return loginhandler
	}
	else {
		$('#password').next().css("display", "inline")
		return false
	} 	
}

function checkMailAvailability(email) {
	if (window.XMLHttpRequest) {
		// code for IE7+, Firefox, Chrome, Opera, Safari
		xmlhttp= new XMLHttpRequest();
	} 
	else {  // code for IE6, IE5
		xmlhttp= new ActiveXObject("Microsoft.XMLHTTP");
	}

	xmlhttp.onreadystatechange=function() {
		if (this.readyState==4 && this.status==200) {
			if(xmlhttp.responseText === "found") {	
				$('#email').next().html("<p>* E-mail adress not available</p>")
				$('#email').next().css("display", "inline")
				validated = false
			}
		}
	}
	xmlhttp.open("POST", 'http://localhost:3000/checkmailavailability' ,true);
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("email="+ email);
}