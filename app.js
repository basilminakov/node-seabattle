
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , redis = require('redis')
  , fs = require('fs')
  , seabattle = require('./public/js/seabattle.js')
  , app = express()
  , db = redis.createClient()
  , WebSocketServer = require('websocket').server
  , wsServer = null
  , argv = require('optimist').argv;

process.on('exit', function () {
    db.close();
});

db.on('error', function (err) {
    console.log('Error: ' + err);
});
db.flushdb();
db.set('spycount', '0');
db.set('hitcount', '0');

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
  // Settings from command line
  app.set('port', argv.port || 3000);
  app.set('config file', argv.config || 'conf.cfg');
  db.select(argv.db || 0);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/*
fs.readFile('./public/data/' + app.get('config file'), 'utf8', function(err, data) {
    world = new gameData.World(
        '192.168.80.251', // this server ip
        [ // array of enemy ips
            '192.168.80.246',
            '192.168.80.250',
            '192.168.30.105',
            '192.168.80.244',
            '192.168.80.247',
            '192.168.80.245'
        ],
        eval(data)
    )}
);
*/

var game = new seabattle.Game({
    fieldSize: 10,
    playerHealth: 30,
    shipCount: 6,
    playerAddress: '127.0.0.1:' + app.get('port'),
    enemyAddress: '127.0.0.1:' + (app.get('enemyPort') || 3010)
});
//game.on('shotLanded', function(shot) {
//    console.log('game.shotLanded: ', shot.x, shot.y, shot.result);
//});

game.player.on('shotFired', function(shot) {
    console.log('player.shotFired', shot.x, shot.y);
});
game.player.on('shotTaken', function(shot) {
    console.log('player.shotTaken', shot.x, shot.y, shot.result);
});

game.enemy.on('shotTaken', function(shot) {
    console.log('enemy.shotTaken', shot.x, shot.y, shot.result);
});

game.player.on('died', function(death) {
    console.log('player.died');
});
game.enemy.on('died', function(death) {
    console.log('enemy.died');
});

app.get('/', routes.index);

// app.get('/beerkoding/shoot', function(req, res){
app.get('/shoot', function(req, res){
    var result = game.takeShot(req);
    db.incr('hitcount');
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
    if (game.player.isAlive) {
        res.send(seabattle.HIT);
    } else {
        res.send(seabattle.DEAD);
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
    routes.map(req, res, game);
});

app.post('/map', function(req, res) {
    console.log('starting...');
    game.run();
    console.log('redirecting to ' + req.url)
    res.redirect(req.url);
});


app.get('/status', function(req, res) {
    routes.status(req, res, game);
});

app.get('/enemies', function(req, res) {
    routes.enemies(req, res, game.enemies);
});

var httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

wsServer = new WebSocketServer({
  httpServer: httpServer
});
