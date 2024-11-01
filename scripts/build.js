const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { version } = require('../package.json')

const platforms = ['windows/amd64', 'darwin/amd64', 'darwin/arm64', 'linux/amd64']

const npmPath = path.join(__dirname, '../npm')

platforms.forEach((platform) => {
  const [os, arch] = platform.split('/')

  const childPackageName = `${os}-${arch}`
  const childPackageDir = path.join(npmPath, childPackageName)
  const binName = os === 'windows' ? 'grprogress.exe' : 'grprogress'
  const childPackageBinName = path.join(childPackageDir, binName)
  if (!fs.existsSync(childPackageDir)) fs.mkdirSync(childPackageDir)

  const templatePath = path.join(npmPath, 'package.json.template')
  let templateContent = fs.readFileSync(templatePath, 'utf8')

  const replaceMap = {
    name: '@grprogress/' + childPackageName,
    version: process.argv[2] || version,
    file: binName,
    os,
    cpu: arch,
  }

  Object.keys(replaceMap).forEach((key) => {
    templateContent = templateContent.replace(new RegExp(`{{${key}}}`, 'g'), replaceMap[key])
  })

  const packagePath = path.join(childPackageDir, 'package.json')
  fs.writeFileSync(packagePath, templateContent)

  const output = childPackageBinName
  const command = `go build -o ${output} main.go`

  exec(
    command,
    {
      env: {
        ...process.env,
        GOOS: os,
        GOARCH: arch,
      },
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`[error]: ${platform} ${error.message}`)
        return
      }
      if (stderr) {
        console.error(`[stderr]: ${platform} ${stderr}`)
        return
      }
      console.log(`[success]: ${platform} ${stdout}`)
    },
  )
})
