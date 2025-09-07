// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Shiben Bhattacharjee

out vec2 v_position;
uniform vec3 u_bgParams;

void main() {
    gl_Position = u_transform * vec4(a_position, 0, 1);
    v_position  = u_bgParams.xy * (a_texCoord - vec2(0.5));
    v_texCoord  = a_texCoord * m_aspectRatio;
}
