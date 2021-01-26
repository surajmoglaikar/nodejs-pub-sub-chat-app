var app = require('http').createServer(handler),
	io = require('socket.io').listen(app),
	fs = require('fs');
	express = require('express');
	mongoose = require('mongoose');
	var bcrypt = require('bcrypt-nodejs');
	users={};

 	app.listen(3000); 
	console.log('connected to server: 3000');
	
	mongoose.connect('mongodb://localhost/chat',{useNewUrlParser:true,useUnifiedTopology:true},function(err){
    if(err){
        console.log(err);
    }else{
        console.log('connected to mongodb');
    }
	});

	
	    var chatSchema = mongoose.Schema({
    	users: { user: String, password: String },
    	created: {type: Date, default: Date.now}
	});

	chatSchema.methods.generateHash = function(password) {
		return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
	  };
	  
	  // checking if password is valid
	  chatSchema.methods.validPassword = function(password) {
		return bcrypt.compareSync(password, this.password);
	  };

 	var chat = mongoose.model('message', chatSchema);

	function handler(req, res) { 
		fs.readFile(__dirname + '/index.html',
			function (err, data) {
				if (err) {
					res.writeHead(500);
					return res.end('Error loading index.html');
				}
				
				res.writeHead(200);
				res.end(data);
			});
	}

	io.sockets.on('connection', function (socket) {
		console.log('a user connected' + socket.id);
		socket.on('chat', function (data) {
			var msg = JSON.parse(data);
			var reply = JSON.stringify({action: 'message', user: msg.user, msg: msg.msg });
			socket.emit('chat', reply);
			socket.broadcast.emit('chat', reply);
		});
	
		socket.on('join', function(data) {
			console.log('log after join1', data)
			var msg = JSON.parse(data);
			var reply = JSON.stringify({action: 'control', user: msg.user, msg: ' joined the channel' });
			socket.emit('chat', reply);
			socket.broadcast.emit('chat', reply);
			
			var newMsg = new chat({users: {user: msg.user}});
			//newMsg.users.password = newMsg.generateHash(msg.password);
             newMsg.save(function(err){
                 if(err) throw err;
            	io.sockets.emit('new message', { users: {user:msg.user, password:msg.password}});
             }); 
		});
		socket.on('change_username', data => {
			let id = uuid.v4(); // create a random id for the user
			socket.id = id;
			socket.username = data.nickName;
			users.push({id, username: socket.username, color: socket.color});
			updateUsernames();
		})
	
		//update Usernames in the client
		const updateUsernames = () => {
			io.sockets.emit('get users',users)
		}
	})
			
	
	
