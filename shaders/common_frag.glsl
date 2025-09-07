uniform vec3  u_lightDir;
uniform vec3  u_ambientColor;
uniform vec3  u_diffuseColor;
uniform vec4  u_specularParams;

uniform sampler2D u_texture;
uniform vec2 u_texelSize;

uniform sampler2D u_perlinTexture;
uniform vec2 u_perlinTexelSize;
uniform vec4 u_perlinControls;

uniform sampler2D u_grainyTexture;
uniform vec2 u_grainyTexelSize;
uniform vec4 u_grainyControls;

uniform sampler2D u_albedoTexture;
uniform vec2 u_albedoTexelSize;
uniform vec4 u_albedoControls;

uniform sampler2D u_lutTexture;
uniform vec4 u_lutControls;

uniform vec4 u_miscParams;

#define m_maxDistortion u_perlinControls.y
#define m_aspectRatio vec2(u_miscParams.x, 1.0)
#define m_depthEdgeTol u_miscParams.y
#define m_depthPower u_miscParams.z
#define m_depthMaxDarkness u_miscParams.w

vec3 applyLighting(vec3 normal, vec3 baseColor) {
    vec3 L = normalize(u_lightDir);
    vec3 V = vec3(0.0, 0.0, 1.0);

    float diff = max(dot(normal, L), 0.0);
    vec3 diffuse = u_diffuseColor * diff;

    vec3 H = normalize(L + V);
    float spec = pow(max(dot(normal, H), 0.0), u_specularParams.w);
    vec3 specular = u_specularParams.xyz * spec;

    return u_ambientColor + baseColor * diffuse + specular;
}

vec3 postProcess(vec3 color) {
    color = clamp(color, 0.0, 1.0);
    vec3 scaledc = color * u_lutControls.x;
    vec2 uv;

    vec3 leftc = floor(scaledc) * u_lutControls.y;
    uv.x = leftc.b * u_lutControls.z + leftc.r * u_lutControls.w;
    uv.y = leftc.g;
    vec3 left = texture(u_lutTexture, uv).rgb;

    vec3 rightc = ceil(scaledc) * u_lutControls.y;
    uv.x = rightc.b * u_lutControls.z + rightc.r * u_lutControls.w;
    uv.y = rightc.g;
    vec3 right = texture(u_lutTexture, uv).rgb;

    color = mix(left, right, fract(color * u_lutControls.x));
    return color;
}

vec2 gradientFromTexture(sampler2D tex, vec2 uv, vec2 texelSize, float freq, float amp, vec2 offset) {
    float h00 = texture(tex, offset + freq * (uv + texelSize * vec2(-1, -1))).r;
    float h10 = texture(tex, offset + freq * (uv + texelSize * vec2( 0, -1))).r;
    float h20 = texture(tex, offset + freq * (uv + texelSize * vec2( 1, -1))).r;

    float h01 = texture(tex, offset + freq * (uv + texelSize * vec2(-1,  0))).r;
    float h21 = texture(tex, offset + freq * (uv + texelSize * vec2( 1,  0))).r;

    float h02 = texture(tex, offset + freq * (uv + texelSize * vec2(-1,  1))).r;
    float h12 = texture(tex, offset + freq * (uv + texelSize * vec2( 0,  1))).r;
    float h22 = texture(tex, offset + freq * (uv + texelSize * vec2( 1,  1))).r;

    float dx = amp * (
        -1.0 * h00 + 1.0 * h20 +
        -2.0 * h01 + 2.0 * h21 +
        -1.0 * h02 + 1.0 * h22);

    float dy = amp * (
        -1.0 * h00 + -2.0 * h10 + -1.0 * h20 +
         1.0 * h02 +  2.0 * h12 +  1.0 * h22);

    return vec2(-dx, -dy);
}

vec2 gradientPerlin(vec2 uv) {
    return gradientFromTexture(u_perlinTexture, uv, u_perlinTexelSize, u_perlinControls.x, u_perlinControls.y, u_perlinControls.zw);
}

vec2 gradientGrainy(vec2 uv) {
    return gradientFromTexture(u_grainyTexture, uv, u_grainyTexelSize, u_grainyControls.x, u_grainyControls.y, u_grainyControls.zw);
}

vec4 texturePerlin(vec2 uv) {
    return u_perlinControls.y * (texture(u_perlinTexture, u_perlinControls.zw + u_perlinControls.x * uv) * 2.0 - 1.0);
}

vec4 textureGrainy(vec2 uv) {
    return u_grainyControls.y * (texture(u_grainyTexture, u_grainyControls.zw + u_grainyControls.x * uv) * 2.0 - 1.0);
}

vec4 textureAlbedo(vec2 uv) {
    return u_albedoControls.y * texture(u_albedoTexture, u_albedoControls.zw + u_albedoControls.x * uv);
}

float normalizeRange(float x, float x0, float x1) {
    return (x - x0) / (x1 - x0);
}

float normalizeRangeClamped(float x, float x0, float x1) {
    return clamp(normalizeRange(x, x0, x1), 0.0, 1.0);
}

float fitRange(float x, float x0, float x1, float X0, float X1) {
    float X = normalizeRange(x, x0, x1);
    return mix(X0, X1, X);
}

float fitRangeClamped(float x, float x0, float x1, float X0, float X1) {
    float X = normalizeRangeClamped(x, x0, x1);
    return mix(X0, X1, X);
}

float fitRange(float x, float x0, float x1) {
    return mix(x0, x1, x);
}

float fitRangeClamped(float x, float x0, float x1) {
    return clamp(mix(x0, x1, x), 0.0, 1.0);
}

in vec2 v_texCoord;
out vec4 outColor;

