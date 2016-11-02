
function initTextures(app) {
  texture = app.gl.createTexture();
  image = new Image();
  image.onload = function() { handleTextureLoaded(app.gl, image, texture); }
  //image.src = "brain-at_1024.jpg";
  image.src = "brain-at_4096.jpg";
  // image.src = "body-at_4096.jpg";
  //image.src = "aorta4096.png";
  return texture;
}

function handleTextureLoaded(gl, image, texture) {

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.bindTexture(gl.TEXTURE_2D, null);
  window.requestAnimationFrame(function (){ app.update();}); // remove this from start()
}

var Quad = function(app)
{
	this.volume = initTextures(app);
	gl = app.gl;

	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array([
			-1.0, -1.0,
			-1.0, +1.0,
			+1.0, -1.0,
			+1.0, +1.0]),
		gl.STATIC_DRAW);

	this.depth = 0.2;
	this.opacityCast = 1;

	this.vertexBuffer.itemSize = 2;
	this.vertexBuffer.numItems = 4;

	this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(this.vertexShader, vsQuadSrc);

	gl.compileShader(this.vertexShader);
	output.textContent += gl.getShaderInfoLog(this.vertexShader);

	this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(this.fragmentShader, fsTraceSrc);
	gl.compileShader(this.fragmentShader);
	output.textContent += gl.getShaderInfoLog(this.fragmentShader); 

	
	this.program = gl.createProgram();

	gl.attachShader(this.program, this.vertexShader);
	gl.attachShader(this.program, this.fragmentShader);
	gl.linkProgram(this.program);
	output.textContent += gl.getProgramInfoLog(this.program);

	this.volumeLocation = gl.getUniformLocation(this.program,'volume');

	this.positionAttributeIndex = gl.getAttribLocation(this.program, 'vPosition');

	this.viewDirMatrixLocation = gl.getUniformLocation(this.program,'viewDirMatrix');
	this.eyeLocation = gl.getUniformLocation(this.program,'eye');

	this.depthLocation = gl.getUniformLocation(this.program, 'depth');
	this.opacityCastLocation = gl.getUniformLocation(this.program, 'opacityCast');

}

Quad.prototype.setDepth = function(value)
{
	this.depth = value;
}

Quad.prototype.toggleOpacityCast = function()
{
	this.opacityCast = !(this.opacityCast);
}

Quad.prototype.draw = function(gl, camera) {
	gl.useProgram(this.program);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.enableVertexAttribArray(this.positionAttributeIndex);

	gl.vertexAttribPointer(this.positionAttributeIndex,
		2, gl.FLOAT,
		false, 8,
		0);

	viewDirMatrixData = new Float32Array(16);
	camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);
	gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);

	gl.uniform3f(this.eyeLocation, camera.position.x, camera.position.y, camera.position.z);
	gl.uniform1f(this.depthLocation, this.depth);

	var value = (this.opacityCast ? 1 : 0);
	gl.uniform1i(this.opacityCastLocation, value);

	gl.uniform1i(this.volumeLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, this.volume);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,
        gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER, gl.LINEAR);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};
