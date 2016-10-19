
var Quad = function(gl, width, height)
{
	this.vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER,
		new Float32Array([
			-1.0, -1.0,
			-1.0, +1.0,
			+1.0, -1.0,
			+1.0, +1.0]),
		gl.STATIC_DRAW);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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

	this.positionAttributeIndex = gl.getAttribLocation(this.program, 'vPosition');

	this.viewDirMatrixLocation = gl.getUniformLocation(this.program,'viewDirMatrix');
	this.eyeLocation = gl.getUniformLocation(this.program,'eye');
    this.quadricsLocation = gl.getUniformLocation(this.program,'quadrics');
    this.materialsLocation = gl.getUniformLocation(this.program,'materials');
    this.framesElapsedLocation = gl.getUniformLocation(this.program, 'framesElapsed');

    this.textureLocation = gl.getUniformLocation(this.program, 'tex');


    this.quadricData = new Float32Array(16*32);
	this.materialData = new Float32Array(16*4);

	A = this.makeSphere();
	A.copyIntoArray(this.quadricData, 0*16);

	B = this.makeSphere();
	scaler = new Matrix4(0.4, 0.0, 0.0, 0.0,
		  				 0.0, 1.9, 0.0, 0.0,
		  				 0.0, 0.0, 0.5, 0.0,
		  				 0.0, -0.2, 0.0, 1.0);
	B.multiply(scaler);
	scaler.transpose();
	B = scaler.mult(B);
	rotate = new Matrix4();
	rotate.setIdentity();
	rotate.setRotationZ(0.5);
	B.multiply(rotate);
	rotate.transpose();
	B = rotate.mult(B);
	B.copyIntoArray(this.quadricData, 1*16);


	tSp = this.makeSphere();
	translater = new Matrix4(1.0, 0.0, 0.0, 0.0,
							 0.0, 1.0, 0.0, 0.0,
						 	 0.0, 0.0, 1.0, 0.0,
						 	 -2.0, -1.0, -1.0, 1.0);
	tSp.multiply(translater);
	translater.transpose();
	tSp = translater.mult(tSp);
	tSp.copyIntoArray(this.quadricData, 2*16);

	this.makeNoClippingQuadric().copyIntoArray(this.quadricData, 3 * 16);

	tEll = this.makeSphere();
	translater = new Matrix4(2.9, 0.0, 0.0, 0.0,
							 0.0, 2.8, 0.0, 0.0,
						 	 0.0, 0.0, 2.4, 0.0,
						 	 3.4, 1.0, -0.3, 1.0);
	tEll.multiply(translater);
	translater.transpose();
	tEll = translater.mult(tEll);
	tEll.copyIntoArray(this.quadricData, 4*16);

	this.makeNoClippingQuadric().copyIntoArray(this.quadricData, 5 * 16);

    this.materialData[0] = 0.992;
    this.materialData[1] = 1.0;
    this.materialData[2] = 0.0;
    this.materialData[3] = 0.0;

    this.materialData[4] = 0.055;
    this.materialData[5] = 0.184;
    this.materialData[6] = 0.266;
    this.materialData[7] = 0.0;

    this.materialData[8] = 0.055;
    this.materialData[9] = 0.184;
    this.materialData[10] = 0.0;
    this.materialData[11] = 0.0;

	

}

Quad.prototype.makeSphere = function(){
    return new Matrix4( 1.0, 0.0, 0.0, 0.0,
				        0.0, 1.0, 0.0, 0.0,
				        0.0, 0.0, 1.0, 0.0,
				        0.0, 0.0, 0.0,-1.0);
}

Quad.prototype.makeNoClippingQuadric = function() {
	return new Matrix4( 0.0, 0.0, 0.0, 0.0,
				        0.0, 0.0, 0.0, 0.0,
				        0.0, 0.0, 0.0, 0.0,
				        0.0, 0.0, 0.0, 0.0);
};

Quad.prototype.draw = function(gl, camera, width, height)
{
	gl.useProgram(this.program);
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
	gl.enableVertexAttribArray(this.positionAttributeIndex);

	gl.vertexAttribPointer(this.positionAttributeIndex,
		2, gl.FLOAT,
		false, 8,
		0);

	
	gl.uniform1i(this.textureLocation, 0);

	viewDirMatrixData = new Float32Array(16);
	camera.viewDirMatrix.copyIntoArray(viewDirMatrixData, 0);

	gl.uniform1i(this.framesElapsedLocation, camera.framesElapsed);

	gl.uniformMatrix4fv(this.viewDirMatrixLocation, false, viewDirMatrixData);

	gl.uniform3f(this.eyeLocation, camera.position.x, camera.position.y, camera.position.z);


	gl.uniformMatrix4fv(this.quadricsLocation, false, this.quadricData);
    gl.uniform4fv(this.materialsLocation, this.materialData);

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

	// Kirenderelt kép elmentése, így a következő körben lehet átlagolni a pixelértékeket belőle
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGB, 0, 0, width, height, 0);
};