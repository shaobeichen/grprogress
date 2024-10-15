#!/bin/bash

# 定义需要编译的操作系统和架构
platforms=("linux/amd64" "linux/386" "darwin/amd64" "windows/amd64")

for platform in "${platforms[@]}"; do
    # 分割平台字符串
    IFS="/" read -r os arch <<< "$platform"
    
    # 设置输出文件名称
    output="hello_${os}_${arch}"
    if [ "$os" == "windows" ]; then
        output+=".exe"
    fi
    
    # 编译
    GOOS=$os GOARCH=$arch go build -o "$output" main.go
done