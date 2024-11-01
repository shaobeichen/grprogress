const path = require('path')
const { spawnSync } = require('child_process')
const utils = require('../utils/index')

const { dirName, platform } = utils.getPackageInfoByCurrentPlatform()
const npmPath = path.join(__dirname, '../npm')
const childPackageDir = path.join(npmPath, dirName)
const binName = platform === 'win32' ? 'grprogress.exe' : 'grprogress'
const childPackageBinName = path.join(childPackageDir, binName)

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
