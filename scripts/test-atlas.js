import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.argv[2] || process.env.MONGODB_URI;

if (!uri) {
  console.log(`
❌ No MongoDB connection string provided.

Usage:
  node scripts/test-atlas.js "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
  
Or set MONGODB_URI in your .env file and run:
  node scripts/test-atlas.js
`);
  process.exit(1);
}

console.log('🔄 Testing connection to MongoDB Atlas...');
console.log('URI:', uri.replace(/:([^@]+)@/, ':****@'));

async function testConnection() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas cluster!');

    const admin = client.db('admin');
    const ping = await admin.command({ ping: 1 });
    console.log('✅ Cluster ping response:', ping);

    const db = client.db('anchor_guardian');
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections in anchor_guardian database:', collections.map(c => c.name));

    console.log('\n🎉 Atlas connection test PASSED!');
    console.log('To use this with Anchor, add to your .env file:');
    console.log(`MONGODB_URI=${uri}`);
  } catch (err) {
    console.error('\n❌ Connection failed:', err.message);
    if (err.message.includes('bad auth')) {
      console.error('👉 Hint: Check your database username and password.');
    } else if (err.message.includes('queryTxt ETIMEOUT') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT')) {
      console.error('👉 Hint: Check your Atlas Network Access (IP Access List). Add 0.0.0.0/0 to allow access from your current IP.');
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

testConnection();
