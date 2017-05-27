export function echo (...args) {
  console.log(...args) // eslint-disable-line no-console
}

export function createLogger (description, fullName) {
  function createLog (...args) {
    return function (...extraArgs) {
      echo(`${description} "${fullName}":`, ...args, ...extraArgs)
    }
  }

  const log = createLog()

  log.creating = createLog('Creating...')
  log.created = createLog('Created')
  log.alreadyCreated = createLog('Already exists')
  log.destroying = createLog('Destroying...')
  log.destroyed = createLog('Destroyed')
  log.alreadyDestroyed = createLog('Does not exist')

  return log
}
