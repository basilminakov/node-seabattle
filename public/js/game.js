/**
 * Created with JetBrains WebStorm.
 * User: michael
 * Date: 2/1/13
 * Time: 3:38 PM
 * To change this template use File | Settings | File Templates.
 */

var SIZE = 230;
var TOTAL_HEALTH = 600;

function Game(ip, owner, conf) {

    this.ip = ip;
    this.field = [];
    for (var i = 0; i < SIZE; i++) {
        var row = [];
        for (var j = 0; j < SIZE; j++) {
            row[j] = 0;
        }
        this.field[i] = row;
    }

    this.isAlive = true;
    this.timeOfDeath = null;
    this.shootCount = 0;
    this.spyReqCount = 0;
    this.shotReqCount = 0;
    this.hitCount = 0;

    if (owner) {
        this.layout(conf);
    }

};

Game.prototype.getIp = function() {
    return this.ip;
};

Game.prototype.stat = function(x, y) {
    if (x < 0 || x >= SIZE) {
        return 0;
    }
    if (y < 0 || y >= SIZE) {
        return 0;
    }
    return this.field[x][y];
};

Game.prototype.layout = function(conf) {
    var ships = TOTAL_HEALTH;
    var cells = 1; //40
    var count = 0;
    var tmp = [];
    var len = conf.length;
    while (count < len) {
        var coord = conf[count];
        var x = coord.x + coord.w;
        var y = coord.y + coord.h;
        for (var i = coord.x; i < x; i++) {
            for (var j = coord.y; j < y; j++) {
                this.field[i][j] = 1;
            }
        }
        count++;
    }
};

function Player() {

};

Player.prototype.shot = function(enemy, x, y) {
    if (! this.isAlive) {
        return 3;
    }
    var stat = this.stat(x, y);
    if (stat == 1) {
        this.field[x][y] = 2;

        if (++this.hitCount == TOTAL_HEALTH) {
            this.isAlive = false;
            this.timeOfDeath = new Date();
            return 3;
        }
    }
    return stat;
};

Player.prototype.nextShot = function(enemies) {

    var liveEnemies = [];
    var burningEnemies = [];

    enemies.forEach(function(enemy) {
        if (enemy.isAlive) {
            if (enemy.nextTargets.length > 0) {
                burningEnemies.append(enemy);
            } else {
                liveEnemies.append(enemy);
            }
        }
    });

    burningEnemies.forEach(function(enemy) {
        enemy.nextTargets.forEach(function(target) {
            gameServer.shoot(enemy, target[0], target[1], this.shootCallback);
        });
    });

    liveEnemies.forEach(function(enemy) {
        enemy.nextTry().forEach(function(target) {
            gameServer.shoot(enemy, target[0], target[1], this.shootCallback);
        });
    });

};

Player.prototype.shootCallback = function(enemy, x, y, stat) {
    if (stat == 3) {
        enemy.isAlive = false;
        return;
    }

    enemy.set(x, y, stat);
    if (stat == 1 || stat == 2) {
        var nextTargets = enemy.nextTargets(x, y);
        nextTargets.forEach(function(target) {
            gameServer.shoot(enemy, target[0], target[1], this.shootCallback);
        });
    } else if (stat == 0) {
        var nextTry = enemy.nextTry();
        nextTry.forEach(function(target) {
            gameServer.shoot(enemy, nextTry[0], nextTry[1], this.shootCallback);
        });
    }
};

function Enemy() {
    this.nextTargets = {};

    this.x = 0;
    this.y = 0;
    this.unknownCount = SIZE * SIZE;
};

Enemy.prototype.set = function(x, y, stat) {
    this.field[x][y] = stat;
    --this.unknownCount;
};


Enemy.prototype.nextTargets = function(x, y) {
    var nextTargets = [];
    for (var i = x - 1; i < x + 1; i++) {
        for (var j = y - 1; j < y + 1; j++) {
            var stat = this.stat(i, j);
            if (stat == -1) {
                nextTargets.append( [x, y] );
            }
        }
    }
    return nextTarget;
};

Enemy.prototype.nextTry = function() {
    while (this.isAlive && this.unknownCount > 0) {
        var next = [ this.x, this.y ];
        var stat = this.stat( this.x, this.y );
        if (++this.x >= SIZE) {
            this.x -= SIZE;
            ++this.y;
        }
        if (stat != -1) {
            return next;
        }
    }
    return null;
};


function World(/*Ip*/baseIp, /*Array of Ip*/enemyIPs, conf) {
    this.we = new Game( baseIp || "127.0.0.1", true , conf);

    this.they = {};
    for (var i = 0; i < enemyIPs.length; i++) {
        this.they[enemyIPs[i]] = new Game(enemyIPs[i]);
    }

    this.start = function() {

    }
};

World.prototype.getField = function() {
    return this.we.field || [[]];
};

World.prototype.getEnemies = function() {
    return this.they || {};
};

World.prototype.getServerObject = function() {
    return this.we || {};
};

function GameServer() {
    /*this.shoot(Game, x, y, callback)
    this.spy(Game target, x, y, callback);

    var result = we.shot(Game enemy, x, y);
    var result = we.spied(Game friend, Game target, x, y)*/
};

exports.GameServer = GameServer;
exports.World = World;
