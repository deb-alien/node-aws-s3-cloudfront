import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import sharp from 'sharp';
import { s3 } from './lib/s3/s3.js';
import { attachSignedUrls } from './lib/utils/helper.js';
import PostModel from './schemas/post.schema.js';

dotenv.config({ quiet: true });

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const app = express();

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Database connected'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

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
			image: process.env.imageName, // save only key
		});

		res.status(201).json(post);
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Upload failed' });
	}
});

app.delete('/post/:postId', async (req, res) => {
	try {
		const posts = await PostModel.findById(req.params.postId);
		if (!posts) return res.status(404).json({ message: 'Post not found' });

		await s3.send(
			new DeleteObjectCommand({
				Bucket: bucketName,
				Key: posts.image,
			}),
		);

		// await PostModel.findByIdAndDelete(req.params.postId)
		await posts.deleteOne();

		return res.status(200).json({ message: 'Post deleted' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: 'Something went wrong' });
	}
});

app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});

/**
 * Create a S3 Bucket
 * Create a IAM policy for the bucket and also add arn
 * Create a IAM user with programmatic access
 * Attach the bucket policy to the user
 * Create a IAM access key
 */
