// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Shiben Bhattacharjee

out vec2 v_bgTexCoord;
uniform vec4 u_bgDims;

vec2 normalizeRange(vec2 p, vec2 p0, vec2 p1) {
    return (p - p0) / (p1 - p0);
}

void main() {
    gl_Position = u_transform * vec4(a_position, 0, 1);
    v_bgTexCoord = normalizeRange(a_position, u_bgDims.xy, u_bgDims.zw) * m_aspectRatio;
    v_texCoord = a_texCoord;
}
