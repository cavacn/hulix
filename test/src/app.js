import './lib/neat.css'
import './lib/pace.css'
import pace from './lib/pace.js'
import app from './module'

import './filter'
import './service'
import './directive'
import './controller'

pace.start({
    restartOnRequestAfter: 100,
    ajax: {
        trackMethods: ['GET', 'POST'],
        trackWebSockets: false
    },
    elements: false,
    document: true
})