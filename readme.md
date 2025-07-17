## Override existing backup files

# Prerequisities 

- DisableDatabaseEncryptionOnBackup must be enabled on account
- Grab tokens from https://apptio-sso.awsapps.com/start/#/?tab=accounts -> Access keys


Create config.env in root directory:
```
SOURCE_ACCESS_KEY_ID=
SOURCE_ACCESS_KEY=
SOURCE_ACCESS_SESSION_TOKEN=

TARGET_ACCESS_KEY_ID=
TARGET_ACCESS_KEY=
TARGET_ACCESS_SESSION_TOKEN=
```

# Steps

1. Create snapshot of source cluster.
1. Create dummy snapshot on the target cluster. 
1. Take snapshot id and name and put them in index.js.
1. Run the script.
1. Restore the target snapshot



# Handy commands
```
aws --endpoint-url http://localhost:8093 s3 ls s3://apptio-tp-snapshots-stg/tplocal.com/test_b612f2c2-ae78-4652-a2ab-57c72099269d/
aws --endpoint-url http://localhost:8093 s3 ls s3://apptio-tp-snapshots-stg --recursive --human-readable --summarize
```

Actions
-  `npm run start`
-  `npm run start:local` -> to localstack. For some reason migration fails during restore of a snapshot in local-setup, so for tp-db still recommended manual approach



