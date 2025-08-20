import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

export const bucketName = process.env.AWS_BUCKET_NAME;
const bucketRegion = process.env.AWS_REGION;
const accessKey = process.env.AWS_IAM_ACCESS_KEY_ID;
const secretKey = process.env.AWS_IAM_SECRET_ACCESS_KEY;

export const s3 = new S3Client({
	credentials: {
		accessKeyId: accessKey,
		secretAccessKey: secretKey,
	},
	region: bucketRegion,
});
