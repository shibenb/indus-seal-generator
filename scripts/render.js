let _gl = null;
let _transform = { name: "u_transform", value: null };
let _bg = {
    program: null,
    vao: null,
    uTexelSize:    { name: "u_texelSize",    value: null },
    uMiscParams:   { name: "u_miscParams",   value: null },
    uBgParams:     { name: "u_bgParams",     value: null }
};
let _char = {
    program: null,
    glyphs: null,
    uMiscParams:  { name: "u_miscParams",  value: null },
    uBgDims:      { name: "u_bgDims",      value: null }
};
let _effects = {
    perlin: { uTexture:   { name: "u_perlinTexture",   value: null },
              uTexelSize: { name: "u_perlinTexelSize", value: null },
              uControls:  { name: "u_perlinControls",  value: null } },
    grainy: { uTexture:   { name: "u_grainyTexture",   value: null },
              uTexelSize: { name: "u_grainyTexelSize", value: null },
              uControls:  { name: "u_grainyControls",  value: null } },
    albedo: { uTexture:   { name: "u_albedoTexture",   value: null },
              uTexelSize: { name: "u_albedoTexelSize", value: null },
              uControls:  { name: "u_albedoControls",  value: null } }
};

function _createShader(type, source) {
    const shader = _gl.createShader(type);
    _gl.shaderSource(shader, source);
    _gl.compileShader(shader);
    if (!_gl.getShaderParameter(shader, _gl.COMPILE_STATUS)) {
        console.error(_gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

async function _createProgram(vsFile, fsFile) {
    const header = await utils_loadTextFile(constants_shaderHeader);
    const commonFrag = await utils_loadTextFile(constants_commonFragShader);
    const commonVert = await utils_loadTextFile(constants_commonVertShader);
    const vsSource = await utils_loadTextFile(vsFile);
    const fsSource = await utils_loadTextFile(fsFile);

    const vs = _createShader(_gl.VERTEX_SHADER,   header + commonVert + vsSource);
    const fs = _createShader(_gl.FRAGMENT_SHADER, header + commonFrag + fsSource);
    if (!vs || !fs) {
        console.error(`Shader creation failed: [${vsFile}] [${fsFile}]`);
        return null;
    }
    const prog = _gl.createProgram();
    _gl.attachShader(prog, vs);
    _gl.attachShader(prog, fs);
    _gl.linkProgram(prog);
    if (!_gl.getProgramParameter(prog, _gl.LINK_STATUS)) {
        console.error(_gl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

async function _loadRepeatingTexture(file) {
    const image = await utils_loadImage(file);
    const tex = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, tex);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.REPEAT);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.REPEAT);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);
    return [tex, image.width, image.height];
}

async function _loadGlyphs(images) {
    const lineOfTextures = [];
    for (const lineOfImages of images) {
        const currentLineOfTextures = [];
        for (const image of lineOfImages) {
            const tex = _gl.createTexture();
            _gl.bindTexture(_gl.TEXTURE_2D, tex);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.LINEAR);
            _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.LINEAR);
            _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);

            currentLineOfTextures.push({
                texture: tex,
                width: image.width,
                height: image.height,
                uTexelSize: { name: "u_texelSize", value: [1/image.width, 1/image.height] },
                vao: null,
            });
        }
        lineOfTextures.push(currentLineOfTextures);
    }
    return lineOfTextures;
}

async function _setupPostProcess() {
    const image = await utils_loadImage(constants_lut.file);
    constants_lut.tex.value = _gl.createTexture();
    _gl.bindTexture(_gl.TEXTURE_2D, constants_lut.tex.value);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_S, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_WRAP_T, _gl.CLAMP_TO_EDGE);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MIN_FILTER, _gl.NEAREST);
    _gl.texParameteri(_gl.TEXTURE_2D, _gl.TEXTURE_MAG_FILTER, _gl.NEAREST);
    _gl.texImage2D(_gl.TEXTURE_2D, 0, _gl.RGBA, _gl.RGBA, _gl.UNSIGNED_BYTE, image);

    const s = image.height;
    constants_lut.uControls.value = [s - 1, 1 / (s - 1), s * (s - 1) / (s * s - 1), (s - 1) / (s * s - 1)];
}

function _bindPostProcess(program) {
    _gl.activeTexture(_gl.TEXTURE4);
    _gl.bindTexture(_gl.TEXTURE_2D, constants_lut.tex.value);
    _gl.uniform1i(_gl.getUniformLocation(program, constants_lut.tex.name), 4);

    _gl.uniform4fv(_gl.getUniformLocation(program, constants_lut.uControls.name), constants_lut.uControls.value);
}

function _createQuadVao(program, positions, texCoords) {
    const vao = _gl.createVertexArray();
    _gl.bindVertexArray(vao);

    const vbuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ARRAY_BUFFER, vbuffer);
    _gl.bufferData(_gl.ARRAY_BUFFER, positions, _gl.STATIC_DRAW);
    const cPosLoc = _gl.getAttribLocation(program, "a_position");
    _gl.enableVertexAttribArray(cPosLoc);
    _gl.vertexAttribPointer(cPosLoc, 2, _gl.FLOAT, false, 0, 0);

    const tbuffer = _gl.createBuffer();
    _gl.bindBuffer(_gl.ARRAY_BUFFER, tbuffer);
    _gl.bufferData(_gl.ARRAY_BUFFER, texCoords, _gl.STATIC_DRAW);
    const cTxcLoc = _gl.getAttribLocation(program, "a_texCoord");
    _gl.enableVertexAttribArray(cTxcLoc);
    _gl.vertexAttribPointer(cTxcLoc, 2, _gl.FLOAT, false, 0, 0);

    _gl.bindVertexArray(null);
    _gl.bindBuffer(_gl.ARRAY_BUFFER, null);
    return vao;
}

function _setLightingUniforms(program) {
    _gl.uniform3fv(_gl.getUniformLocation(program, constants_uLighting.lightDir.name), constants_uLighting.lightDir.value);
    _gl.uniform3fv(_gl.getUniformLocation(program, constants_uLighting.ambientColor.name), constants_uLighting.ambientColor.value);
    _gl.uniform3fv(_gl.getUniformLocation(program, constants_uLighting.diffuseColor.name), constants_uLighting.diffuseColor.value);
    _gl.uniform4fv(_gl.getUniformLocation(program, constants_uLighting.specularParams.name), constants_uLighting.specularParams.value);
}

async function _setupEffectTextures() {
    let texture = null, width = 0, height = 0;

    [texture, width, height] = await _loadRepeatingTexture(constants_perlinTex);
    _effects.perlin.uTexture.value   = texture;
    _effects.perlin.uTexelSize.value = [1/width, 1/height];
    _effects.perlin.uControls.value  = constants_uPerlinTexControls;

    [texture, width, height] = await _loadRepeatingTexture(constants_grainyTex);
    _effects.grainy.uTexture.value   = texture;
    _effects.grainy.uTexelSize.value = [1/width, 1/height];
    _effects.grainy.uControls.value  = constants_uGrainyTexControls;

    [texture, width, height] = await _loadRepeatingTexture(constants_albedoTex);
    _effects.albedo.uTexture.value   = texture;
    _effects.albedo.uTexelSize.value = [1/width, 1/height];
    _effects.albedo.uControls.value  = constants_uAlbedoTexControls;
}

function _bindEffectTextures(program) {
    _gl.activeTexture(_gl.TEXTURE1);
    _gl.bindTexture(_gl.TEXTURE_2D, _effects.perlin.uTexture.value);
    _gl.uniform1i(_gl.getUniformLocation(program, _effects.perlin.uTexture.name), 1);
    _gl.uniform2fv(_gl.getUniformLocation(program, _effects.perlin.uTexelSize.name), _effects.perlin.uTexelSize.value);
    _gl.uniform4fv(_gl.getUniformLocation(program, _effects.perlin.uControls.name), _effects.perlin.uControls.value);

    _gl.activeTexture(_gl.TEXTURE2);
    _gl.bindTexture(_gl.TEXTURE_2D, _effects.grainy.uTexture.value);
    _gl.uniform1i(_gl.getUniformLocation(program, _effects.grainy.uTexture.name), 2);
    _gl.uniform2fv(_gl.getUniformLocation(program, _effects.grainy.uTexelSize.name), _effects.grainy.uTexelSize.value);
    _gl.uniform4fv(_gl.getUniformLocation(program, _effects.grainy.uControls.name), _effects.grainy.uControls.value);

    _gl.activeTexture(_gl.TEXTURE3);
    _gl.bindTexture(_gl.TEXTURE_2D, _effects.albedo.uTexture.value);
    _gl.uniform1i(_gl.getUniformLocation(program, _effects.albedo.uTexture.name), 3);
    _gl.uniform2fv(_gl.getUniformLocation(program, _effects.albedo.uTexelSize.name), _effects.albedo.uTexelSize.value);
    _gl.uniform4fv(_gl.getUniformLocation(program, _effects.albedo.uControls.name), _effects.albedo.uControls.value);
}

function _bindBaseTexture(program) {
    _gl.activeTexture(_gl.TEXTURE0);
    _gl.uniform1i(_gl.getUniformLocation(program, "u_texture"), 0);
}

function render_refreshViewport() {
    _gl.viewport(0, 0, _gl.canvas.width, _gl.canvas.height);
}

function render_updateBgMiscParams(aspectRatio, screenScale) {
    _bg.uMiscParams.value = [aspectRatio, constants_uDepthBgEdgeTol * screenScale, constants_uDepthBgPower, constants_uDepthBgMaxDarkness];
}

async function render_init(canvasElem, images, width, height, screenScale) {
    _gl = canvasElem.getContext("webgl2", { alpha: true, preserveDrawingBuffer: true});

    // Create the background quad
    const x0 = constants_canvasPadding, y0 = constants_canvasPadding;
    const x1 = width - constants_canvasPadding, y1 = height - constants_canvasPadding;
    const bgPositions = new Float32Array(_createQuad(x0, y0, x1, y1));
    const bgTexCoords = new Float32Array(_createQuad(0, 0, 1, 1));

    utils_loggingUpdate("Compiling GLSL Shader for Base");
    _bg.program = await _createProgram(constants_bgVertShader, constants_bgFragShader);
    _bg.vao = _createQuadVao(_bg.program, bgPositions, bgTexCoords);
    render_updateBgMiscParams(width / height, screenScale);
    _bg.uBgParams.value = [width - 2 * constants_canvasPadding, height - 2 * constants_canvasPadding, constants_bgCornerRadius];
    _bg.uTexelSize.value = [1/_bg.uBgParams.value[0], 1/_bg.uBgParams.value[1]];

    // Create the character quads
    const texCoords = new Float32Array(_createQuad(1, 0, 0, 1)); //HFlipped

    utils_loggingUpdate("Compiling GLSL Shader for Glyphs");
    _char.program = await _createProgram(constants_charVertShader, constants_charFragShader);
    utils_loggingUpdate("Loading all Glpyh Textures");
    _char.glyphs = await _loadGlyphs(images);
    _char.uMiscParams.value = [width / height, constants_uDepthCharEdgeTol, constants_uDepthCharPower, constants_uDepthCharMaxDarkness];
    _char.uBgDims.value = [x0, y0, x1, y1];

    utils_loggingUpdate("Arranging Glyphs on Canvas");
    let currentHPad = constants_canvasPadding + constants_bgPadding;
    for (let ih = 0; ih < _char.glyphs.length; ih++) {
        let currentWPad = constants_canvasPadding + constants_bgPadding;
        let lineHeight = 0;
        for (let iw = 0; iw < _char.glyphs[ih].length; iw++) {
            const x0 = width - currentWPad, y0 = height - currentHPad;
            const x1 = width - (currentWPad + _char.glyphs[ih][iw].width), y1 = height - (currentHPad + _char.glyphs[ih][iw].height);
            const positions = new Float32Array(_createQuad(x0, y0, x1, y1));
            _char.glyphs[ih][iw].vao = _createQuadVao(_char.program, positions, texCoords);

            currentWPad += (_char.glyphs[ih][iw].width + constants_charHPadding);
            lineHeight = Math.max(lineHeight, _char.glyphs[ih][iw].height);
        }
        currentHPad += (lineHeight + constants_charVPadding);
    }

    // Create the common effects
    utils_loggingUpdate("Setting up Effect Textures");
    await _setupEffectTextures();
    await _setupPostProcess();

    // Prepare to render
    _transform.value = _createTransformMatrix(width, height);
    render_refreshViewport();
    _gl.clearColor(0, 0, 0, 0);
    _gl.enable(_gl.BLEND);
    _gl.blendFunc(_gl.ONE, _gl.ONE_MINUS_SRC_ALPHA);
}

function render_render() {
    _gl.clear(_gl.COLOR_BUFFER_BIT);

    _gl.useProgram(_bg.program);
    _gl.uniformMatrix4fv(_gl.getUniformLocation(_bg.program, _transform.name), false, _transform.value);
    _gl.uniform4fv(_gl.getUniformLocation(_bg.program, _bg.uMiscParams.name), _bg.uMiscParams.value);
    _gl.uniform3fv(_gl.getUniformLocation(_bg.program, _bg.uBgParams.name), _bg.uBgParams.value);
    _gl.uniform2fv(_gl.getUniformLocation(_bg.program, _bg.uTexelSize.name), _bg.uTexelSize.value);
    _setLightingUniforms(_bg.program);
    _bindEffectTextures(_bg.program);
    _bindPostProcess(_bg.program);
    _bindBaseTexture(_bg.program);
    _gl.bindVertexArray(_bg.vao);
    _gl.drawArrays(_gl.TRIANGLES, 0, 6);

    _gl.useProgram(_char.program);
    _gl.uniformMatrix4fv(_gl.getUniformLocation(_char.program, _transform.name), false, _transform.value);
    _gl.uniform4fv(_gl.getUniformLocation(_char.program, _char.uMiscParams.name), _char.uMiscParams.value);
    _gl.uniform4fv(_gl.getUniformLocation(_char.program, _char.uBgDims.name), _char.uBgDims.value);
    _setLightingUniforms(_char.program);
    _bindEffectTextures(_char.program);
    _bindPostProcess(_char.program);
    _bindBaseTexture(_char.program);
    for (const lineOfTextures of _char.glyphs) {
        for (const cTexture of lineOfTextures) {
            _gl.uniform2fv(_gl.getUniformLocation(_char.program, cTexture.uTexelSize.name), cTexture.uTexelSize.value);
            _gl.bindVertexArray(cTexture.vao);
            _gl.bindTexture(_gl.TEXTURE_2D, cTexture.texture);
            _gl.drawArrays(_gl.TRIANGLES, 0, 6);
        }
    }
}

function _createQuad(x0, y0, x1, y1) {
    return [
        x0, y0,
        x1, y0,
        x0, y1,
        x0, y1,
        x1, y0,
        x1, y1
    ];
}

function _createTransformMatrix(width, height) {
    const sx = 2 / width;
    const sy = 2 / height;
    return new Float32Array([
        sx,  0,  0,  0,
         0, sy,  0,  0,
         0,  0,  1,  0,
        -1, -1,  0,  1
    ]);
}
