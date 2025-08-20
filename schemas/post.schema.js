import mongoose from 'mongoose';

const { Schema } = mongoose;

const postSchema = new Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: false,
		},
		image: {
			type: String,
			required: false,
		},
	},
	{
		timestamps: true,
	},
);

const PostModel = mongoose.model('Post', postSchema);

export default PostModel;
