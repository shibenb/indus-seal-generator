// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Shiben Bhattacharjee

in vec2 v_bgTexCoord;

float poweredTex(sampler2D tex, vec2 uv) {
    return pow(texture(tex, uv).r, m_depthPower);
}

float poweredTex(sampler2D tex, vec2 uv, vec2 texelSize, float dx, float dy) {
    return poweredTex(tex, uv + texelSize * vec2(dx, dy));
}

vec2 gradientFromSdfTex(sampler2D tex, vec2 uv, vec2 texelSize) {
    float h00 = poweredTex(tex, uv, texelSize, -1.0, -1.0);
    float h10 = poweredTex(tex, uv, texelSize,  0.0, -1.0);
    float h20 = poweredTex(tex, uv, texelSize,  1.0, -1.0);

    float h01 = poweredTex(tex, uv, texelSize, -1.0,  0.0);
    float h21 = poweredTex(tex, uv, texelSize,  1.0,  0.0);

    float h02 = poweredTex(tex, uv, texelSize, -1.0,  1.0);
    float h12 = poweredTex(tex, uv, texelSize,  0.0,  1.0);
    float h22 = poweredTex(tex, uv, texelSize,  1.0,  1.0);

    float dx =
        -1.0 * h00 + 1.0 * h20 +
        -2.0 * h01 + 2.0 * h21 +
        -1.0 * h02 + 1.0 * h22;

    float dy =
        -1.0 * h00 + -2.0 * h10 + -1.0 * h20 +
         1.0 * h02 +  2.0 * h12 +  1.0 * h22;

    //dx is positive to compensate Hflipped glyph texture
    return vec2( dx, -dy);
}

void main() {
    float rawDepth = poweredTex(u_texture, v_texCoord);
    float perlin = texturePerlin(v_bgTexCoord).r;
    rawDepth += perlin;
    float alpha = normalizeRangeClamped(rawDepth, 0.0, m_depthEdgeTol);

    vec2 grad = gradientFromSdfTex(u_texture, v_texCoord, u_texelSize);
    vec2 gradP = gradientPerlin(v_bgTexCoord);
    vec2 gradG = gradientGrainy(v_bgTexCoord);
    grad += gradP + (1.0 - rawDepth) * gradG;
    vec3 normal = normalize(vec3(grad, 1.0));
   
    float depth = fitRangeClamped(rawDepth, 0.0, 1.0, 1.0, m_depthMaxDarkness);
    vec3 albedo = depth * textureAlbedo(v_bgTexCoord).xyz;
    outColor = vec4(postProcess(applyLighting(normal, albedo)) * alpha, alpha);
}
