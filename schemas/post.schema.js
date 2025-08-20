import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mongoose from 'mongoose';
import { GetObjectCommand } from '@aws-sdk/client-s3';

import { bucketName, s3 } from '../lib/s3/s3.js';

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

postSchema.virtual('imageUrl', async function () {
	if(!this.image) return null

	return await getSignedUrl(
		s3,
		new GetObjectCommand({
			Bucket: bucketName,
			Key: this.image
		}),
		{ expiresIn: 60 * 60 * 24 }
	)
})

PostSchema.set('toObject', { virtuals: true });
PostSchema.set('toJSON', { virtuals: true });

const PostModel = mongoose.model('Post', postSchema);

export default PostModel;
