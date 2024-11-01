const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { version } = require('../package.json')

const platforms = [
  { realPlatform: 'win32/x64', goPlatform: 'windows/amd64' },
  { realPlatform: 'darwin/x64', goPlatform: 'darwin/amd64' },
  { realPlatform: 'darwin/arm64', goPlatform: 'darwin/arm64' },
  { realPlatform: 'linux/x64', goPlatform: 'linux/amd64' },
]

const npmPath = path.join(__dirname, '../npm')

platforms.forEach((platform) => {
  const [GOOS, GOARCH] = platform.goPlatform.split('/')
  const [realOs, realArch] = platform.goPlatform.split('/')

  const childPackageName = `${realOs}-${realArch}`
  const childPackageDir = path.join(npmPath, childPackageName)
  const binName = realOs === 'win32' ? 'grprogress.exe' : 'grprogress'
  const childPackageBinName = path.join(childPackageDir, binName)
  if (!fs.existsSync(childPackageDir)) fs.mkdirSync(childPackageDir)

  const templatePath = path.join(npmPath, 'package.json.template')
  let templateContent = fs.readFileSync(templatePath, 'utf8')

  const replaceMap = {
    name: '@grprogress/' + childPackageName,
    version: process.argv[2] || version,
    file: binName,
    os: realOs,
    cpu: realArch,
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
        GOOS,
        GOARCH,
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
