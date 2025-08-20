// import { GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
// import { bucketName, s3 } from '../s3/s3.js';

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const cloudFrontUrl = process.env.CLOUDFRONT_URL;

/**
 * Attach signed S3 URLs to Mongoose documents
 * Works for single document or an array of documents
 * @param {Object|Object[]} docs - Mongoose document(s)
 */
export async function attachSignedUrls(docs) {
	if (!docs) return null;

	// If it's an array → map over it
	if (Array.isArray(docs)) {
		return Promise.all(docs.map((doc) => addSignedUrlToDoc(doc)));
	}

	// If it's a single doc → just return one
	return await addSignedUrlToDoc(docs);
}

/**
 * Helper to attach signed URL to a single doc
 */
async function addSignedUrlToDoc(doc) {
	const plain = doc.toObject();
	if (!plain.image) return plain;

	// plain.imageUrl = await getSignedUrl(
	// 	s3,
	// 	new GetObjectCommand({
	// 		Bucket: bucketName,
	// 		Key: plain.image,
	// 	}),
	// 	{ expiresIn: 60 * 60 * 24 } // 24h
	// );

    plain.image = `${cloudFrontUrl}/${plain.image}`

	return plain;
}
