#!/bin/sh
curl -L "https://api.varnamproject.com/embed.css" -o "varnamproject_embed.css"
curl -L "https://api.varnamproject.com/embed.js"  -o "varnamproject_embed.js"
curl -L "https://cdn.jsdelivr.net/npm/@indic-transliteration/sanscript@1.3.3/sanscript.min.js" -o "sanscript.min.js"
