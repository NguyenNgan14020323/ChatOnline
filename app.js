 var express = require('express');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var cookieParser = require('cookie-parser');
mongoose.Promise = require('bluebird');//dong bo trong moogoose
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var ObjectID = require('mongodb').ObjectID;
 var User = require('./models/user');
  var Message = require('./models/message')
var config = require('./models/database');
var morgan = require('morgan')
config.setConfig();
mongoose.connect(process.env.MONGOOSE_CONNECT);

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge:180*60*1000}
}))

app.use(cookieParser());
app.use(function(req,res,next){
	res.locals.session = req.session;
	next();
});
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.static(__dirname + '/public'));


var index = require('./controllers/index');
app.use('/',index);

// Room chat
var users = {};
var useronl = [];

io.on('connection',function(socket){
  socket.on('useronline', function(data){
    var should_add = true;
    if(useronl.length != 0){
       for(var i = 0; i < useronl.length; i++){
      if(useronl[i].userId == data.userIdOnline){
        should_add = false;
      }
    }
    }
    if(should_add){
      users.socketId = socket.id;
      users.userId = data.userIdOnline;
      User.updateOne({'_id' : ObjectID(data.userIdOnline)},{'online':1}, function(err,result){
        if(err) console.log(err)
      })
      useronl.push(users);
    }
     socket.mid = data.userIdOnline;
    socket.broadcast.emit('userconnected',{ usersIdOnl : data.userIdOnline});
  })  

    socket.on('addUser', function(data){
    var room = data.mid > data.uid ? (data.mid + data.uid) : (data.uid + data.mid);
    socket.room = room;
    socket.join(socket.room)
  })

    socket.on('addGroup', function(data){
      socket.room = data.groupId;
      socket.join(socket.room);
      
    })

  socket.on('client_send_message', function(data){
      io.sockets.in(socket.room).emit('server_gui_message', {avatar:data.avatar,msg:data.msg, uidsend:data.uidsend, uidnhan:data.uidnhan});
      var newMsg = new Message({
        usersend : data.uidsend,
        usernhan : data.uidnhan,
        content : data.msg,
        status: 0
      })
      newMsg.save(function(err){
        if(err) throw err;
      })
        socket.broadcast.emit('new_msg', {uidsend: data.uidsend, uidnhan: data.uidnhan});
  })

  socket.on('disconnect',function(){ 
     User.updateOne({'_id' : ObjectID(socket.mid)},{'online':0}, function(err,result){
        if(err) console.log(err)
      })
    io.emit('userdisconnected', {userIdOff:socket.mid});
    socket.leave(socket.room);
  })
})
var port = process.env.PORT || 3000;
server.listen(port, function () {
    console.log("server is runing on localhost:3000");
});
