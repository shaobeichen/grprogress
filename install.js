const fs = require('fs')
const path = require('path')

/**
 * 通过可选依赖项安装依赖
 */
function firstInstall(pkg, subpath, binPath) {
  try {
    const installedBinPath = require.resolve(`${pkg}/${subpath}`)
    fs.renameSync(installedBinPath, binPath)
  } catch (e) {
    console.warn('Failed to download and install from optionalDependencies')
  }
}

async function main() {
  const { packageName, platform } = {
    packageName: '@grprogress/win32-x64',
    platform: 'win32',
  }

  const binFilename = 'grprogress'
  const subpath = platform === 'win32' ? binFilename + '.exe' : binFilename
  const binPath = path.resolve(__dirname, subpath)

  firstInstall(packageName, subpath, binPath)
}

main()
