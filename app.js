
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , gameData = require('./public/js/game.js');

var app = express(),
    db = redis.createClient();

db.on("error", function (err) {
    console.log("Error: " + err);
});
db.flushdb();
db.set("spycount", "0");

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var world = new gameData.World(
    '192.168.80.251', // this server ip
    [ // array of enemy ips
        '192.168.80.246',
        '192.168.80.250',
        '192.168.30.105',
        '192.168.80.244',
        '192.168.80.247',
        '192.168.80.245'
    ]
);
var gameServ = new gameData.GameServer();

app.get('/', routes.index);

// app.get('/beerkoding/shoot', function(req, res){
app.get('/shoot', function(req, res){
    var p = req.query;
    if ((p.x < 0 || p.x >=230) || (p.y < 0 || p.y >=230)) {
        res.send(0);
        return;
    }
    var ip = req.ip;
    var result = world.we.shot(world.enemy[ip], p.x, p.y);
    res.send(result);
});

// app.get('/beerkoding/spy', function(req, res){
app.get('/spy', function(req, res){
    var p = req.query;
    db.hset('spy', req.ip, true, function(err) {
        if (!err) {
          db.hkeys('spy', function(err, value) {
            if (!err) {
              console.log("Value: ", value);
            }
          });
        }
    });
    db.incr('spycount');
    if (world.we.isAlive) {
        res.send(1);
    } else {
        res.send(3);
    }
});

app.get('/spyinfo', function(req, res) {
  var result = {};
  db.hkeys('spy', function(err, value) {
    if (!err) {
      result.data = value;
    }
  });
  db.get('spycount', function(err, value) {
    if (!err) {
      result.count = value;
    }
    routes.spy(req, res, result.data || [], result.count || 0);
  });
});

app.get('/map', function(req, res) {
    routes.map(req, res, world.getField());
});

app.get('/status', function(req, res) {
    routes.status(req, res, world.getServerObject());
});

app.get('/enemies', function(req, res) {
    routes.enemies(req, res, world.getEnemies());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});