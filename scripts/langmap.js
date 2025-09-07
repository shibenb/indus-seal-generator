function langmap_iast2indus(input, prefix, suffix) {
    const space = prefix + constants_mapSpace + suffix;
    const lines = []
    let currentLine = [];
    let i = 0;
    //let message = "Glyph Map: "; //debug line

    while (i < input.length) {
        // First see if a match is found
        let matched = null;
        for (const [phoneme, glyph] of constants_iast2glyphMap) {
            if (input.startsWith(phoneme, i)) {
                matched = [phoneme, glyph];
                break;
            }
        }
        if (matched) { //match is found, add it to the list
            //message += `[${matched[0]}=${matched[1]}],`; //debug line
            let path = prefix + matched[1] + suffix;
            currentLine.push(path);
            i += matched[0].length;
        } else if (input[i] === '\n') { //it is a newline
            //message += "[newline],"; //debug line
            if (currentLine.length === 0) { //what if the line is empty?
                currentLine.push(space);
            }
            lines.push(currentLine);
            currentLine = [];
            i++;
        } else { //for a character that is unknown
            //message += `[unknown=${constants_mapSpace}],`; //debug line
            currentLine.push(space);
            i++;
        }
    }
    if (currentLine.length === 0) { //what if last line was empty?
        currentLine.push(space);
    }

    lines.push(currentLine); //add the last line
    //console.log(message.slice(0, -1)); //debug line
    return lines;
}

function langmap_en2iast(input) {
    const lowerInput = input.toLowerCase();
    let result = "";

    for (let i = 0; i < lowerInput.length; i++) {
        const c = lowerInput[i];
        if (constants_en2iastMap.hasOwnProperty(c)) {
            result += constants_en2iastMap[c];
        } else {
            result += " ";
        }
    }
    return result;
}

function _escapeNewLines(s) {
    return s.replace(/\n/g, "\\n");
}

function _countNonSpaceChars(str) {
    return str.replace(/[\s\n]/g, "").length;
}

function _stripWhitespaceAndDigits(str) {
    return str.replace(/[\s0-9]/g, "");
}

function langmap_userInput2iast(input, script) {
    //const printInput = _escapeNewLines(input); //debug line
    //console.log(`User Input: [${printInput}], Script: [${script}]`); //debug line

    let iast = input;
    if (script === constants_noScript) {
        iast = langmap_en2iast(input);
    } else if (script !== "iast") {
        iast = Sanscript.t(input, script, 'iast');
    }

    if (_countNonSpaceChars(iast) < constants_warningInputTooShortLength) {
        utils_warningsAdd(constants_warningInputTooShort);
    }

    //const printIast = _escapeNewLines(iast); //debug line
    //console.log(`IAST: [${printIast}]`); //debug line
    return iast;
}

function langmap_detectScript(str) {
    const counts = {};
    let hasIASTChar = false;
    let totalCharsMatched = 0;
    str = _stripWhitespaceAndDigits(str);

    // Step 1: Count matches per script
    for (const char of str) {
        for (const script in constants_scriptUnicodeRange) {
            const patterns = constants_scriptUnicodeRange[script];
            for (const re of patterns) {
                if (re.test(char)) {
                    counts[script] = (counts[script] || 0) + 1;
                    if (script === "iast") {
                        hasIASTChar = true;
                    }
                    totalCharsMatched++;
                    break;
                }
            }
        }
    }

    // Step 2: Find Maximum count matches per script (IAST gets priority)
    let bestScript = constants_noScript;
    if (hasIASTChar) {
        bestScript = "iast";
    } else {
        let maxCount = 0;
        for (const script in counts) {
            if (counts[script] > maxCount) {
                bestScript = script;
                maxCount = counts[script];
            }
        }
    }

    // Step 3: Check if any char does not belong to the final script
    const finalRanges = [...constants_scriptUnicodeRange[bestScript]];
    if (hasIASTChar) {
        // Latin characters to be considered part of IAST
        finalRanges.push(constants_scriptUnicodeRange[constants_noScript][0]);
    }

    for (const char of str) {
        let isCharInUnicodeRange = false;
        for (const re of finalRanges) {
            if (re.test(char)) {
                isCharInUnicodeRange = true;
                break;
            }
        }
        if (!isCharInUnicodeRange) {
            utils_warningsAdd(constants_warningUnknownChar);
            break;
        }
    }

    if (bestScript === constants_noScript && totalCharsMatched !== 0) {
        utils_warningsAdd(constants_warningLatinDetected);
    }
    return bestScript;
}
