const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

try {
  // npm 文件夹路径
  const npmDir = path.join(__dirname, '../npm')
  // 获取子文件夹
  const folders = fs.readdirSync(npmDir)

  const npmToken = process.env.NPM_TOKEN // 从环境变量中获取 token
  if (!npmToken) {
    console.error('请设置 NPM_TOKEN 环境变量.')
    process.exit(1)
  }

  // 创建 .npmrc 文件
  const npmrcPath = path.join(__dirname, '../.npmrc')
  fs.writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${npmToken}`)

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
          execSync('npm publish --access public', {
            cwd: folderPath,
            stdio: 'inherit',
          })
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
