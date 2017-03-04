
$(document).ready(function() {

/*	alert("loaded")
*/	$(".followed-card").click( function() {
		let id = $(this).attr("id")
		location.href="/viewmessagesofuser?followedId=" + id
	})

	$(".unfollow").click( function () {
		let id = $(this).attr("id")
		if( confirm("Are you sure you want to unfollow this user?")) {
			//send ajax post/get request
			console.log("confirmed")
			let xhttp;
			if (window.XMLHttpRequest) {
			    xhttp = new XMLHttpRequest()
			    } else {
			    // code for IE6, IE5
			    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
			}
			xhttp.open("POST", "unfollowhandler", true)
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
			xhttp.send("followedId=" + id)

			$('#total' + id).hide();
		}
	})

	$(".follow").click( function () {
		let id = $(this).attr("id")
		//send ajax post/get request
		let xhttp;
		if (window.XMLHttpRequest) {
		    xhttp = new XMLHttpRequest()
		    } else {
		    // code for IE6, IE5
		    xhttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		xhttp.open("POST", "followhandler", true)
		xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
		xhttp.send("followId=" + id)
	})
})