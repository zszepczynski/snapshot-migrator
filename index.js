require("dotenv").config({ path: "./config.env" });

const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const sourceAccount = 'apptiospmdemo.tpondemand.com';
const sourceRegion = 'eu-west-1';
const sourceBucket = 'apptio-tp-snapshots';
const sourceSnapshotId = '6491e336-5ea7-447a-98e5-99dc6de8e617';
const sourceSnapshotName = 'arrow_fr_assignments';
const sourceAccessKeyId = process.env.SOURCE_ACCESS_KEY_ID;
const sourceAccessKey = process.env.SOURCE_ACCESS_KEY;
const sourceSessionToken = process.env.SOURCE_ACCESS_SESSION_TOKEN;

const targetAccount = 'toxic2.tpondemand.com';
const targetRegion = 'us-west-2';
const targetBucket = 'apptio-tp-snapshots-stg';
const targetSnapshotId = '88019cd6-1b0f-495d-8464-dc88864e45cf';
const targetSnapshotName = 'test';
const targetAccessKeyId = process.env.TARGET_ACCESS_KEY_ID;
const targetAccessKey = process.env.TARGET_ACCESS_KEY;
const targetSessionToken = process.env.TARGET_ACCESS_SESSION_TOKEN;

const sourceS3 = new S3Client({
  region: sourceRegion,
  credentials: {
    accessKeyId: sourceAccessKeyId,
    secretAccessKey: sourceAccessKey,
    sessionToken: sourceSessionToken
  },
});

const targetS3 = new S3Client({
  region: targetRegion,
  credentials: {
    accessKeyId: targetAccessKeyId,
    secretAccessKey: targetAccessKey,
    sessionToken: targetSessionToken
  },
});

const getMetaPartLocation = (account, snapshotName, snapshotId, part) =>{
      return `${account}/${snapshotName}_${snapshotId}/${part}`;
}

const getTpDbBackupLocation = async (s3, bucket, account, snapshotName, snapshotId)=>{
    const fileLocation = getMetaPartLocation(account,snapshotName,snapshotId, 'tp_db.bak');
    console.log("Reading meta file tp_db.bak from: ", fileLocation);
    const res = await s3.send(new GetObjectCommand({Bucket: bucket, Key: fileLocation}));
    const metaContent = JSON.parse(await res.Body.transformToString());
    return metaContent.Key;
}


const moveTpDb = async ()=>{
   const sourceTpDbLocation = await getTpDbBackupLocation(
     sourceS3,
     sourceBucket,
     sourceAccount,
     sourceSnapshotName,
     sourceSnapshotId
   );

  const targetTpDbLocation = await getTpDbBackupLocation(targetS3, targetBucket, targetAccount, targetSnapshotName, targetSnapshotId);

   console.log(`Uploading db file from ${sourceTpDbLocation}, ${sourceBucket} to ${targetTpDbLocation}, ${targetBucket}`);

  const databaseFile = await sourceS3.send(new GetObjectCommand({Bucket: sourceBucket, Key: sourceTpDbLocation}));

  const data = await databaseFile.Body.transformToByteArray() // readable stream doesn't work, good enough for now

  await targetS3.send(new PutObjectCommand({
    Bucket: targetBucket,
    Key: targetTpDbLocation,
    Body: data
  }));

  console.log("Done tp_db");
}

const movePart = async (partName)=>{
  const sourceMetaFilePath = getMetaPartLocation(sourceAccount,sourceSnapshotName, sourceSnapshotId, partName);
  const targetMetaFilePath = getMetaPartLocation(targetAccount,targetSnapshotName, targetSnapshotId, partName);

  console.log(`Uploading part file ${partName} from ${sourceMetaFilePath}, ${sourceBucket} to ${targetMetaFilePath}, ${targetBucket}`);

  const metaFile = await sourceS3.send(new GetObjectCommand({Bucket: sourceBucket, Key: sourceMetaFilePath}));

  const data = await metaFile.Body.transformToByteArray()

  await targetS3.send(new PutObjectCommand({
    Bucket: targetBucket,
    Key: targetMetaFilePath,
    Body: data
  }));

  console.log(`Done ${partName}`);
}

async function main(){
  console.log("Starting file transfer process...");

  await moveTpDb();
  await movePart('layout_management.bak');

  console.log("Completed");
}


 main();