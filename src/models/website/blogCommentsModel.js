const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blogCommentsSchema = Schema({
	postId: {
		type: Schema.Types.ObjectId,
		ref: 'Blog',
		required: [true, 'postId is mandatory']
	},
	postSlug: {
		type: String,
		required: [true, 'Post slug is required']
	},
	authorName: {
		type: String,
		default: 'Unknown'
	},
	authorEmail: String,
	commentAt: {
		type: Date,
		required: [true, 'Comment date is required']
	},
	message: {
		type: String,
		required: [true, 'Message is required']
	},
	reply: [Object]
});

const BlogComment = mongoose.model('BlogComment', blogCommentsSchema);
module.exports = BlogComment;
