// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Shiben Bhattacharjee

const constants_mapSpace = "999";
const constants_iast2glyphMap = [
    ["an", "740"],
    ["aṃ", "700"],
    ["as", "550"],
    ["aḥ", "200"],
    //["ai", "000"], //glyphs of "a" then "i"
    //["au", "000"], //glyphs of "a" then "u"
    ["a",  "090"],
    ["ā",  "091"],
    ["i",  "400"],
    ["ī",  "401"],
    ["u",  "794"],
    ["ū",  "853"],
    ["ṛ",  "820"],
    ["ṝ",  "820"],
    ["ḷ",  "820"],
    ["l̤",  "297"],
    ["e",  "503"],
    ["o",  "435"],
    ["kh", "690"],
    ["k",  "645"],
    ["gh", "066"],
    ["g",  "066"],
    ["ṅ",  "700"],
    ["ch", "350"],
    ["c",  "350"],
    ["jh", "906"],
    ["j",  "055"],
    ["ñ",  "705"],
    ["ṭh", "812"],
    ["ṭ",  "415"],
    ["dh", "892"],
    ["d",  "840"],
    ["ṇ",  "745"],
    ["th", "260"],
    ["t",  "140"],
    ["n",  "740"],
    ["ph", "440"],
    ["p",  "440"],
    ["bh", "585"],
    ["b",  "382"],
    ["m",  "220"],
    ["y",  "156"],
    ["r",  "861"],
    ["l",  "297"],
    ["v",  "590"],
    ["ś",  "455"],
    ["ṣ",  "803"],
    ["s",  "244"],
    ["h",  "176"],
    ["ḻ",  "297"],
    ["ḥ",  "200"],
    ["ṁ",  "220"], //no glyph, repeating "m"
    ["ṃ",  "220"], //no glyph, repeating "m"
    ["m̐",  "220"], //no glyph, repeating "m"
    ["ẖ",  "176"], //no glyph, repeating "h"
    ["ḫ",  "176"], //no glyph, repeating "h"
    ["0",  "000"],
    ["1",  "001"],
    ["2",  "002"],
    ["3",  "013"],
    ["4",  "004"],
    ["5",  "015"],
    ["6",  "016"],
    ["7",  "017"],
    ["8",  "018"],
    ["9",  "019"],
    [" ",  constants_mapSpace]
];
const constants_en2iastMap = {
    "a": "a",
    "b": "b",
    "c": "k",  // crude, but common for "cat"
    "d": "d",
    "e": "e",
    "f": "ph", // map to aspirated
    "g": "g",
    "h": "h",
    "i": "i",
    "j": "j",
    "k": "k",
    "l": "l",
    "m": "m",
    "n": "n",
    "o": "o",
    "p": "p",
    "q": "k",  // very crude
    "r": "r",
    "s": "s",
    "t": "t",
    "u": "u",
    "v": "v",
    "w": "v",  // approximate
    "x": "kṣ",
    "y": "y",
    "z": "j",
    "0": "0",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    " ": " ",
    "\n":"\n"
};

const constants_noScript = "latin";
const constants_langInfo = {
    "en": { script: "latin", label: "No Keyboard" }, //noScript
    "hi": { script: "devanagari", label: "Hindi (Devanagari)" },
    "bn": { script: "bengali", label: "Bengali" },
    "mr": { script: "devanagari", label: "Marathi (Devanagari)" },
    "te": { script: "telugu", label: "Telugu" },
    "ta": { script: "tamil", label: "Tamil" },
    "gu": { script: "gujarati", label: "Gujarati" },
    "kn": { script: "kannada", label: "Kannada" },
    "or": { script: "oriya", label: "Oriya (Odia)" },
    "ml": { script: "malayalam", label: "Malayalam" },
    "ml-inscript": { script: "malayalam", label: "Malayalam (InScript Keyboard)" },
    "pa": { script: "gurmukhi", label: "Punjabi (Gurmukhi)" },
    "as": { script: "bengali", label: "Assamese (Bengali script)" },
    "ne": { script: "devanagari", label: "Nepali (Devanagari)" },
    "sa": { script: "devanagari", label: "Sanskrit (Devanagari)" }
};
const constants_scriptUnicodeRange = {
    "devanagari": [/[\u0900-\u097F]/],
    "bengali":    [/[\u0980-\u09FF]/],
    "telugu":     [/[\u0C00-\u0C7F]/],
    "tamil":      [/[\u0B80-\u0BFF]/],
    "gujarati":   [/[\u0A80-\u0AFF]/],
    "kannada":    [/[\u0C80-\u0CFF]/],
    "oriya":      [/[\u0B00-\u0B7F]/],
    "malayalam":  [/[\u0D00-\u0D7F]/],
    "gurmukhi":   [/[\u0A00-\u0A7F]/],
    "iast":       [/[\u0100-\u024F\u1E00-\u1EFF]/],
    "latin":      [/[a-zA-Z]/] //\u0041-\u005A\u0061-\u007A //noScript
};
const constants_placeholderText = "Enter text here...\n✅ Any Indian language\n✅ Numbers, spaces, multiple lines\n❌ Special Characters won't work";
const constants_warningsCount = 4;
const constants_warningScriptMismatch = 0;
const constants_warningUnknownChar = 1;
const constants_warningLatinDetected = 2;
const constants_warningInputTooShort = 3;
const constants_warningInputTooShortLength = 4;

const constants_assetPrefix = "assets/sdfs/S";
const constants_assetSuffix = ".png";
const constants_exportName = "indus-seal-generator";
const constants_exportExt = ".png";
const constants_exportNameMaxLength = 50;

const constants_shaderHeader = "shaders/header.glsl"
const constants_commonFragShader = "shaders/common_frag.glsl"
const constants_commonVertShader = "shaders/common_vert.glsl"
const constants_bgFragShader = "shaders/bg_frag.glsl"
const constants_bgVertShader = "shaders/bg_vert.glsl"
const constants_charFragShader = "shaders/char_frag.glsl"
const constants_charVertShader = "shaders/char_vert.glsl"

const constants_charHPadding = -10;
const constants_charVPadding = 30;
const constants_bgPadding = 100;
const constants_canvasPadding = 2;
const constants_bgCornerRadius = Math.min(40, constants_bgPadding);

const constants_perlinTex = "assets/perlin23-sbs-oga.jpg";
const constants_grainyTex = "assets/cracks3-grainy9-sbs-oga.jpg";
const constants_albedoTex = "assets/461223200-1st-oga.jpg";

const constants_uPerlinTexControls = [0.1, 0.2, Math.random(), Math.random()]; //freq,amp,offsetxy
const constants_uGrainyTexControls = [1,   0.1, Math.random(), Math.random()]; //freq,amp,offsetxy
const constants_uAlbedoTexControls = [1,     1, Math.random(), Math.random()]; //freq,amp,offsetxy

const constants_lut = {
    file: "assets/lut/lut-crank-contrast.png",
    tex: { name: "u_lutTexture", value: null },
    uControls: { name: "u_lutControls", value: null }
}

const constants_uLighting = {
    lightDir: { name: "u_lightDir", value: [1, 0.75, 1.5] },
    ambientColor: { name: "u_ambientColor", value: [0.09, 0.11, 0.09] },
    diffuseColor: { name: "u_diffuseColor", value: [1.1, 0.9, 0.8] },
    specularParams: { name: "u_specularParams", value: [0.3, 0.5, 0.7, 16] },
}

const constants_uDepthBgEdgeTol = 1.3619 / constants_bgCornerRadius;
const constants_uDepthCharEdgeTol = 0.1;
const constants_uDepthBgPower = 0.5;
const constants_uDepthCharPower = 1.5;
const constants_uDepthBgMaxDarkness = 0.8;
const constants_uDepthCharMaxDarkness = 0.5;
