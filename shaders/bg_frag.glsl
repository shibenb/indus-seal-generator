in vec2 v_position;

uniform vec3 u_bgParams;

float roundedBoxSdf(vec2 pos, vec2 size, float radius) {
    vec2 d = abs(pos) - size + vec2(radius);
    float shape = length(max(d, 0.0)) - radius;
    float dist = smoothstep(0.0, -radius, shape);
    return pow(dist, m_depthPower);
}

vec2 gradientFromSdf(vec2 pos, vec2 size, float radius) {
    float h00 = roundedBoxSdf(pos + vec2(-1, -1), size, radius);
    float h10 = roundedBoxSdf(pos + vec2( 0, -1), size, radius);
    float h20 = roundedBoxSdf(pos + vec2( 1, -1), size, radius);

    float h01 = roundedBoxSdf(pos + vec2(-1,  0), size, radius);
    float h21 = roundedBoxSdf(pos + vec2( 1,  0), size, radius);

    float h02 = roundedBoxSdf(pos + vec2(-1,  1), size, radius);
    float h12 = roundedBoxSdf(pos + vec2( 0,  1), size, radius);
    float h22 = roundedBoxSdf(pos + vec2( 1,  1), size, radius);

    float dx =
        -1.0 * h00 + 1.0 * h20 +
        -2.0 * h01 + 2.0 * h21 +
        -1.0 * h02 + 1.0 * h22;

    float dy =
        -1.0 * h00 + -2.0 * h10 + -1.0 * h20 +
         1.0 * h02 +  2.0 * h12 +  1.0 * h22;

    return vec2(-dx, -dy);
}

void main() {
    vec2 halfSize = u_bgParams.xy * 0.5;

    vec2 grad = gradientFromSdf(v_position, halfSize, u_bgParams.z);
    vec2 gradP = gradientPerlin(v_texCoord);
    vec2 gradG = gradientGrainy(v_texCoord);
    grad += gradP + gradG;
    vec3 normal = normalize(vec3(grad, 1.0));

    float sdf = roundedBoxSdf(v_position, halfSize, u_bgParams.z);
    float perlin = texturePerlin(v_texCoord).r;
    sdf += perlin;

    float alpha = normalizeRangeClamped(sdf, m_maxDistortion, m_maxDistortion + m_depthEdgeTol);
    float depth = fitRangeClamped(sdf, 1.0, 0.0, 1.0, m_depthMaxDarkness);
    vec3 albedo = depth * textureAlbedo(v_texCoord).xyz;
    outColor = vec4(postProcess(applyLighting(normal, albedo)) * alpha, alpha);
}
