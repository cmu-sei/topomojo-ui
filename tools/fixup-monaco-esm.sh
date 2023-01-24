#!/bin/sh
## monaco-editor/esm isn't actually esm compliant, so angular 14+ build throws error
## https://github.com/microsoft/monaco-editor/issues/886
## this script separates css from js

target=node_modules/monaco-editor/esm

rm -rf $target/vs/styles.css 2> /dev/null
find $target -name "*.js" -exec sed -i.bak -e "s,^\(import.*css'.*\)$,//\1," {} \;
find $target -name "*.css" -exec cat {} >> $target/vs/styles.css \;
find $target -name "*.ttf" -exec cp {} $target/vs \;
