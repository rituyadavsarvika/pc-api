// const fs = require('fs');
const _ = require('lodash');
const exec = require('child_process').exec;
const CONFIG = require('./../config/keys');

// Concatenate root directory path with our backup folder.
const backupDirPath = '~/dump/cloudDBBackup/DBdump';

const dbOptions = {
    // user: '<databaseUsername>',
    // pass: '<databasePassword>',
    host: 'localhost',
    port: 27017,
    database: 'prolificcloudDB',
    autoBackup: true,
    removeOldBackup: true,
    keepLastDaysBackup: 7,
    autoBackupPath: backupDirPath
};

// return stringDate as a date object.
exports.stringToDate = dateString => {
    return new Date(dateString);
};

// Check if variable is empty or not.
exports.empty = mixedVar => {
    let undef, key, i, len;
    const emptyValues = [undef, null, false, 0, '', '0'];
    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixedVar === emptyValues[i]) {
            return true;
        }
    }
    if (typeof mixedVar === 'object') {
        for (key in mixedVar) {
            return false;
        }
        return true;
    }
    return false;
};

// Auto backup function
exports.dbAutoBackUp = () => {
    // check for auto backup is enabled or disabled
    if (dbOptions.autoBackup == true) {
        let date = new Date();
        let beforeDate, oldBackupDir, oldBackupPath;

        // Current date
        currentDate = this.stringToDate(date);
        let newBackupDir = `${currentDate.getFullYear()}-${
            currentDate.getMonth() + 1
        }-${currentDate.getDate()}-${currentDate.getHours()}`;

        // New backup path for current backup process
        let newBackupPath = `${dbOptions.autoBackupPath}-${newBackupDir}`;
        // check for remove old backup after keeping # of days given in configuration
        if (dbOptions.removeOldBackup == true) {
            beforeDate = _.clone(currentDate);
            // Subtract number of days to keep backup and remove old backup
            beforeDate.setDate(
                beforeDate.getDate() - dbOptions.keepLastDaysBackup
            );

            oldBackupDir = `${beforeDate.getFullYear()}-${
                beforeDate.getMonth() + 1
            }-${beforeDate.getDate()}-${beforeDate.getHours()}`;

            // old backup(after keeping # of days)
            oldBackupPath = `${dbOptions.autoBackupPath}-${oldBackupDir}`;
        }

        let cmd = `mongodump -u ${CONFIG.DB_USER} -p '${CONFIG.DB_PASSWORD}' --authenticationDatabase ${dbOptions.database}  -d ${dbOptions.database} --out ${newBackupPath}`;

        exec(cmd, (error, stdout, stderr) => {
            if (this.empty(error)) {
                // check for remove old backup after keeping # of days given in configuration.
                if (dbOptions.removeOldBackup == true) {
                    // if (fs.existsSync(oldBackupPath)) {
                    exec('rm -rf ' + oldBackupPath, err => {});
                    // }
                }
            }
        });
    }
};
