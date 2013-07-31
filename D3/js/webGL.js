 
var gl = null;

function initGL(canvas) {
    try {
        gl = canvas.getContext("experimental-webgl", {
            alpha: false
        });
        gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;
    } catch (e) {}
    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
    }
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}


var shaderProgram;
var shaderVariables = {
    'mMinValue': 0,
    'mMaxValue': 1	
};

function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	shaderProgram.pixelOffset = gl.getUniformLocation(shaderProgram, "pixelOffset");
	
    shaderVariables.mMinValue = gl.getUniformLocation(shaderProgram, "valMin");
    shaderVariables.mMaxValue = gl.getUniformLocation(shaderProgram, "valMax");
	
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotValue = 0.0;

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 250.0, pMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, triangleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
	gl.uniform4f(shaderProgram.pixelOffset, 0., 0., 0., 0.);
	
    gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);

// thicker lines
    gl.uniform4f(shaderProgram.pixelOffset, 1./250., 0., 0., 0.); // one pixel offset = 1./width=1./250.
    gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);
    gl.uniform4f(shaderProgram.pixelOffset, 0., 1./250., 0., 0.);	
    gl.drawArrays(gl.LINES, 0, triangleVertexPositionBuffer.numItems);

}

var lastTime = 0;

function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
        var elapsed = timeNow - lastTime;

        rotValue += (10 * elapsed) / 1000.0;
    }
    lastTime = timeNow;

    var checkRot = document.getElementById("checkRot");
    if (checkRot && checkRot.checked) {
        var newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        mat4.translate(newRotationMatrix, [tx, ty, tz]);
        if (elapsed > 0)
            mat4.rotate(newRotationMatrix, -3.14 / 180. * (elapsed / 100.), [0, 1, 0]);
        mat4.translate(newRotationMatrix, [-tx, -ty, -tz]);
        mat4.multiply(newRotationMatrix, mvMatrix, mvMatrix);
    }
}

function tick() {
    requestAnimFrame(tick);
    drawScene();
    animate();
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;
var mb = 0;

var moonRotationMatrix = mat4.create();
mat4.identity(moonRotationMatrix);

function handleMouseDown(event) {
    mouseDown = true;
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    if (event.button == 2) {
        mb = 2;
    }
    if (event.button == 1) {
        mb = 1;
    }
    event.preventDefault();
}

function handleMouseUp(event) {
    mouseDown = false;
    mb = 0;
}

function handleMouseMove(event) {
    event.preventDefault();
    if (!mouseDown) {
        return false;
    }
    var newX = event.clientX;
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    var deltaY = newY - lastMouseY;
    
    deltaX *= -3.5;
    deltaY *= -3.5;
    
    var newRotationMatrix = mat4.create();
    mat4.identity(newRotationMatrix);

    if (mb == 0) {
        mat4.translate(newRotationMatrix, [-0, -0, -100]);
        mat4.rotate(newRotationMatrix, -3.14 / 180. * (deltaX / 10), [0, 1, 0]);
        mat4.rotate(newRotationMatrix, -3.14 / 180. * (deltaY / 10), [1, 0, 0]);
        mat4.translate(newRotationMatrix, [0, 0, 100]);
    } else {
        if (mb == 1) {
            mat4.translate(newRotationMatrix, [deltaX * 0.25, -deltaY * 0.25, 0]);
            tx += deltaX * 0.25;
            ty -= deltaY * 0.25;
        } else
            mat4.translate(newRotationMatrix, [0, 0, -deltaY * 0.25]);
        tz -= deltaY * 0.25;
    }

    mat4.multiply(newRotationMatrix, mvMatrix, mvMatrix);

    lastMouseX = newX
    lastMouseY = newY;

    return false;
}

function resetView() {
    tx = 0;
    ty = 0;
    tz = -100;
    mat4.identity(mvMatrix);
    mat4.translate(mvMatrix, [-00, -0.0, -100.0]);
    mat4.translate(mvMatrix, [-73.5, -40.5, -51.6]);
}

function webGLStart() {
    var canvas = document.getElementById("canvas3d");


    initGL(canvas);
    initShaders();
    initBuffers();

    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    //gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.DEPTH_TEST);

    //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    //gl.blendFunc(gl.GL_ONE, gl.GL_ONE); 
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    resetView();

    canvas.onmousedown = handleMouseDown;
    canvas.onmouseup = handleMouseUp;
    canvas.onmousemove = handleMouseMove;
    canvas.draggable = false;
    canvas.oncontextmenu = function () {
        return false;
    }
    tick();
}