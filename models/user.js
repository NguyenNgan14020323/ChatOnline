var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Create a schema
var userSchema = new Schema({
	username : String,
	password : String,
	avatar : String,
	description : String,
	online : Number,
	created_at : Date,
	updated_at: Date
});

userSchema.pre('save',function(next){
	var currentDate = new Date().toISOString()
	this.updated_at = currentDate;
	if(!this.created_at){
		this.created_at = currentDate;
		next();
	}
});

module.exports = mongoose.model('User', userSchema);