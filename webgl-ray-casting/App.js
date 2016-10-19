
var app;
var output;

var App = function(canvas, output)
{
	this.canvas = canvas;

	this.gl = canvas.getContext("experimental-webgl");
	if(this.gl == null) {
		output.textContent = ">>> No WebGL support <<<";
		return;
	}

	this.canvas.width = 900;
	this.canvas.height = 900;

	this.quad = new Quad(this);

	this.camera = new Camera();
}

function start()
{
	var canvas = document.getElementById("container");
	output = document.getElementById("output");
	app = new App(canvas, output);

	document.addEventListener('mozpointerlockchange', function(event){  app.pointerLockChange(event); }, false);
	canvas.onclick = function(event) { app.clicked(event); } ;
	document.onkeydown = function(event){  app.keyDown(event); };
	document.onkeyup = function(event){  app.keyUp(event); };
	document.onmousemove = function(event){  app.mouseMove(event); };
}


lastTime = new Date();
App.prototype.update = function() {
	
	this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

	this.gl.clearColor(0.6, 0.0, 0.3, 1.0);
	this.gl.clearDepth(1.0);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

	time = new Date();
	dt = (time - lastTime) / 1000.0;
	lastTime = time;

	this.camera.update(dt);

	this.quad.draw(this.gl, this.camera);

	window.requestAnimationFrame(function() { app.update(); });
	this.ownMouse = true;
};


App.prototype.clicked = function(event) {
	try
	{
		this.canvas.mozRequestPointerLock(); 
	}
	catch(err)
	{
		this.canvas.requestPointerLock();
	}
}
App.prototype.pointerLockChange = function(event) {
	this.ownMouse = (this.canvas == document.mozPointerLockElement); 
}

App.prototype.keyDown = function(event) {
	if (!this.ownMouse) return;
	if(keyboardMap[event.keyCode] == 'R')
	{
		if(this.quad.depth <= 0.95)
		{
			this.quad.depth += 0.05;
		}
	}
	else if(keyboardMap[event.keyCode] == 'F')
	{
		if(this.quad.depth >= 0.05)
		{
			this.quad.depth -= 0.05;
		}
	}
	else if(keyboardMap[event.keyCode] == 'O')
	{
		this.quad.toggleOpacityCast();
	}
	else
	{
		this.camera.keydown(event.keyCode);
	}
}
App.prototype.keyUp = function(event) {
	if (!this.ownMouse)  return;
	this.camera.keyup(event.keyCode);      
}
App.prototype.mouseMove = function(event) {
	if (!this.ownMouse) return;
	this.camera.mouseDelta.add( new Vector2(event.movementX, event.movementY));
	event.preventDefault();  
}
