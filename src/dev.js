import { update } from './index.js'

update(0.5)

setTimeout(() => {
  update(1)
}, 2000)
