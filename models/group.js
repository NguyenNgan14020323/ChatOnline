var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//Create a schema
var groupSchema = new Schema({
	name : String, //Tên group
	description : String, //Mô tả
	url : String, //Ảnh của nhóm
	member : String,
	created_at : Date,
	updated_at: Date
});

groupSchema.pre('save',function(next){
	var currentDate = new Date().toISOString()
	this.updated_at = currentDate;
	if(!this.created_at){
		this.created_at = currentDate;
		next();
	}
});

module.exports = mongoose.model('Group', groupSchema);