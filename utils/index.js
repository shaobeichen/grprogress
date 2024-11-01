const os = require('os')

/**
 * 根据当前系统信息获取对应的包信息
 */
function getPackageInfoByCurrentPlatform() {
  const packages = {
    'darwin arm64': '@grprogress/darwin-arm64',
    'darwin x64': '@grprogress/darwin-amd64',
    'linux x64': '@grprogress/linux-amd64',
    'win32 x64': '@grprogress/windows-amd64',
  }
  const key = `${os.platform()} ${os.arch()}`
  const dirName = packages[key].replace('@grprogress/', '')
  return {
    packageName: packages[key],
    platform: os.platform(),
    arch: os.arch(),
    dirName: dirName,
  }
}

module.exports = {
  getPackageInfoByCurrentPlatform,
}
