var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var msgSchema = new Schema({
	usersend : {
		 type: mongoose.Schema.Types.ObjectId,
	     ref : 'User' //id của tác giả upload nên
	},
	usernhan:{
		type:mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	content : String,
	status : Number, //O là chưa đọc, 1 là đã đọc
	created_at: Date
}) 
msgSchema.pre('save',function(next){
	var currentDate = new Date().toISOString()
	this.created_at = currentDate;
	next()
});

module.exports = mongoose.model('Message', msgSchema);

