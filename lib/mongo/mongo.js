import { connect, MongooseError, set } from 'mongoose';

import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MONGO_URI = process.env.MONGO_URI;

const connectMongo = async () => {
	try {
		set('strictQuery', false);
		set('bufferTimeoutMS', 60000);

		await connect(MONGO_URI);

		console.info('Database connected');
	} catch (error) {
		throw new MongooseError(error);
	}
};

export default connectMongo
