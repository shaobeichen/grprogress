// https://www.npmjs.com/package/esbuild?activeTab=code

import fs from 'fs'
import os from 'os'
import path from 'path'
import zlib from 'zlib'
import child_process from 'child_process'
import https from 'https'
import { version as versionFromPackageJSON } from './package.json'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const packages = {
  'darwin arm64': '@grprogress/darwin-arm64',
  'darwin x64': '@grprogress/darwin-amd64',
  'linux x64': '@grprogress/linux-amd64',
  'win32 x64': '@grprogress/windows-amd64',
}

function getPackageInfoByCurrentPlatform() {
  const key = `${process.platform} ${os.arch()}`
  return {
    packageName: packages[key],
    platform: process.platform,
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location)
          return fetch(res.headers.location).then(resolve, reject)
        if (res.statusCode !== 200)
          return reject(new Error(`Server responded with ${res.statusCode}`))
        let chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => resolve(Buffer.concat(chunks)))
      })
      .on('error', reject)
  })
}

function extractFileFromTarGzip(buffer, subpath) {
  try {
    buffer = zlib.unzipSync(buffer)
  } catch (err) {
    throw new Error(`Invalid gzip data in archive: ${(err && err.message) || err}`)
  }
  let str = (i, n) => String.fromCharCode(...buffer.subarray(i, i + n)).replace(/\0.*$/, '')
  let offset = 0
  subpath = `package/${subpath}`
  while (offset < buffer.length) {
    let name = str(offset, 100)
    let size = parseInt(str(offset + 124, 12), 8)
    offset += 512
    if (!isNaN(size)) {
      if (name === subpath) return buffer.subarray(offset, offset + size)
      offset += (size + 511) & ~511
    }
  }
  throw new Error(`Could not find ${JSON.stringify(subpath)} in archive`)
}

async function downloadDirectlyFromNPM(pkg, subpath, binPath) {
  // https://registry.npmjs.com/@shaoo/cssoo/-/cssoo-2.2.0.tgz
  const url = `https://registry.npmjs.org/${pkg}/-/${pkg.replace(
    '@esbuild/',
    '',
  )}-${versionFromPackageJSON}.tgz`
  try {
    fs.writeFileSync(binPath, extractFileFromTarGzip(await fetch(url), subpath))
    fs.chmodSync(binPath, 0o755)
  } catch (e) {
    throw e
  }
}

function removeRecursive(dir) {
  child_process.execSync(`rm -rf ${dir}`, {
    cwd: installDir,
    stdio: 'inherit',
  })
}

function installUsingNPM(pkg, binFilename, binPath) {
  const tempDir = 'grprogress-npm-install'
  fs.mkdirSync(tempDir)
  const installDir = path.resolve(__dirname, tempDir)
  try {
    fs.writeFileSync(path.join(installDir, 'package.json'), '{}')
    child_process.execSync(`npm install ${pkg}@${versionFromPackageJSON} --save`, {
      cwd: installDir,
      stdio: 'inherit',
    })
    const installedBinPath = path.join(installDir, 'node_modules', pkg, binFilename)
    fs.renameSync(installedBinPath, binPath)
  } catch (e) {
    console.error('[grprogress] Failed to download and install from npm')
    removeRecursive(installDir)
    throw e
  }
}

async function main() {
  try {
    const { packageName, platform } = getPackageInfoByCurrentPlatform()
    const binFilename = 'grprogress'
    const binFileFullName = platform === 'win32' ? binFilename + '.exe' : binFilename
    const binPath = path.resolve(__dirname, binFileFullName)
    installUsingNPM(packageName, binFileFullName, binPath)
  } catch (e2) {
    // try {
    //   await downloadDirectlyFromNPM(pkg)
    // } catch (e3) {}
  }
}

main()
