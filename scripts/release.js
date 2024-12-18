const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const { getPackageInfoByCurrentPlatform } = require('../utils')

function updatePackageOptionalDependencies() {
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  // 获取当前版本号
  const currentVersion = process.argv[2]
  if (!process.argv[2]) {
    return (packageJson.optionalDependencies = {})
  }
  // 更新 optionalDependencies 中的版本号
  const { packages } = getPackageInfoByCurrentPlatform()
  packageJson.optionalDependencies = Object.fromEntries(
    packages.map((name) => [name, currentVersion]),
  )

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4), 'utf8')
}

function publishChildPackage() {
  try {
    // npm 文件夹路径
    const npmDir = path.join(__dirname, '../npm')
    // 获取子文件夹
    const folders = fs.readdirSync(npmDir)

    // 从环境变量中获取 npm token
    const npmToken = process.env.NPM_TOKEN

    if (!npmToken) {
      console.error('请确保设置 NPM_TOKEN 环境变量。')
      process.exit(1)
    }

    // 遍历每个子文件夹
    folders.forEach((folder) => {
      const folderPath = path.join(npmDir, folder)

      // 检查是否是文件夹
      const stats = fs.statSync(folderPath)
      if (stats.isDirectory()) {
        // 检查是否有 package.json
        const packageJsonPath = path.join(folderPath, 'package.json')
        if (fs.existsSync(packageJsonPath)) {
          console.log(`正在发布 ${folder}...`)
          try {
            // 执行 npm publish
            execSync(
              `npm publish --access public --scope=@grprogress --//registry.npmjs.org/:_authToken=${npmToken} --loglevel verbose`,
              {
                cwd: folderPath,
                stdio: 'inherit',
              },
            )
            console.log(`发布 ${folder} 成功!`)
          } catch (err) {
            console.error(`发布 ${folder} 失败:`, err.message)
          }
        }
      }
    })
  } catch (err) {
    console.error('发布发生错误:', err.message)
  }
}

updatePackageOptionalDependencies()
publishChildPackage()
