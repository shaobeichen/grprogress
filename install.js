const fs = require('fs')
const path = require('path')
const child_process = require('child_process')
const data = require('./package.json')
const utils = require('./utils')

const versionFromPackageJSON = data.version

/**
 * 日志格式化
 */
function log(msg) {
  const text = `[grprogress] ${msg}`
  const line = '='.repeat(text.length)
  console.log(`
  ${line}
  ${text}
  ${line}`)
}

/**
 * 递归删除目录
 * @param {string} dir 指定要删除的目录
 */
function removeRecursive(dir) {
  child_process.execSync(`rm -rf ${dir}`, {
    cwd: path.resolve(__dirname),
    stdio: 'inherit',
  })
}

/**
 * 通过npm安装指定包
 * @param {string} pkg 包名
 * @param {string} subpath 子路径，一般是包里的指定文件路径
 * @param {string} binPath 指定文件迁移到的目标路径
 */
function installUsingNPM(pkg, subpath, binPath) {
  const tempDir = 'grprogress-npm-install'
  fs.mkdirSync(tempDir)
  const installDir = path.resolve(__dirname, tempDir)

  try {
    fs.writeFileSync(path.join(installDir, 'package.json'), '{}')

    console.time('文件下载时间')
    child_process.execSync(`npm install ${pkg}@${versionFromPackageJSON} --save`, {
      cwd: installDir,
      stdio: 'inherit',
    })
    console.timeEnd('文件下载时间')

    console.time('文件移动时间')
    const installedBinPath = path.join(installDir, 'node_modules', pkg, subpath)
    fs.renameSync(installedBinPath, binPath)
    console.timeEnd('文件移动时间')
  } catch (e) {
    throw e
  }

  removeRecursive(installDir)
}

/**
 * 通过https下载tgz安装依赖
 */
function thirdInstall(pkg, subpath, binPath) {
  // https://registry.npmjs.com/@grprogress/windows-amd64/-/windows-amd64-1.0.0.tgz
  // 下载压缩包 -> 解压压缩包 -> 删除压缩包 -> 移动指定的文件 -> 删除文件夹
}

/**
 * 通过npm安装依赖
 */
function secondInstall(pkg, subpath, binPath, fail) {
  try {
    installUsingNPM(pkg, subpath, binPath)
  } catch (e) {
    log('Failed to download and install from npm')
    fail && fail()
  }
}

/**
 * 通过可选依赖项安装依赖
 */
function firstInstall(pkg, subpath, binPath, fail) {
  try {
    const installedBinPath = require.resolve(`${pkg}/${subpath}`)
    fs.renameSync(installedBinPath, binPath)
  } catch (e) {
    log('Failed to download and install from optionalDependencies')
    fail && fail()
  }
}

async function main() {
  const { packageName, platform } = utils.getPackageInfoByCurrentPlatform()

  const binFilename = 'grprogress'
  const subpath = platform === 'win32' ? binFilename + '.exe' : binFilename
  const binPath = path.resolve(__dirname, subpath)

  firstInstall(packageName, subpath, binPath, () => {
    secondInstall(packageName, subpath, binPath, () => {
      thirdInstall(packageName, subpath, binPath)
    })
  })
}

main()
