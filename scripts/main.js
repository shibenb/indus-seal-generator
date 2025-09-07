const _langInputMenuElem = document.getElementById("lang-input-menu");
const _textInputContainerElem = document.getElementById("text-input-container");
const _confirmButtonElem = document.getElementById("confirm-button");
const _userInputContainerElem = document.getElementById("user-input-container");
const _userInputKbElem = document.getElementById("user-input-kb");
const _userInputTextElem = document.getElementById("user-input-text");
const _userInputDetectedScriptElem = document.getElementById("user-input-detected-script");
const _userInputIastConversionElem = document.getElementById("user-input-iast-conversion");
const _warningsContainerElem = document.getElementById("warnings-container");
const _loggingContainerElem = document.getElementById("logging-container");
const _loggingStatusTextElem = document.getElementById("logging-status-text");
const _debugContainerElem = document.getElementById("debug-container");
const _outputContainerElem = document.getElementById("output-container");
const _renderContainerElem = document.getElementById("render-container");
const _exportButtonElem = document.getElementById("export-button");
const _shareButtonElem = document.getElementById("share-button");

const _textInputId = "text-input";
const _warningsListItemIdPrefix = "warnings-list-item-";
const _renderWebglCanvasId = "render-webgl-canvas";

let   _textInputElem = null;
let   _renderWebglCanvasElem = null;
let   _sealWidth = 0;
let   _sealHeight = 0;
let   _iastOutput = "";

function populateLangMenu() {
    let optionsHTML = "";
    for (const code in constants_langInfo) {
        const label = constants_langInfo[code].label;
        optionsHTML += `<option value="${code}">${label}</option>\n`;
    }
    _langInputMenuElem.innerHTML = optionsHTML;
}

function _refreshTextInputElem() {
    _textInputElem = document.getElementById(_textInputId);
    const inputValue = _textInputElem.value;
    _textInputContainerElem.innerHTML = `<textarea id="${_textInputId}" rows="5" placeholder="${constants_placeholderText}">${inputValue}</textarea>`;
    _textInputElem = document.getElementById(_textInputId);
}

function attachVarnamKeyboard() {
    _refreshTextInputElem();
    const langValue = _langInputMenuElem.value;
    if (langValue !== "en") {
        plugVarnam(_textInputElem, {schemeID: langValue});
    }
}

function _updateRenderContainerSizeAndGetDims(aspectRatio) {
    const width = _outputContainerElem.parentElement.clientWidth;
    const height = width / aspectRatio;
    _renderContainerElem.width = width;
    _renderContainerElem.height = height;
    return [width, height];
}

function _refreshCanvasAndGetWidth() {
    const [width, height] = _updateRenderContainerSizeAndGetDims(_sealWidth / _sealHeight);
    _renderContainerElem.innerHTML = `<canvas id="${_renderWebglCanvasId}" width="${width}" height="${height}" style="background: transparent;"></canvas>`;
    _renderWebglCanvasElem = document.getElementById(_renderWebglCanvasId);
    return width;
}

async function renderSeal() {
    _confirmButtonElem.disabled = true;
    _outputContainerElem.style.display = "none";
    _userInputContainerElem.style.display = "block";
    utils_warningsReset();
    utils_loggingStart();

    const inputValue = _textInputElem.value;
    const langValue = _langInputMenuElem.value;
    _userInputTextElem.textContent = inputValue;
    _userInputKbElem.textContent = constants_langInfo[langValue].label;

    utils_loggingUpdate("Detecting Script of User's Input");
    const detectedScript = langmap_detectScript(inputValue);
    _userInputDetectedScriptElem.textContent = detectedScript;
    const selectedScript = constants_langInfo[langValue].script;
    if (detectedScript !== selectedScript && selectedScript !== constants_noScript) {
        utils_warningsAdd(constants_warningScriptMismatch);
    }
    
    utils_loggingUpdate("Converting to IAST");
    _iastOutput = langmap_userInput2iast(inputValue, detectedScript);
    _userInputIastConversionElem.textContent = _iastOutput;

    utils_loggingUpdate("Gathering Glyph list");
    const imageFiles = langmap_iast2indus(_iastOutput, constants_assetPrefix, constants_assetSuffix);
    //utils_debugRender(imageFiles, _debugContainerElem); //return; //debug line

    utils_loggingUpdate("Preloading Glyph images");
    const images = await utils_preloadImages(imageFiles);
    utils_loggingUpdate("Preparing Canvas");
    [_sealWidth, _sealHeight] = utils_calculateSealDims(images);
    const canvasWidth = _refreshCanvasAndGetWidth();

    utils_loggingUpdate("Initializing WebGL Subsystem");
    await render_init(_renderWebglCanvasElem, images, _sealWidth, _sealHeight, _sealWidth / canvasWidth);
    utils_loggingUpdate("Rendering");
    render_render();

    utils_loggingStop();
    _outputContainerElem.style.display = "block";
    _confirmButtonElem.disabled = false;
}

function exportPng() {
    const pngData = _renderWebglCanvasElem.toDataURL("image/png");
    const filename = utils_createExportName(_iastOutput);
    utils_exportData(pngData, filename);
}

function sharePngAndroid() {
    const pngData = _renderWebglCanvasElem.toDataURL("image/png");
    const filename = utils_createExportName(_iastOutput);
    utils_shareData(pngData, filename);
}

function handleResize() {
    if (_outputContainerElem.style.display !== "none" ) {
        const [width, height] = _updateRenderContainerSizeAndGetDims(_sealWidth / _sealHeight);
        _renderWebglCanvasElem.width = width;
        _renderWebglCanvasElem.height = height;

        render_updateBgMiscParams(_sealWidth / _sealHeight, _sealWidth / width);
        render_refreshViewport();
        render_render();
    }
}

populateLangMenu();
attachVarnamKeyboard();
utils_warningsInit(_warningsContainerElem, _warningsListItemIdPrefix);
utils_loggingInit(_loggingContainerElem, _loggingStatusTextElem);

_langInputMenuElem.addEventListener("change", attachVarnamKeyboard);
_confirmButtonElem.addEventListener("click", renderSeal);
_exportButtonElem.addEventListener("click", exportPng);
_shareButtonElem.addEventListener("click", sharePngAndroid);
window.addEventListener("resize", handleResize);

//document.getElementById(_textInputId).textContent = "śibena\nbhaṭṭācārjī" //debug line
//renderSeal(); //debug line
