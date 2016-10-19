
var Camera = function(gl)
{
	this.position = new Vector3(0.0, 0.0, -1.0);
	this.ahead = new Vector3(0.0, 0.0, 1.0);
	this.right = new Vector3(1.0, 0.0, 0.0);

	this.yaw = 0.0;
	this.pitch = 0.0;

	this.phi = 0.0;
	this.theta = 0.0;
	this.radius = 1.0;

	this.fov = 0.5;
	this.aspect = 1.0;
	this.nearPlane = 0.1;
	this.farPlane = 1000.0;

	this.speed = 0.5;

	this.lastMousePosition = new Vector2(0.0, 0.0);
	this.mouseDelta = new Vector2(0.0, 0.0);

	this.wPressed = false;
	this.aPressed = false;
	this.sPressed = false;
	this.dPressed = false;
	this.qPressed = false;
	this.ePressed = false;

	var lookAt = new Vector3(0.0, 0.0, 0.0);

	this.viewMatrix = makeViewMatrix(this.position,  lookAt, new Vector3(0.0, 1.0, 0.0));
	this.projMatrix = makePerspectiveMatrix(this.fov,  this.aspect,          this.nearPlane, this.farPlane).transpose();

	this.viewDirMatrix = makeViewMatrix(new Vector3(0.0, 0.0, 0.0), this.ahead, new Vector3(0.0, 1.0, 0.0));
	this.viewDirMatrix.multiply(this.projMatrix);
	this.viewDirMatrix.invert();
}

Camera.prototype.keydown = function(keyCode) {
	if(keyboardMap[keyCode] == 'W') this.wPressed = true;
	if(keyboardMap[keyCode] == 'A') this.aPressed = true;
	if(keyboardMap[keyCode] == 'S') this.sPressed = true;
	if(keyboardMap[keyCode] == 'D') this.dPressed = true;
	if(keyboardMap[keyCode] == 'E') this.ePressed = true;
	if(keyboardMap[keyCode] == 'Q') this.qPressed = true;
}

Camera.prototype.keyup = function(keyCode) {
	if(keyboardMap[keyCode] == 'W') this.wPressed = false;
	if(keyboardMap[keyCode] == 'A') this.aPressed = false;
	if(keyboardMap[keyCode] == 'S') this.sPressed = false;
	if(keyboardMap[keyCode] == 'D') this.dPressed = false;
	if(keyboardMap[keyCode] == 'E') this.ePressed = false;
	if(keyboardMap[keyCode] == 'Q') this.qPressed = false;
}

Camera.prototype.update = function(dt) {

	// this.yaw += this.mouseDelta.x * -0.002;
	// this.pitch += this.mouseDelta.y * 0.002;
	// if(this.pitch > 3.14/2.0)
	// 	this.pitch = 3.14/2.0;
	// if(this.pitch < -3.14/2.0)
	// 	this.pitch = -3.14/2.0;

	// this.mouseDelta = new Vector2(0.0, 0.0);
	// this.ahead = new Vector3( Math.sin(this.yaw)*Math.cos(this.pitch), -Math.sin(this.pitch), 
	// 						  Math.cos(this.yaw)*Math.cos(this.pitch) );
	this.right = this.ahead.cross( new Vector3(0.0, -1.0, 0.0) );
	this.right.normalize(); 

	// var up = new Vector3(0, 1, 0);

	if(this.wPressed)
	{
		this.theta += this.speed * dt * 3.1415;
		if(this.theta > 3.1415)
		{
			this.theta -= 3.1415;
		}
	}
	
	if(this.sPressed)
	{
		this.theta -= this.speed * dt * 3.1415;
		if(this.theta < 0.0)
		{
			this.theta += 3.1415;
		}
	}
	
	if(this.aPressed)
	{
		this.phi -= this.speed * dt * 3.1415;
		if(this.phi < 0.0)
		{
			this.phi += 3.1415;
		}
	}
	
	if(this.dPressed)
	{
		this.phi += this.speed * dt * 3.1415;
		if(this.phi > 3.1415)
		{
			this.phi -= 3.1415;
		}
	}
	
	if(this.qPressed)
	{
		this.radius -= this.speed * dt;
	}
	
	if(this.ePressed)
	{
		this.radius += this.speed * dt;
	}

	var eyeX = this.radius * Math.cos(this.theta) * Math.sin(this.phi);
	var eyeY = this.radius * Math.sin(this.theta) * Math.sin(this.phi);
	var eyeZ = this.radius * Math.cos(this.phi);

	this.position.x = eyeX;
	this.position.y = eyeY;
	this.position.z = eyeZ;

	var lookAt = new Vector3(0.0, 0.0, 0.0);
	// var lookAt =  this.position.clone();
	// lookAt.add(this.ahead);

	console.log("-------------");
	console.log(this.position.x, this.position.y, this.position.z);
	console.log(lookAt.x, lookAt.y, lookAt.z);
	console.log(this.theta, this.phi, this.radius);
	
	this.viewMatrix = makeViewMatrix(this.position,  lookAt,  new Vector3(0.0, 1.0, 0.0)).transpose();

	this.viewDirMatrix = makeViewMatrix(new Vector3(0.0, 0.0, 0.0),  this.ahead,  new Vector3(0.0, 1.0, 0.0)).transpose();
	this.viewDirMatrix.multiply(this.projMatrix);
	this.viewDirMatrix.invert();

}