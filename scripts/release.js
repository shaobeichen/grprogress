const path = require('path')
const { execSync } = require('child_process')

try {
  // npm 文件夹路径
  const npmDir = path.join(__dirname, 'npm')

  console.log(`正在发布 ${npmDir} 下的所有子模块...`)

  // 执行 npm publish -r
  execSync(`npm publish -r ${npmDir}`, { stdio: 'inherit' })

  console.log('所有子模块发布成功！')
} catch (err) {
  console.error('发布失败:', err.message)
}
