import { MongoClient } from 'mongodb';

export async function connect(mongoUri, dbName) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  return { client, db: client.db(dbName) };
}
