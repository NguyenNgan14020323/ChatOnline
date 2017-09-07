var express = require('express');
var router = express.Router();
var User = require('../models/user');
var session = require('express-session');
var request = require('request');
var multer= require('multer');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var Message = require('../models/message')
var Group = require('../models/group')
var User_Group = require('../models/user_group');

var storage = multer.diskStorage({
	  destination: function (req, file, cb) {
	    cb(null, './public/image')
	  },
	  filename: function (req, file, cb) {
	    cb(null, file.originalname);
	  }
	})
var upload = multer({ storage: storage });


router.route('/')
.get(function(req,res){
	if(typeof req.cookies.CookieEmail !== 'underfined'){

		var cookieU = req.cookies.CookieUsername;
		var cookieP = req.cookies.CookiePassword;
	    res.render('login', {username : cookieU, pass: cookieP});
		
	}else{
	    res.render('login');
    }
	
	
})

router.route('/getMsg')
.get(function(req,res){
	Message.find(
	    { $or:[{
	       $and:[
	          {'usersend': req.query.mid}, {'usernhan': req.query.uid}]}, {

	       $and:[
	          {'usernhan': req.query.mid}, {'usersend': req.query.uid}]
	    }]})
	.sort({'created_at':-1})
	.limit(30)
	.exec(function(err,data){
		if(err){
			res.json({'message':err})
		}else{
			res.send(JSON.stringify(data));
				
		}
})
})

var total = 0;
router.route('/getMsgId')
.get(function(req,res){
	var number = req.query.num

	Message.find(
		{ $or:[{
	       $and:[
	          {'usersend': req.query.mid}, {'usernhan': req.query.uid}]}, {

	       $and:[
	          {'usernhan': req.query.mid}, {'usersend': req.query.uid}]
	    }]}
	)
	.count(function(err,data){
		total = data
	})
	var num_skip = 0;
	var num_limit =0;

   if(total > req.query.num - 30)
    {
        var num_skip = total - req.query.num;
        var num_limit = 30;
        
        if(num_skip < 0){
          num_limit = 30 + num_skip;
          num_skip = 0;
        }

        Message.find(
	    { $or:[{
	       $and:[
	          {'usersend': req.query.mid}, {'usernhan': req.query.uid}]}, {

	       $and:[
	          {'usernhan': req.query.mid}, {'usersend': req.query.uid}]
	    }]})
		.skip(num_skip)
		.limit(num_limit)
		.sort({'created_at':1})
		.exec(function(err,data){
			if(err){
				res.json({'message':err})
			}else{
				res.send(JSON.stringify(data));
					
			}
		})
    }else{
    	res.send();
    }

})

router.route('/getMsgGroup')
.get(function(req,res){
	var messagess = [];
	Message.find({'usernhan':req.query.groupId})
	.sort({'created_at':1})
	
	.then(function(messages){
		var Infouser = []; 
		messagess = messages;
		var userIds = messages.map(function(element){
			return element.usersend
		})
		if(userIds.length != 0){
			for(var i = 0; i < userIds.length; i++){
			 Infouser.push(								 
			 	User.find({'_id' : userIds[i]})
			 	.exec()
			 )
		}
		}
		return Promise.all(Infouser)
	})
	.then(function(Return){

		var total = [];

		for(var i = 0; i < messagess.length; i++){		
			total[i] = {
				content : messagess[i].content,
				avatar :Return[i][0].avatar,
				usersend :Return[i][0]._id
			}
			console.log(total[i])
		}

		res.send(JSON.stringify(total));
	})
})

router.post('/signup',upload.single('file'),function(req,res){
	 req.session.chklog = 0;
	var newUser = new User({
		username : req.body.username,
		password : req.body.password,
		avatar: "/image/"+ req.file.originalname,
		description : '',
		online : 1
	});
	newUser.save(function(error){
		if (error) {
			console.log(error);
		}else{	
				res.cookie('CookieUsername', req.body.username, {maxAge:3600*24*1000, httpOnly: true})
				res.cookie('CookiePassword', req.body.password, {maxAge:3600*24*1000, httpOnly: true})
			res.redirect('/');
		}
	})
});

router.post('/creategroup', upload.single('file'), function(req,res){
	var newGroup = new Group({
		name: req.body.name_group,
		description : req.body.description_group,
		url : "/image/"+ req.file.originalname,
		member: req.session._id + '/'
	})
	newGroup.save(function(err){
		if(err) throw err;
		else{
			Group.find({'name':req.body.name_group})
			.exec(function(err, value){
				if(err){ throw err;
				}else
					if(value != null){
						var newUserGroup = new User_Group({
							userId : req.session._id,
							groupId: value[0]._id
						})
						newUserGroup.save(function(err){
							if(err){
								console.log(err)
							}
						})
					}
			})
			res.redirect('/home')
		}
	})
	
})

router.route('/addMember')
.put(function(req,res){
	var members = req.body.member;
	var temp = members.split('/');
	if(temp.length != 0){
		for(var i = 0; i < temp.length; i++){
			var newUserGroup = new User_Group({
				userId : temp[i],
				groupId: req.body.groupId
			})
			newUserGroup.save(function(err){
				if(err){
					console.log(err)
				}
			})
		}
		res.send()		
	}else{
		res.send({'message' : 'error'})
	}
	 
})

router.post('/login',function(req,res){
	req.session.chklog = 0;
	User.findOne({'username':req.body.username,'password':req.body.password})
	.exec(function(err, value){
		if (err) {
			alert('Loi dang nhap');
		}else{
			if(value != null){
				res.cookie('CookieUsername', req.body.username, {maxAge:3600*24*1000, httpOnly: true})
				res.cookie('CookiePassword', req.body.password, {maxAge:3600*24*1000, httpOnly: true})
				req.session.chklog = 1;
				req.session.username = req.body.username;
				req.session.avatar = value.avatar;		
				req.session._id = value._id;	
				res.redirect('/home');
			}else{
				res.redirect('/');
			}
		}
	})
})

router.route('/home')
.get(function(req,res){
	if(typeof req.session.chklog === 'underfined'){
		res.redirect('/')
	}else{
		if(req.session.chklog == 1){
			User.find()
				.exec(function(error,user){
					if(error){
						res.json({message:'error'});
					}else{
							var end = JSON.stringify(user);		
							var groupUsers=[];					
							User_Group.find({'userId' : ObjectID(req.session._id)},
								{'groupId': 1})
							.then(function(group_user){	
								// if(group_user.length != 0){
								// 	group_user.forEach(function(group){
								// 		if(group.groupId !== 'undefined'){
								// 			groupUsers.push(
								// 				Group.find({'_id': ObjectID(group.groupId)})
								// 				.limit(1)
								// 				.exec()
								// 			)	
								// 		}								
								// 	})
								// }	
								var groupIds = group_user.map(function(element){
									return element.groupId
								})
								if(groupIds.length != 0){
									groupUsers.push(								 
										Group.find({'_id' : {$in : groupIds}})
										.exec()
									)
								}
								return Promise.all(groupUsers);									
							})
							.then(function(Return){

									// for(var i = 0; i < Return.length; i++){
									// 	var x = Return[i]
									// 	temp[i]= x[0]
									// }
									// var x = JSON.stringify(temp)
									var x = JSON.stringify(Return[0])
									res.render('home', {users : JSON.parse(end), groups: JSON.parse(x)});
								// }else{
								// 	res.render('home', {users:JSON.parse(end), groups:'undefined'})
								// }						
							})
							.catch(function(err){
								throw err;
						 	})
					}
				})
			}else{
				res.redirect('/')
			}
	}
});

router.post('/info',function(req,res){
	var des = req.body.des;
	var id = req.body.userid;
	User.updateOne({"_id":ObjectID(id)},{$set:{'description':'req.body.des'}},function(error,result){
		if(error){
			console.log(error);
		}else{
			req.session.description = des;
			res.redirect('/home');
		}
	});
	
})

router.route('/logout')
.get(function(req,res){
	User.updateOne({'_id':ObjectID(req.session._id)},{$set:{'online':0}},function(error,result){
		if(error){
			console.log(error);
		}
	});
	req.session.destroy(function(err) {
		if(err) {
	    	console.log(err);
	  	} else {
			res.redirect('/');
	  	}

	});
})
module.exports = router;