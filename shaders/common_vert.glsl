// SPDX-License-Identifier: MIT
// Copyright (c) 2025 Shiben Bhattacharjee

in vec2 a_position;
in vec2 a_texCoord;
out vec2 v_texCoord;

uniform mat4 u_transform;
uniform vec4 u_miscParams;

#define m_aspectRatio vec2(u_miscParams.x, 1.0)
