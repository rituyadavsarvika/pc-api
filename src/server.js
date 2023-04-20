require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/keys');
const logger = require('./../config/logger');

const app = require('./app');
const db = config.DATABASE_URL;

// Connecting to mongodb
mongoose
    .connect(
        db,
        {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true
        },
        console.log('Database connecting......')
    )
    .then(() => console.log(`***** DB successfully connected! *****`))
    .catch(err => {
        logger.error(err);
        console.log('Something went very wrong with DB Connection');
    });

// creating server
const port = config.PORT;
const host = config.HOST;
app.listen(port, () => {
    console.log(
        `***** App is running on port ${host}:${port} with NODE_ENV='${process.env.NODE_ENV}' *****`
    );
});
