const path = require('path')
const { execSync } = require('child_process')

// 获取 GITHUB_TOKEN
const githubToken = process.env.GITHUB_TOKEN
if (!githubToken) {
  console.error('请设置 GITHUB_TOKEN 环境变量。')
  return
}

try {
  // npm 文件夹路径
  const npmDir = path.join(__dirname, 'npm')

  console.log(`正在发布 ${npmDir} 下的所有子模块...`)

  // 设置 NPM_TOKEN
  process.env.NPM_TOKEN = githubToken // 如果需要，调整此行

  // 执行 npm publish -r
  execSync(`npm publish -r ${npmDir}`, { stdio: 'inherit' })

  console.log('所有子模块发布成功！')
} catch (err) {
  console.error('发布失败:', err.message)
}
