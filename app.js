import { CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import express from 'express';
import sharp from 'sharp';
import connectMongo from './lib/mongo/mongo.js';
import { bucketName, cloudFrontClient, cloudFrontDistId, s3 } from './lib/s3/s3.js';
import { attachSignedUrls, randomImageName } from './lib/utils/helper.js';
import { upload } from './lib/utils/multer.js';
import PostModel from './schemas/post.schema.js';

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Get posts with signed URL
app.get('/posts', async (req, res) => {
	try {
		const posts = await PostModel.find();
		const signedPosts = await attachSignedUrls(posts);
		return res.status(200).json(signedPosts);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Something went wrong' });
	}
});

// Upload new post
app.post('/post/new', upload.single('image'), async (req, res) => {
	try {
		const imageName = randomImageName();

		await s3.send(
			new PutObjectCommand({
				Bucket: bucketName,
				Key: imageName,
				Body: await sharp(req.file.buffer)
					.resize({ height: 1920, width: 1080, fit: 'cover' }) // cover looks better
					.toBuffer(),
				ContentType: req.file.mimetype,
			}),
		);

		const post = await PostModel.create({
			...req.body,
			image: imageName, // save only key
		});

		res.status(201).json(post);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Upload failed' });
	}
});

app.delete('/post/:postId', async (req, res) => {
	try {
		const post = await PostModel.findById(req.params.postId);
		if (!post) return res.status(404).json({ message: 'Post not found' });

		await s3.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: post.image,
			}),
		);

		await cloudFrontClient.send(
			new CreateInvalidationCommand({
				DistributionId: cloudFrontDistId,
				InvalidationBatch: {
					CallerReference: Date.now().toString(),
					Paths: {
						Quantity: 1,
						Items: [`/${post.image}`],
					},
				},
			}),
		);

		await post.deleteOne();

		return res.status(200).json({ message: 'Post deleted' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Something went wrong' });
	}
});

app.listen(process.env.PORT, async () => {
	await connectMongo();
	console.log(`Server is running on port ${process.env.PORT}`);
});

/**
 * Create a S3 Bucket
 * Create a IAM policy for the bucket and also add arn
 * Create a IAM user with programmatic access
 * Attach the bucket policy to the user
 * Create a IAM access key
 * create a cloudfront distribution
 * create a cloudfront origin access identity
 * add the origin access identity to the distribution
 * add the bucket to the distribution
 * create a signed url
 */
