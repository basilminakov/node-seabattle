/*
*	Uses express middleware.
*	To install this you need a file called "package.json" to be within the server folder.
*	File should contain info like this:
	
	{
		"name": "node-test-app",
		"description": "hello world test app",
		"version": "0.0.1",
		"private": true,
		"dependencies": {
			"express": "3.1.0"
		}
	}
	
*	Installation should be started by command "npm install" from the folder with package.json file.
*/
var express = require('express');
var http = require('http');
var app = express();
var info = require('./informer.js');

var gameData = require('./game.js');

var world = new gameData.World();
var gameServ = new gameData.GameServer();


/*Info listener
* Gets the request' parameters. For instance request like "http://localhost/?x=1&y=1&z=1" will return the following:
* 
* GET /?x=1&y=1&z=1 from ip  127.0.0.1
* parameters:  { x: '1', y: '1', z: '1' }
* GET /favicon.ico from ip  127.0.0.1
* parameters:  {}
*/
app.use(function(req, res, next){
  console.log('%s %s from ip %s (hostname: %s)', req.method, req.url, req.ip, req.host);
  console.log('parameters: ', req.query);
  next();
});

app.get('/beerkoding/shoot', function(req, res){
    var p = req.query;
    if ((p.x < 0 || p.x >=230) || (p.y < 0 || p.y >=230)) {
        res.send(0);
        return;
    }
    var ip = req.ip;
    var result = world.we.shot(world.enemy[ip], p.x, p.y);
    res.send(result);
});

app.get('/beerkoding/spy', function(req, res){
    if (world.we.isAlive) {
        var p = req.query;
        res.send(1);
    } else {
        res.send(3);
    }
});

app.get('/map', function(req, res) {
    info.showMap(req, res, world.we.field);
});

app.get('/status',function(req, res) {
    info.showStatus(req, res, world.we);
});

app.get('/enemies',function(req, res) {
    info.showEnemies(req, res, null);
});

console.log("fdsafhdf");
//app.listen(80);
app.listen(3000);


