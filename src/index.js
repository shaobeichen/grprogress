import path from 'path'
import { spawnSync } from 'child_process'

export function update(current) {
  // 获取当前工作目录并构建完整路径
  const command = path.join(process.cwd(), './bin/grprogress_windows_amd64.exe')
  const args = [String(current)]

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error(`Error: ${result.error.message}`)
  }
}
