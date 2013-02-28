/**
 * Created with JetBrains WebStorm.
 * User: michael
 * Date: 2/1/13
 * Time: 3:38 PM
 * To change this template use File | Settings | File Templates.
 */

var SIZE = 230;
var TOTAL_HEALTH = 600;

function Game(ip, owner) {

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
        this.layout();
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

Game.prototype.layout = function() {
    var ships = TOTAL_HEALTH;
    var cells = 1; //40
    var i = 0;
    var j = 0;
    var tmp = [];

    while (i < ships -1) {
        var x = Math.floor(Math.random() * SIZE);
        var y = Math.floor(Math.random() * SIZE);
        if (x - cells < 0) {
            x += cells;
        }
        if (x + cells > SIZE) {
            x -= cells;
        }
        if (y - cells < 0) {
            y += cells;
        }
        if (y + cells > SIZE) {
            y -= cells;
        }
		if (this.field[x][y] != 0) {
			continue;
		};
        this.field[x][y] = 1;
        i++;
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


function World() {
    this.we = new Game( '192.168.80.251', true );

    var enemies = [
        '192.168.80.246',
        '192.168.80.250',
        '192.168.30.105',
        '192.168.80.244',
        '192.168.80.247',
        '192.168.80.245'
    ];

    this.they = {};
    for (var i = 0; i < enemies.length; i++) {
        this.they[enemies[i]] = new Game(enemies[i]);
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
