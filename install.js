// https://www.npmjs.com/package/esbuild?activeTab=code

import https from 'https'

function installUsingNPM(pkg, subpath, binPath) {
  const env = { ...process.env, npm_config_global: void 0 }
  const esbuildLibDir = path2.dirname(require.resolve('esbuild'))
  const installDir = path2.join(esbuildLibDir, 'npm-install')
  fs2.mkdirSync(installDir)
  try {
    fs2.writeFileSync(path2.join(installDir, 'package.json'), '{}')
    child_process.execSync(
      `npm install --loglevel=error --prefer-offline --no-audit --progress=false ${pkg}@${versionFromPackageJSON}`,
      { cwd: installDir, stdio: 'pipe', env },
    )
    const installedBinPath = path2.join(installDir, 'node_modules', pkg, subpath)
    fs2.renameSync(installedBinPath, binPath)
  } finally {
    try {
      removeRecursive(installDir)
    } catch {}
  }
}

function removeRecursive(dir) {
  for (const entry of fs2.readdirSync(dir)) {
    const entryPath = path2.join(dir, entry)
    let stats
    try {
      stats = fs2.lstatSync(entryPath)
    } catch {
      continue
    }
    if (stats.isDirectory()) removeRecursive(entryPath)
    else fs2.unlinkSync(entryPath)
  }
  fs2.rmdirSync(dir)
}

async function downloadDirectlyFromNPM(pkg, subpath, binPath) {
  const url = `https://registry.npmjs.org/${pkg}/-/${pkg.replace(
    '@esbuild/',
    '',
  )}-${versionFromPackageJSON}.tgz`
  console.error(`[esbuild] Trying to download ${JSON.stringify(url)}`)
  try {
    fs2.writeFileSync(binPath, extractFileFromTarGzip(await fetch(url), subpath))
    fs2.chmodSync(binPath, 493)
  } catch (e) {
    console.error(`[esbuild] Failed to download ${JSON.stringify(url)}: ${(e && e.message) || e}`)
    throw e
  }
}

async function checkAndPreparePackage() {
  if (isValidBinaryPath(ESBUILD_BINARY_PATH)) {
    if (!fs2.existsSync(ESBUILD_BINARY_PATH)) {
      console.warn(
        `[esbuild] Ignoring bad configuration: ESBUILD_BINARY_PATH=${ESBUILD_BINARY_PATH}`,
      )
    } else {
      applyManualBinaryPathOverride(ESBUILD_BINARY_PATH)
      return
    }
  }
  const { pkg, subpath } = pkgAndSubpathForCurrentPlatform()
  let binPath
  try {
    binPath = require.resolve(`${pkg}/${subpath}`)
  } catch (e) {
    console.error(`[esbuild] Failed to find package "${pkg}" on the file system
  
  This can happen if you use the "--no-optional" flag. The "optionalDependencies"
  package.json feature is used by esbuild to install the correct binary executable
  for your current platform. This install script will now attempt to work around
  this. If that fails, you need to remove the "--no-optional" flag to use esbuild.
  `)
    binPath = downloadedBinPath(pkg, subpath)
    try {
      console.error(`[esbuild] Trying to install package "${pkg}" using npm`)
      installUsingNPM(pkg, subpath, binPath)
    } catch (e2) {
      console.error(
        `[esbuild] Failed to install package "${pkg}" using npm: ${(e2 && e2.message) || e2}`,
      )
      try {
        await downloadDirectlyFromNPM(pkg, subpath, binPath)
      } catch (e3) {
        throw new Error(`Failed to install package "${pkg}"`)
      }
    }
  }
  maybeOptimizePackage(binPath)
}
checkAndPreparePackage().then(() => {
  if (isToPathJS) {
    validateBinaryVersion(process.execPath, toPath)
  } else {
    validateBinaryVersion(toPath)
  }
})
