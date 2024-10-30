import { exec } from 'child_process'

const platforms = ['darwin/arm64', 'darwin/amd64', 'linux/amd64', 'windows/amd64']

platforms.forEach((platform) => {
  const [os, arch] = platform.split('/')
  let output = `npm/${os}-${arch}/grprogress-${os}-${arch}`

  if (os === 'windows') output += '.exe'

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
        console.error(`error ${platform}: ${error.message}`)
        return
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`)
        return
      }
      console.log(`success ${platform}: ${stdout}`)
    },
  )
})
