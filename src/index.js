import os from 'os'
import path from 'path'
import { spawnSync } from 'child_process'

const packages = {
  'darwin arm64': '@grprogress/darwin-arm64',
  'darwin x64': '@grprogress/darwin-amd64',
  'linux x64': '@grprogress/linux-amd64',
  'win32 x64': '@grprogress/windows-amd64',
}

function getPackageNameByCurrentPlatform() {
  const key = `${process.platform} ${os.arch()}`
  return packages[key]
}

function downloadedBinPath(packageName) {
  const esbuildLibDir = path.dirname(require.resolve('esbuild'))
  return path.join(esbuildLibDir, `downloaded-${pkg.replace('/', '-')}-${path.basename(subpath)}`)
}

function generateBinPath() {
  const packageName = getPackageNameByCurrentPlatform()
  let binPath
  try {
    binPath = require.resolve(packageName)
  } catch (e) {
    binPath = downloadedBinPath(packageName)
    if (!fs.existsSync(binPath)) {
      throw e
    }
  }
  return binPath
}

export function update(current) {
  // 获取当前工作目录并构建完整路径
  const command = path.join(process.cwd(), generateBinPath())
  const args = [String(current)]
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
  })
  if (result.error) {
    console.error(`Error: ${result.error.message}`)
  }
}
