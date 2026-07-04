import { Kafka, logLevel, type SASLOptions } from 'kafkajs'

import { env } from './env'

const { KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_SSL_CA } = env

const sasl: SASLOptions | undefined =
  KAFKA_USERNAME && KAFKA_PASSWORD
    ? {
        mechanism: 'scram-sha-256',
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD,
      }
    : undefined

const ssl = KAFKA_SSL_CA ? { ca: [KAFKA_SSL_CA] } : false

export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS.split(',')
    .map((broker) => broker.trim())
    .filter(Boolean),
  logLevel: logLevel.ERROR,
  sasl,
  ssl,
})
