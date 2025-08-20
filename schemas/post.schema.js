import mongoose from 'mongoose';

const { Schema } = mongoose;

const PostSchema = new Schema(
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

const PostModel = mongoose.model('Post', PostSchema);

export default PostModel;
