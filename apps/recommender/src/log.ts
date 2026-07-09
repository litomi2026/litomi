type LogFields = Record<string, unknown>

export const log = {
  error(message: string, fields?: LogFields) {
    emit(console.error, 'ERROR', message, fields)
  },
  info(message: string, fields?: LogFields) {
    emit(console.info, 'INFO', message, fields)
  },
  warn(message: string, fields?: LogFields) {
    emit(console.warn, 'WARNING', message, fields)
  },
}

function emit(sink: (line: string) => void, severity: string, message: string, fields?: LogFields) {
  sink(JSON.stringify({ severity, message, timestamp: new Date().toISOString(), ...fields }))
}
