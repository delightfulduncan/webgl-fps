// -----------------------------
// Basic WebGL setup
// -----------------------------
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

if (!gl) {
    alert("WebGL not supported.");
}

// Clear color
gl.clearColor(0.5, 0.7, 1.0, 1.0);

// -----------------------------
// Camera variables
// -----------------------------
let camX = 0, camY = 1.8, camZ = 5;
let yaw = 0, pitch = 0;
let keys = {};

// Movement speed
const SPEED = 0.05;
const SENSITIVITY = 0.002;

// -----------------------------
// Input handling
// -----------------------------
document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

canvas.requestPointerLock =
    canvas.requestPointerLock ||
    canvas.mozRequestPointerLock;

canvas.onclick = () => {
    canvas.requestPointerLock();
};

document.addEventListener("mousemove", e => {
    if (document.pointerLockElement === canvas) {
        yaw -= e.movementX * SENSITIVITY;
        pitch -= e.movementY * SENSITIVITY;

        // Limit look up/down
        pitch = Math.max(-1.5, Math.min(1.5, pitch));
    }
});

// -----------------------------
// Very simple shader programs
// -----------------------------
const vsSource = `
attribute vec3 aPosition;
uniform mat4 uMatrix;
void main() {
    gl_Position = uMatrix * vec4(aPosition, 1.0);
}
`;

const fsSource = `
precision mediump float;
void main() {
    gl_FragColor = vec4(0.3, 0.9, 0.3, 1.0);
}
`;

// Shader compiler
function makeShader(type, source) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, source);
    gl.compileShader(sh);
    return sh;
}

const vs = makeShader(gl.VERTEX_SHADER, vsSource);
const fs = makeShader(gl.FRAGMENT_SHADER, fsSource);

// Link program
const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

// -----------------------------
// Ground plane geometry
// -----------------------------
const ground = new Float32Array([
    -50, 0, -50,
     50, 0, -50,
     50, 0,  50,
    -50, 0,  50
]);

const indices = new Uint16Array([0,1,2, 2,3,0]);

// Buffer
const posBuf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
gl.bufferData(gl.ARRAY_BUFFER, ground, gl.STATIC_DRAW);

const indexBuf = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// Attribute setup
const aPosition = gl.getAttribLocation(program, "aPosition");
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

// Matrix uniform
const uMatrix = gl.getUniformLocation(program, "uMatrix");

// -----------------------------
// Math helpers
// -----------------------------
function degToRad(d) { return d * Math.PI / 180; }

function updateMovement() {
    let forward = 0;
    let right = 0;

    if (keys["w"]) forward += 1;
    if (keys["s"]) forward -= 1;
    if (keys["a"]) right -= 1;
    if (keys["d"]) right += 1;

    // Calculate direction
    const sinY = Math.sin(yaw);
    const cosY = Math.cos(yaw);

    camX += (forward * cosY - right * sinY) * SPEED;
    camZ += (forward * sinY + right * cosY) * SPEED;
}

// -----------------------------
// Render loop
// -----------------------------
function render() {
    updateMovement();

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.enable(gl.DEPTH_TEST);

    // Build projection + camera matrix manually
    let aspect = canvas.width / canvas.height;
    let fov = Math.PI / 3;
    let near = 0.1;
    let far = 1000;

    // Simple perspective matrix
    let f = 1 / Math.tan(fov / 2);
    let proj = [
        f/aspect, 0, 0,                       0,
        0,        f, 0,                       0,
        0,        0, (far+near)/(near-far),  -1,
        0,        0, (2*far*near)/(near-far), 0
    ];

    // Camera rotation
    let cy = Math.cos(yaw), sy = Math.sin(yaw);
    let cp = Math.cos(pitch), sp = Math.sin(pitch);

    let view = [
        cy, sy*sp, sy*cp, 0,
        0,   cp,   -sp,   0,
        -sy, cy*sp, cy*cp, 0,
        0,0,0,1
    ];

    // Apply camera position
    view[12] = -(camX*view[0] + camY*view[4] + camZ*view[8]);
    view[13] = -(camX*view[1] + camY*view[5] + camZ*view[9]);
    view[14] = -(camX*view[2] + camY*view[6] + camZ*view[10]);

    // Multiply proj * view
    let matrix = new Float32Array(16);
    for (let r=0; r<4; r++)
        for (let c=0; c<4; c++)
            matrix[r*4+c] =
                proj[r*4+0]*view[c+0] +
                proj[r*4+1]*view[c+4] +
                proj[r*4+2]*view[c+8] +
                proj[r*4+3]*view[c+12];

    gl.uniformMatrix4fv(uMatrix, false, matrix);

    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
}

render();
