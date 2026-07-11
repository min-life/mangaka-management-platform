const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function testS3() {
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'materials/test/test.txt',
      Body: 'hello world',
      ContentType: 'text/plain',
    });
    await s3Client.send(command);
    console.log('S3 Upload Success!');
  } catch(e) {
    console.error('S3 Upload Error:', e.message);
  }
}
testS3();
