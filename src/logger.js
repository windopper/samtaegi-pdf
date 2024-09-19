import winston from 'winston';
import 'winston-mongodb';
import { mongoClient } from './index.js';

const { combine, timestamp, label, printf, metadata } = winston.format;

const insertMetaForWinstonMongo = winston.format(logEntry => {
    logEntry.meta = logEntry.metadata;
    return logEntry;
});

const logger = winston.createLogger({
    format: combine(
        label({ label: 'samtaegi' }),
        timestamp(),
        metadata({ fillExcept: ['label', 'timestamp', 'level', 'message'] }),
        insertMetaForWinstonMongo(),
        printf(info => {
            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}, ${JSON.stringify(info.meta)}`;
        }),
    ),
});

export async function initLogger() {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
    
    logger.add(new winston.transports.MongoDB({
        dbName: 'samtaegi',
        collection: 'log',
        db: await Promise.resolve(mongoClient),
        metaKey: "metadata"
    }));
}

export default logger;