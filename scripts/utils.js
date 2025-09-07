async function utils_loadTextFile(path) {
    return new Promise((resolve, reject) => {
        //path = path + "?cacheBuster=" + Date.now(); //debug
        const xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.responseText);
            } else {
                reject(new Error(`Failed to load shader: ${path}`));
            }
        };
        xhr.onerror = () => reject(new Error(`XHR error loading: ${path}`));
        xhr.send();
    });
}

function utils_loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

async function utils_preloadImages(files) {
    const lineOfImages = [];
    for (const lineOfFiles of files) {
        let currentLineOfImages = [];
        for (const file of lineOfFiles) {
            const image = await utils_loadImage(file);
            currentLineOfImages.push(image);
        }
        lineOfImages.push(currentLineOfImages);
    }
    return lineOfImages;
}

function utils_calculateSealDims(images) {
    let totalWidth = 0;
    let totalHeight = 0;
    for (const lineofImages of images) {
        let currentWidth = 0;
        let currentHeight = 0;
        for (const image of lineofImages) {
            currentWidth += (image.width + constants_charHPadding);
            currentHeight = Math.max(currentHeight, image.height);
        }
        currentWidth -= constants_charHPadding;
        totalWidth = Math.max(totalWidth, currentWidth);
        totalHeight += currentHeight + constants_charVPadding;
    }
    totalHeight -= constants_charVPadding;

    const borderPadding = (constants_bgPadding + constants_canvasPadding) * 2;
    totalWidth += borderPadding;
    totalHeight += borderPadding;
    return [totalWidth, totalHeight, totalWidth / totalHeight];
}

// Debug helpers
function utils_debugRender(images, containerElem, maxDisplayHeight = 64) {
    containerElem.style.display = "block";
    containerElem.innerHTML = "";
    for (let lineOfImages of images) {
        const reversed = lineOfImages.slice().reverse();
        for (const path of reversed) {
            const img = new Image();
            img.src = path;
        
            img.onload = function() {
                const scale = Math.min(1, maxDisplayHeight / img.naturalHeight);
                img.width = img.naturalWidth * scale;
                img.height = img.naturalHeight * scale;
            };
            img.onerror = function() {
                console.error("Failed to load:", path);
            };

            containerElem.appendChild(img);
            console.log(path);
        }
        containerElem.appendChild(document.createElement("br"));
        console.log("newline");
    }
}

function utils_debugPrintAllGlyphPaths() {
    let filelist = [];
    for(const item of constants_iast2glyphMap) {
        filelist.push(constants_assetPrefix + item[1] + constants_assetSuffix);
    }
    const files = [...new Set(filelist)];
    console.log(files.join("\n"));
}

// Export filename utils
function utils_createExportName(input) {
    input = input.replace(/\n/g, "_");
    input = input.replace(/ /g, "-");
    if (input.length > constants_exportNameMaxLength) {
        input = input.slice(0, constants_exportNameMaxLength);
    }
    const timestamp = new Date().toLocaleString("sv-SE").replace(/\D/g, "").replace(/^(\d{8})(\d{6})$/, "$1-$2");
    return constants_exportName + "__" + input + "__" + timestamp + constants_exportExt;
}

function utils_exportData(data, filename) {
    if (window.Android && typeof window.Android.saveImageFromBase64 === "function") {
        window.Android.saveImageFromBase64(data, filename);
    } else {
        const exportElem = document.createElement("a");
        exportElem.style.display = "none";
        exportElem.href = data;
        exportElem.download = filename;
        document.body.appendChild(exportElem);
        exportElem.click();
        document.body.removeChild(exportElem);
    }
}

function utils_shareData(data, filename) {
    if (window.Android && typeof window.Android.shareImageFromBase64 === "function") {
        window.Android.shareImageFromBase64(data, filename);
    }
}

// Warning Utils
let _warningContElem = null;
let _warningListItemElems = [];

function utils_warningsInit(containerElem, listPrefix) {
    for (let i = 0; i < constants_warningsCount; i++) {
        _warningListItemElems.push(document.getElementById(listPrefix + i));
    }
    _warningContElem = containerElem;
}

function utils_warningsReset() {
    for (const elem of _warningListItemElems) {
        elem.style.display = "none";
    }
    _warningContElem.style.display = "none";
}

function utils_warningsAdd(id) {
    _warningListItemElems[id].style.display = "list-item";
    _warningContElem.style.display = "block";
}

// Logging Utils
let _loggingTextElem = null;
let _loggingContElem = null;

function utils_loggingInit(containerElem, textElem) {
    _loggingContElem = containerElem;
    _loggingTextElem = textElem;
}

function utils_loggingStart() {
    _loggingTextElem.textContent = "Initializing ...";
    _loggingContElem.style.display = "block";
}

function utils_loggingUpdate(str) {
    _loggingTextElem.textContent = str;
}

function utils_loggingStop() {
    _loggingContElem.style.display = "none";
}
