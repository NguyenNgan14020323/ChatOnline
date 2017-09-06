var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var user_groupSchema = new Schema({
	groupId : {
		 type: mongoose.Schema.Types.ObjectId,
	     ref : 'Group' //id của tác giả upload nên
	},
	userId:{
		type:mongoose.Schema.Types.ObjectId,
		ref: 'User'
	},
	created_at: Date
}) 
user_groupSchema.pre('save',function(next){
	var currentDate = new Date().toISOString()
	this.created_at = currentDate;
	next()
});

module.exports = mongoose.model('User_Group', user_groupSchema);

