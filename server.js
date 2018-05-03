//importing express app as the variable
var express = require("express")
// creating an (instance) of express
var app = express()

// we will use this to create a root file path so express 
//    knows where to look for the html file
var path = require("path")

//setting up root path
app.get("/", function(req, res){
	// instructing server to return the html by looking in 2 places (arguments) using the 
	//filename and the path
	res.sendFile('index.html', {root: path.join(__dirname, './public')})
	})
//command to listen on a specific port- staring up a server on port 3000
app.listen(3000, function(){
	console.log("server running on port 3000");
})

