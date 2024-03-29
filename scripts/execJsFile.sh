#!/bin/bash

# 시작 디렉토리를 입력받거나 스크립트의 상위 디렉토리를 기본값으로 사용
START_DIR=${1:-$(dirname "$(dirname "$(realpath "$0")")")}/srcs
ERROR_OCCURRED=0

echo "$START_DIR"

echo "Node.js로 실행할 JavaScript 파일 검색 중 ('type' 폴더 제외)..."
find "$START_DIR" ! \( \( -type d -path "$START_DIR/scheduler" -o -path "$START_DIR/work" \) -prune \) -name "*.js" -print | while read filename; do
    echo "실행 중: $filename"
    if ! node "$filename"; then
        echo "오류 발생: $filename 실행 중 오류가 발생했습니다."
        ERROR_OCCURRED=1
        exit 1
    fi
done

echo "모든 JavaScript 파일이 성공적으로 실행되었습니다."
exit 0
