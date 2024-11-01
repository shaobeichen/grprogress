const path = require('path')
const { spawnSync } = require('child_process')
const utils = require('../utils/index')

const { platform } = utils.getPackageInfoByCurrentPlatform()
const npmPath = path.join(__dirname, '../')
const binName = platform === 'win32' ? 'grprogress.exe' : 'grprogress'
const childPackageBinName = path.join(npmPath, binName)

function update(current) {
  const command = childPackageBinName
  const args = [String(current)]

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error(`Error: ${result.error.message}`)
  }
}

module.exports = {
  update,
}
