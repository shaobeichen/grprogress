# grprogress

一个使用 Go 来实现 Nodejs 的渐变色进度条

<a href="" target="__blank">
    <img src="https://img.shields.io/node/v/grprogress?style=flat-square" alt="">
</a>
<a href="https://www.npmjs.com/package/grprogress" target="_blank">
    <img src="https://img.shields.io/npm/v/grprogress?style=flat-square" alt="">
</a>
<a href="https://www.npmjs.com/package/grprogress" target="_blank">
    <img src="https://img.shields.io/npm/dm/grprogress?style=flat-square" alt="">
</a>
<a href="" target="_blank">
    <img src="https://img.shields.io/npm/l/grprogress?style=flat-square" alt="">
</a>

<br>
<br>
<img src=".//images/demo.gif" width="60%" alt="Example">

## 安装

```cmd
npm install grprogress
```

## 使用

```js
const grprogress = require('grprogress')
progress.update(0.8)
```

## API

<table class="table table-bordered table-striped">
  <thead>
  <tr>
    <th style="width: 100px;">函数名</th>
    <th style="width: 100px;">参数类型</th>
    <th>描述</th>
  </tr>
  </thead>
  <tbody>
    <tr>
      <td>update()</td>
      <td>number</td>
      <td>进度条进度，值在0-1之间。</td>
    </tr>
  </tbody>
</table>

## 原理讲解

### 视频讲解

待补充

### 核心步骤

1. Go 实现渐变色进度条。
2. Go 交叉编译可以生成不同平台的二进制文件，这种二进制文件在相应平台上可以直接命令行执行查看进度条效果。
3. Nodejs 通过 child_process 的 spawnSync 调用 Go 的二进制文件，模拟第 2 步骤。

### 为什么 npm 能运行 Go 代码？

其实本质并不是运行 Go 代码，运行的是 Go 编译后的二进制文件，而 Nodejs 只是调用了 Go 的二进制文件而已。

### npm 包里并没有二进制文件，如何运行？

#### 1.主包和平台包分离设计

二进制文件一般会比较大，动辄 3-50 Mb，如果需要兼容很多平台，比如兼容 Windows、MacOS、MacOS M、Linux 等，那么 npm 包的大小就会很大。

使用 npm install 会下载很多其他平台的二进制文件，完全是没必要的，只需要下载当前平台的二进制文件即可。

所以把主包和平台包分离，主包只包含核心代码，平台包包含对应平台的二进制文件，这样 npm install 就会下载当前平台的二进制文件，其他平台的二进制文件不会下载，从而提高下载速度。

所以主包叫 grprogress，平台包的名字按照一定的规则自动生成。比如 @grprogress/win32-x64、@grprogress/darwin-x64、@grprogress/darwin-arm64、@grprogress/linux-x64。

#### 2.生成平台包二进制文件及对应平台 package.json

当你编写好 Go 文件后，可以使用 go build -o grprogress 生成二进制文件，如果要生成多个平台包，可以指定 os 和 cpu 参数。具体逻辑可以参考 [build 文件](./scripts/build.js)，包含了生成二进制文件和 package.json 的逻辑。

在此仓库中 npm 文件夹下有个 package.json.template 文件，是用来生成各个平台包里的 package.json 文件的模板。

- name 根据上面平台包类似的规则生成。
- version 同步主包的版本。
- file 是当前平台的二进制文件名称，除了 Windows 的二进制文件会带有.exe，其他平台均不带后缀名，一律叫 grprogress。
- os 是平台，比如 Windows 平台是 win32、 MacOS 平台是 darwin、Linux 平台是 linux。
- cpu 是 cpu 架构类型，比如 x64、arm64 等，MacOS M 系列芯片就用 arm64。

当 package.json 中编写了 os 和 cpu 字段，那么在 install 某一个平台包时，它会自动检测当前平台是否与 os 和 cpu 匹配，如果匹配，则安装该平台包，否则不进行安装，并且提醒你当前平台和当前平台包里填写的 os 和 cpu 不匹配。

#### 3.发布主包和平台包

当所有平台包都生成好后，目录结构如下，只需要把主包和所有平台包一起发布到 npm 即可。

```tree
├─npm
│  └─win32-x64
│    └─grprogress.exe
│    └─package.json // @grprogress/win32-x64 平台包
│  └─darwin-x64
│    └─grprogress
│    └─package.json // @grprogress/darwin-x64 平台包
└─package.json // grprogress 主包
```

按照常规的 npm 发布流程，在根目录 npm publish，再依次在 npm/win32-x64、...多个平台包目录 npm publish 即可发布成功。

这里借助了 semantic-release 发布主包，因为发布多个包和 monorepo 的发布形式还不相同，所以不能使用 semantic-release-monorepo 插件。

使用了@semantic-release/exec，自己写了一套平台包发布逻辑。具体可以参考 [.releaserc.js](./.releaserc.js)和 [release.js](./scripts/release.js)。

release.js 中还包含更新主包 optionalDependencies 中平台包名称及版本号等逻辑，稍后详细解释其作用。

#### 4.安装主包，自动安装对应平台包

我们参考 esbuild 的安装逻辑，在 npm install grprogress 时，会自动安装对应平台的平台包，比如在 Windows 下 npm install grprogress 会自动安装 @grprogress/win32-x64 平台包。

怎样实现自动安装平台包并可执行呢？

1. 在主包的 package.json 中，添加一个 scripts 字段，里面有 postinstall 字段，当使用者使用 npm install 时，就会触发主包中的 postinstall 脚本，这个脚本就是[install.js](./install.js)。

2. install.js 脚本大致逻辑是 先下载平台包，然后移动二进制文件到主包中。

3. 我们参考了 esbuild 的 install.js，分为三级策略。

4. 第一级，会通过`require.resolve(`@grprogress/win32-x64/grprogress.exe`)`自动触发 optionalDependencies 中平台包@grprogress/win32-x64 的安装，如果成功，则直接返回，不再执行第二级和第三级策略。

5. 第二级，如果第一级失败，则在主包安装过程中，创建一个临时文件夹，再执行 npm install @grprogress/win32-x64 安装平台包，然后把平台包中的 grprogress 二进制文件移动到主包中，然后删除临时文件夹。如果成功，则直接返回，不再执行第三级策略。

6. 第三级，如果第二级失败，则通过 npm 压缩包的形式手动使用 https 下载，过程是 下载压缩包 -> 解压压缩包 -> 删除压缩包 -> 移动指定的文件 -> 删除文件夹。使用 https 请求 `https://registry.npmjs.com/@grprogress/win32-x64/-/win32-x64-1.6.0.tgz`，下载好压缩包后，使用 zlib 解压，然后把 grprogress 二进制文件移动到主包中，然后删除临时文件夹。

7. 最终都会在主包中找到 grprogress 二进制文件。

8. 我们封装好了使用 spawn 运行 grprogress 二进制文件的逻辑，此时引入 grprogress，执行 grprogress.update(0.8) 即可在控制台看到渐变色进度条。

这样就达到了 npm 包里并没有二进制文件，安装后可以运行二进制文件的逻辑。

### 其他语言

我们使用 Go 来实现，其他语言也是类似逻辑，比如目前 Rust 语言来实现 Nodejs 的工具库，例如 rspack，采用的方式也是大同小异。@rspack/core 里依赖了@rspack/binding，@rspack/binding 分发了很多平台包，安装的逻辑在[binding.js](https://www.npmjs.com/package/@rspack/binding?activeTab=code)。

## 参考

[渐变进度条 Go 库 BubbleTea - 非常适合简单和复杂的终端应用](https://github.com/charmbracelet/bubbletea)

## 相关问题

1. 使用 Go 编写的 esbuild 是如何发布到 npm 的？
2. esbuild 的安装逻辑是什么？
3. esbuild 支持多平台的思路是什么？
4. Golang 是怎么编译为 npm 库的？
5. Go 是怎么编译为 npm 库的？
6. Go 与 npm 开发是如何结合的？
7. 使用 Golang 语言编写 Nodejs 扩展的开发工具
8. 基于 npm 进行跨平台分发 Golang 二进制程序
