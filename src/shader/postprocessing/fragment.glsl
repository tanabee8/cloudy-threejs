uniform sampler2D uRenderTexture;
uniform sampler2D uRippleTexture;
varying vec2 vUv;

void main() {
    vec2 uv = vUv;

    vec4 tex = texture2D(uRippleTexture, uv);
    float vx = -(tex.r *2. - 1.);
    float vy = -(tex.g *2. - 1.);
    float intensity = tex.b;
    uv.x += vx * 0.2 * intensity;
    uv.y += vy * 0.2 * intensity;

    gl_FragColor = texture2D(uRenderTexture, uv);
}