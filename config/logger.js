const { createLogger, transports, format } = require('winston');

const enumerateErrorFormat = format(info => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const customFormat = format.combine(
    format.timestamp(),
    format.printf(info => {
        return `{"time": "${info.timestamp}", "level":"${info.level}", "message": "${info.message}"}`;
    })
);

const logger = createLogger({
    format: customFormat,
    transports: [
        new transports.Console({
            stderrLevels: ['silly']
        }),
        new transports.File({
            filename: __dirname + '/../log/app.log',
            level: 'info'
        }),
        new transports.File({
            level: 'error',
            timestamp: new Date(),
            filename: __dirname + '/../log/error.log',
            json: true
        })
    ]
});

module.exports = logger;
