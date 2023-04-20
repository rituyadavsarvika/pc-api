// load model
const SubscriberHistory = require('../src/models/franchisee/history/subscriptionHistoryModel');

// service function to insert new document in history
const insertHistory = historyObject => {
    return new Promise((resolve, reject) => {
        SubscriberHistory.create(historyObject)
            .then(newHistory => resolve(newHistory))
            .catch(err =>
                reject({
                    message: `${err?.type} ${err}`
                })
            );
    });
};

// service function to set isCurrent flag as false
const updateIsCurrent = () => {
    return new Promise((resolve, reject) => {
        SubscriberHistory.updateMany({}, { $set: { isCurrentPlan: false } })
            .then(updatedHistoryList => resolve(updatedHistoryList))
            .catch(err =>
                reject({
                    message: `${err?.type} ${err?.raw.message}`
                })
            );
    });
};

module.exports = { insertHistory, updateIsCurrent };
