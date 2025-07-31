require("dotenv").config({ path: "./config.env" });

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");

const sourceAccount = "romangunner.tpondemand.com";
const sourceRegion = "eu-west-1";
const sourceBucket = "apptio-tp-snapshots";
const sourceSnapshotId = "4e377b1d-e772-4b67-bf7e-549aaeeb275f";
const sourceSnapshotName = "Funding Request Test Nonenc";
const sourceAccessKeyId = process.env.SOURCE_ACCESS_KEY_ID;
const sourceAccessKey = process.env.SOURCE_ACCESS_KEY;
const sourceSessionToken = process.env.SOURCE_ACCESS_SESSION_TOKEN;

// TOXIC EXAMPLE
const targetAccount = 'toxic2.tpondemand.com';
const targetRegion = 'us-west-2';
const targetBucket = 'apptio-tp-snapshots-stg';
const targetSnapshotId = 'a8562357-a335-40ae-9c57-f32fbe06806a';
const targetSnapshotName = 'ttt';
const targetAccessKeyId = process.env.TARGET_ACCESS_KEY_ID;
const targetAccessKey = process.env.TARGET_ACCESS_KEY;
const targetSessionToken = process.env.TARGET_ACCESS_SESSION_TOKEN;

// LOCAL EXAMPLE 
// let targetAccount = "tplocal.com";
// const targetRegion = "us-east-1";
// const targetBucket = "apptio-tp-snapshots-stg";
// const targetSnapshotId = "23b14ee0-ac26-450f-8144-1ff62e01b4b9";
// const targetSnapshotName = "test";
// const targetAccessKeyId = "test";
// const targetAccessKey = "test";
// const targetSessionToken = "apptio-tp-snapshots-stg";

const targetAwsEndpoint = process.env.TARGET_AWS_ENDPOINT;
const targets3ForcePathStyle = Boolean(targetAwsEndpoint);

console.log("AWS Endpoint", targetAwsEndpoint);

const sourceS3 = new S3Client({
  region: sourceRegion,
  credentials: {
    accessKeyId: sourceAccessKeyId,
    secretAccessKey: sourceAccessKey,
    sessionToken: sourceSessionToken,
  },
});


console.log(targetAccessKey,targetAccessKeyId,targetSessionToken, targets3ForcePathStyle)

const targetS3 = new S3Client({
  region: targetRegion,
  credentials: {
    accessKeyId: targetAccessKeyId,
    secretAccessKey: targetAccessKey,
    sessionToken: targetSessionToken,
  },
  endpoint: targetAwsEndpoint,
  s3ForcePathStyle: targets3ForcePathStyle,
});

const getMetaPartLocation = (account, snapshotName, snapshotId, part) => {
  return `${account}/${snapshotName}_${snapshotId}/${part}`;
};

const getTpDbBackupLocation = async (s3, bucket, metaFileLocation) => {
  console.log("Reading meta file tp_db.bak from:", metaFileLocation, bucket);
  const res = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: metaFileLocation })
  );
  const metaContent = JSON.parse(await res.Body.transformToString());
  return metaContent.Key;
};

const moveTpDb = async () => {
  const sourceMetaFileLocation = getMetaPartLocation(
    sourceAccount,
    sourceSnapshotName.toLowerCase(),
    sourceSnapshotId,
    "tp_db.bak"
  );

  const sourceTpDbLocation = await getTpDbBackupLocation(
    sourceS3,
    sourceBucket,
    sourceMetaFileLocation
  );

  const targetMetaFileLocation = getMetaPartLocation(
    targets3ForcePathStyle ? `${targetBucket}/${targetAccount}` : targetAccount,
    targetSnapshotName,
    targetSnapshotId,
    "tp_db.bak"
  );

  let targetTpDbLocation = await getTpDbBackupLocation(
    targetS3,
    targetBucket,
    targetMetaFileLocation
  );
  if (targets3ForcePathStyle) {
    targetTpDbLocation = `${targetBucket}/${targetTpDbLocation}`;
  }

  console.log(`Downloading ${sourceTpDbLocation} ...`);
  const databaseFile = await sourceS3.send(
    new GetObjectCommand({ Bucket: sourceBucket, Key: sourceTpDbLocation })
  );

  const data = await databaseFile.Body.transformToByteArray(); // readable stream doesn't work, good enough for now

  console.log(`Uploading ${targetTpDbLocation}...`);
  await targetS3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: targetTpDbLocation,
      Body: data,
      Metadata: {
        disabledencryptionkey: "true",
      },
    })
  );

  console.log("Done tp_db");  
};

const movePart = async (partName) => {
  const sourceMetaFilePath = getMetaPartLocation(
    sourceAccount,
    sourceSnapshotName.toLowerCase(),
    sourceSnapshotId,
    partName
  );
  const targetMetaFilePath = getMetaPartLocation(
    targets3ForcePathStyle ? `${targetBucket}/${targetAccount}` : targetAccount,
    targetSnapshotName,
    targetSnapshotId,
    partName
  );

  console.log(
    `Uploading part file ${partName} from ${sourceMetaFilePath}, ${sourceBucket} to ${targetMetaFilePath}, ${targetBucket}`
  );

  const metaFile = await sourceS3.send(
    new GetObjectCommand({ Bucket: sourceBucket, Key: sourceMetaFilePath })
  );

  const data = await metaFile.Body.transformToByteArray();

  await targetS3.send(
    new PutObjectCommand({
      Bucket: targetBucket,
      Key: targetMetaFilePath,
      Body: data,
    })
  );

  console.log(`Done ${partName}`);
};

async function main() {
  console.log("Starting file transfer process...");

  await moveTpDb();
  await movePart("layout_management.bak");

  console.log("Completed");
}

main();
