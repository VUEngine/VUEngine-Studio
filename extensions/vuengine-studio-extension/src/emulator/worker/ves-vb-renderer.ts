/**
 * Presentation for one simulation.
 *
 * The core composites into a single eye-packed framebuffer, where the red
 * channel carries the left eye's brightness and the green channel the right
 * eye's. Every display mode is derived from that one texture by the fragment
 * shader below, so switching modes or palettes costs a handful of uniforms and
 * never touches emulation.
 *
 * Runs on the worker's OffscreenCanvas, so frames never cross to the DOM
 * thread.
 */

import {
    VbDisplayMode,
    VbEyes,
    VbStereoLayout,
    VB_LEVEL_STOPS,
    VB_LEVELS,
    VB_SCREEN_HEIGHT,
    VB_SCREEN_WIDTH,
} from '../common/ves-vb-constants';

const VERTEX_SHADER = `#version 300 es
// Fullscreen triangle, generated from the vertex id so no buffers are needed.
void main() {
    vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform sampler2D uFrame;
// The palette's colour for each brightness level, used wherever a pixel shows
// one eye on its own.
uniform vec3 uPalette[${VB_LEVELS}];
// The anaglyph tints, used where both eyes share a pixel.
uniform vec3 uAnaglyphLeft;
uniform vec3 uAnaglyphRight;
uniform vec2 uOutput;
uniform int uLayout;
uniform int uEyes;

out vec4 fragColor;

const vec2 SOURCE = vec2(${VB_SCREEN_WIDTH}.0, ${VB_SCREEN_HEIGHT}.0);
const float CYBERSCOPE_HALF = 256.0;
// The eye value that stands for "both eyes at this pixel", i.e. VbEyes.BOTH.
const float ANAGLYPH = ${VbEyes.BOTH}.0;
// Brightnesses the four palette colours are anchored at, see VB_LEVEL_STOPS.
const float STOP1 = ${VB_LEVEL_STOPS[1].toFixed(6)};
const float STOP2 = ${VB_LEVEL_STOPS[2].toFixed(6)};
const float STOP3 = ${VB_LEVEL_STOPS[3].toFixed(6)};

/**
 * The palette colour a brightness stands for. Exactly a palette entry at the
 * stops, interpolated in between, and held at the brightest entry above them.
 */
vec3 shade(float brightness) {
    if (brightness <= STOP1) {
        return mix(uPalette[0], uPalette[1], brightness / STOP1);
    }
    if (brightness <= STOP2) {
        return mix(uPalette[1], uPalette[2], (brightness - STOP1) / (STOP2 - STOP1));
    }
    return mix(uPalette[2], uPalette[3], min((brightness - STOP2) / (STOP3 - STOP2), 1.0));
}

void main() {
    // Integer pixel coordinates with the origin at the top left, matching the
    // row order the core writes its framebuffer in.
    float px = floor(gl_FragCoord.x);
    float py = floor(uOutput.y - gl_FragCoord.y);

    vec2 src;
    // Which eye this pixel belongs to: 0 the left one, 1 the right one. The
    // split layouts derive it from the position, the overlay from the mode.
    float eye;

    if (uLayout == ${VbStereoLayout.OVERLAY}) {
        src = vec2(px, py);
        eye = float(uEyes);
    } else if (uLayout == ${VbStereoLayout.SIDE_BY_SIDE}) {
        eye = step(SOURCE.x, px);
        src = vec2(px - eye * SOURCE.x, py);
    } else if (uLayout == ${VbStereoLayout.CYBERSCOPE}) {
        eye = step(CYBERSCOPE_HALF, px);
        src = vec2((px - eye * CYBERSCOPE_HALF) * (SOURCE.x / CYBERSCOPE_HALF), py);
    } else if (uLayout == ${VbStereoLayout.HLI}) {
        eye = mod(py, 2.0);
        src = vec2(px, floor(py * 0.5));
    } else {
        eye = mod(px, 2.0);
        src = vec2(floor(px * 0.5), py);
    }

    vec4 texel = texture(uFrame, (floor(src) + 0.5) / SOURCE);

    vec3 color;
    if (eye >= ANAGLYPH) {
        // Anaglyph: additive over black, so each tint passes only its filter.
        color = uAnaglyphLeft * texel.r + uAnaglyphRight * texel.g;
    } else {
        color = shade(eye < 0.5 ? texel.r : texel.g);
    }

    fragColor = vec4(min(color, vec3(1.0)), 1.0);
}
`;

/** Split a 0xRRGGBB colour into normalised components. */
function toRgb(color: number): [number, number, number] {
    return [
        ((color >> 16) & 0xff) / 255,
        ((color >> 8) & 0xff) / 255,
        (color & 0xff) / 255,
    ];
}

export class VesVbRenderer {

    protected readonly gl: WebGL2RenderingContext;
    protected readonly texture: WebGLTexture;
    protected readonly uniforms: {
        palette: WebGLUniformLocation | null;
        anaglyphLeft: WebGLUniformLocation | null;
        anaglyphRight: WebGLUniformLocation | null;
        output: WebGLUniformLocation | null;
        layout: WebGLUniformLocation | null;
        eyes: WebGLUniformLocation | null;
    };

    /** Retained so a display mode change can redraw without a new frame. */
    protected lastFrame?: Uint8Array;

    constructor(protected readonly canvas: OffscreenCanvas, mode: VbDisplayMode) {
        // Screenshots read the drawing buffer back after the fact, which is
        // only reliable when it is preserved.
        const gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,
            depth: false,
            preserveDrawingBuffer: true,
            stencil: false,
        });
        if (!gl) {
            throw new Error('Could not acquire a WebGL2 context for the emulator canvas.');
        }
        this.gl = gl;

        const program = this.buildProgram();
        gl.useProgram(program);

        this.uniforms = {
            // An array uniform is set through the location of its first element.
            palette: gl.getUniformLocation(program, 'uPalette[0]'),
            anaglyphLeft: gl.getUniformLocation(program, 'uAnaglyphLeft'),
            anaglyphRight: gl.getUniformLocation(program, 'uAnaglyphRight'),
            output: gl.getUniformLocation(program, 'uOutput'),
            layout: gl.getUniformLocation(program, 'uLayout'),
            eyes: gl.getUniformLocation(program, 'uEyes'),
        };

        const texture = gl.createTexture();
        if (!texture) {
            throw new Error('Could not allocate the emulator frame texture.');
        }
        this.texture = texture;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        // The image is presented at integer scales; anything but nearest
        // filtering would blur a display that has no in-between pixels.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(
            gl.TEXTURE_2D, 0, gl.RGBA, VB_SCREEN_WIDTH, VB_SCREEN_HEIGHT, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, null
        );
        gl.uniform1i(gl.getUniformLocation(program, 'uFrame'), 0);

        this.setDisplayMode(mode);
    }

    setDisplayMode(mode: VbDisplayMode): void {
        const gl = this.gl;
        this.canvas.width = mode.width;
        this.canvas.height = mode.height;
        gl.viewport(0, 0, mode.width, mode.height);

        gl.uniform3fv(this.uniforms.palette, mode.palette.flatMap(toRgb));
        gl.uniform3fv(this.uniforms.anaglyphLeft, toRgb(mode.anaglyph.left));
        gl.uniform3fv(this.uniforms.anaglyphRight, toRgb(mode.anaglyph.right));
        gl.uniform2f(this.uniforms.output, mode.width, mode.height);
        gl.uniform1i(this.uniforms.layout, mode.layout);
        gl.uniform1i(this.uniforms.eyes, mode.eyes);

        if (this.lastFrame) {
            this.draw();
        }
    }

    present(pixels: Uint8Array): void {
        this.lastFrame = pixels;
        const gl = this.gl;
        gl.texSubImage2D(
            gl.TEXTURE_2D, 0, 0, 0, VB_SCREEN_WIDTH, VB_SCREEN_HEIGHT,
            gl.RGBA, gl.UNSIGNED_BYTE, pixels
        );
        this.draw();
    }

    /** Encode the presented frame as a PNG. */
    async capture(): Promise<ArrayBuffer> {
        const blob = await this.canvas.convertToBlob({ type: 'image/png' });
        return blob.arrayBuffer();
    }

    protected draw(): void {
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

    protected buildProgram(): WebGLProgram {
        const gl = this.gl;
        const program = gl.createProgram();
        if (!program) {
            throw new Error('Could not create the emulator shader program.');
        }
        gl.attachShader(program, this.compile(gl.VERTEX_SHADER, VERTEX_SHADER));
        gl.attachShader(program, this.compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Could not link the emulator shader: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

    protected compile(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) {
            throw new Error('Could not create an emulator shader.');
        }
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(`Could not compile the emulator shader: ${gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    }

    dispose(): void {
        this.gl.deleteTexture(this.texture);
        this.lastFrame = undefined;
    }
}
