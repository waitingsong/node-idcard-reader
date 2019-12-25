import { join } from '@waiting/shared-core'

import { config } from './lib/config'

// base directory of this module
config.appDir = join(__dirname, '/..')

export * from './lib/index'
export * from './lib/model'
export {
  initialCompositeOpts, initialOpts, nationMap,
} from './lib/config'

