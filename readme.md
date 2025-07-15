## Override existing backup files

# Prerequisities 

- DisableDatabaseEncryptionOnBackup must be enabled on account
- Grab tokens from https://apptio-sso.awsapps.com/start/#/?tab=accounts -> Access keys
- 

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


# Notes

Due to permissions we can't copy from prod to staging, so we download/upload instead
