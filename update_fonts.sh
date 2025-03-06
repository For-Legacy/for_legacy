#!/bin/bash

# Script to add Satoshi Variable Font to all HTML files
for file in $(find . -name "*.html"); do
  if ! grep -q "Satoshi Variable Font" "$file"; then
    echo "Adding Satoshi font to $file"
    sed -i '' -e '/<link href="https:\/\/fonts.gstatic.com" rel="preconnect" crossorigin>/a\\
  <!-- Satoshi Variable Font -->\
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap" rel="stylesheet">\
' "$file"
  else
    echo "Satoshi font already in $file"
  fi
done

echo "Font update complete!" 