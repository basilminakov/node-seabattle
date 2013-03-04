var util = require('util'),
    events = require('events'),
    http = require('http');

var MISS = 0,
    HIT = 1,
    WRECK = 2,
    DEAD = 3,
    UNKNOWN = -1,
    FIRING = -2;


// Game Field /////////////////////////////////////////////////////////////////

function GameField(size, initialState) {
    this.size = size;

    this.field = [];
    for (var i = 0; i < size; i++) {
        var col = [];
        for (var j = 0; j < size; j++) {
            col[j] = initialState;
        }
        this.field[i] = col;
    }

    this.isAlive = true;
    this.timeOfDeath = null;
    this.hitCount = 0;
};
util.inherits(GameField, events.EventEmitter);

GameField.prototype.get = function(x, y) {
    if (x < 0 || x >= this.size ||
        y < 0 || y >= this.size)
    {
        return MISS;
    }
    return this.field[x][y];
};

GameField.prototype.set = function(x, y, state) {
    if (x < 0 || x >= this.size ||
        y < 0 || y >= this.size)
    {
        return MISS;
    }
    var prev = this.field[x][y];
    this.field[x][y] = state;
    return prev;
};


GameField.prototype.die = function(enemy) {
    this.isAlive = false;
    this.timeOfDeath = new Date();

    this.emit('died', { shooter: enemy, target: this, time: this.timeOfDeath });
};


/** Player /////////////////////////////////////////////////////////////////////
    Emits:
    - shotFired (shooter, target, x, y),
    - shotTaken (shooter, target, x, y, result),
    - hitTaken (shooter, target, x, y),
    - died (shooter, target, time)

    Listens to:
    - game.mayShoot
    - game.shotLanded
 */
function Player(game) {
    GameField.call(this, game.fieldSize, MISS);

    this.game = game;
    this.totalHealth = game.playerHealth;

    var self = this;
    game.on('mayShoot', function(shooter) {
       if (shooter == self) {
           self.shoot();
       }
    });
    game.on('shotLanded', function(shot) {
        if (shot.target != self) {
            self.shotLanded(shot.target, shot.x, shot.y, shot.result);
        }
    });
};
util.inherits(Player, GameField);

Player.prototype.placeFleet = function() {
    var ships = this.totalHealth;
    var cells = 1; //40
    var i = 0;
    var j = 0;
    var tmp = [];

    while (i < ships -1) {
        var x = Math.floor(Math.random() * this.size);
        var y = Math.floor(Math.random() * this.size);
        if (x - cells < 0) {
            x += cells;
        }
        if (x + cells > this.size) {
            x -= cells;
        }
        if (y - cells < 0) {
            y += cells;
        }
        if (y + cells > this.size) {
            y -= cells;
        }
        if (this.field[x][y] != MISS) {
            continue;
        };
        this.field[x][y] = HIT;
        i++;
    }
};


Player.prototype.shoot = function() {
    if (! this.isAlive) {
        return null;
    }

    var enemies = this.game.getEnemiesAlive();
    if (enemies.length == 0) {
        return null;
    }

    var enemy = this.pickNextEnemy(enemies);
    var aim = enemy.shootNextTarget();
    if (aim == null) {
        return null;
    }

    this.game.shoot(this, enemy, aim[0], aim[1]);

    var shot = { shooter: this, target: enemy, x: aim[0], y: aim[1] };
    this.emit('shotFired', shot);
    return shot;
};

Player.prototype.pickNextEnemy = function(liveEnemies) {
    return liveEnemies[0];
};


Player.prototype.shotLanded = function(enemy, x, y, result) {
    if (enemy.isAlive) {
        if (result == HIT || result == WRECK) {
            enemy.addPriorityTargetsAround(x, y, result);
        }
    }
};

Player.prototype.takeShot = function(enemy, x, y) {
    var stat = this.get(x, y);
    if (stat == HIT) {
        stat = WRECK;
        this.set(x, y, stat);

        this.hitCount++;
        this.emit('hitTaken', { shooter: enemy, target: this, x: x, y: y });

        if (this.hitCount == this.totalHealth) {
            this.die(enemy);
        }
    }
    this.emit('shotTaken', { shooter: enemy, target: this, x: x, y: y, result: stat });
    if (! this.isAlive) {
        stat = DEAD;
    }
    return stat;
};



/**
 * Enemy game field with target tracking
 *
 * Emits:
 * - shotTaken
 * - hitTaken
 * - died
 *
 * Listens to:
 * - game.shotLanded
 *
 */
function Enemy(game) {
    GameField.call(this, game.fieldSize, UNKNOWN);

    this.game = game;
    this.totalHealth = game.playerHealth;

    this.initNextTargets();
};
util.inherits(Enemy, GameField);

Enemy.prototype.initNextTargets = function() {
    this.nextTargets = {};
    this.x = 0;
    this.y = 0;

    this.unknownCount = this.size * this.size;
    this.firingCount = 0;
};

Enemy.prototype.shootNextTarget = function() {
    while (this.isAlive && (this.unknownCount - this.firingCount > 0)) {
        var x = this.x, y = this.y;
        var stat = this.get(x, y);

        if (++this.x >= this.size) {
            this.x -= this.size;
            if (++this.y >= this.size) {
                this.y -= this.size;
            }
        }

        if (stat == UNKNOWN) {
            this.set(x, y, FIRING);
            this.firingCount++;
            return [x, y];
        }
    }
    return null;
};


Enemy.prototype.addPriorityTargetsAround = function(x, y, result) {
    var nextTargets = [];
    for (var i = x - 1; i < x + 1; i++) {
        for (var j = y - 1; j < y + 1; j++) {
            var stat = this.get(i, j);
            if (stat == UNKNOWN) {
                nextTargets.append( [x, y] );
            }
        }
    }
    return nextTargets;
};


Enemy.prototype.shotTaken = function(player, x, y, result) {
    if (result == DEAD) {
        if (this.unknownCount == 1) {
            result = HIT;
        } else {
            result = UNKNOWN;
        }
        if (this.isAlive) {
            this.die(player);
        }
    }

    var stat = this.get(x, y);
    if ((stat == UNKNOWN || stat == FIRING)
        && ! (result == UNKNOWN || result == FIRING))
    {
        this.unknownCount--;
    }
    if (stat == FIRING && result != FIRING) {
        this.firingCount--;
    }
    this.set(x, y, result);
    if (result == HIT) {
        this.hitCount++;
        this.emit('hitTaken', { shooter: player, target: this, x: x, y: y });
    }
    this.emit('shotTaken', { shooter: player, target: this, x: x, y: y, result: stat } );
    return stat;
};


/**
 * Game network stats
 */
function Stats(enemies, limits) {

    this.numSending = 0;
    this.numHandling = 0;
    this.numRequestErrors = 0;
    this.numResponseErrors = 0;
    this.numEnded = 0;

    this.maxSending = limits.sending;
    this.maxHandling = limits.handling;
    this.maxRequests = limits.sending + limits.handling;
    this.maxPerTarget = limits.requestsPerTarget;

    this.requestsPerTarget = [];
    for (var i = 0; i < enemies.length; i++) {
        var enemy = enemies[i];
        this.requestsPerTarget[enemy.id] = 0;
    }
}

Stats.prototype.haveCapacity = function() {
    return this.numSending + this.numHandling < this.maxSending + this.maxHandling;
};
Stats.prototype.haveCapacityFor = function(enemy) {
    return this.requestsPerTarget[enemy.id] < this.maxPerTarget;
};

Stats.prototype.requestSent = function(target) {
    this.numSending++;
    this.requestsPerTarget[target.id]++;
};
Stats.prototype.requestError = function(target) {
    this.numSending--;
    this.requestsPerTarget[target.id]--;
    this.numRequestErrors++;
};
Stats.prototype.responseReceived = function(target) {
    this.numSending--;
    this.numHandling++;
};
Stats.prototype.responseEnded = function(target) {
    this.numHandling--;
    this.requestsPerTarget[target.id]--;
    this.numEnded++;
};
Stats.prototype.responseError = function(target) {
    this.numHandling--;
    this.requestsPerTarget[target.id]--;
    this.numResponseErrors++;
};



/**
 * Game 'controller'
 *
 * Emits:
 * - mayShoot (player)
 * - shotLanded (shooter, target, x, y, result)
 *
 * Provides:
 * - takeShot(shooter, x, y): result
 * - shoot(target, x, y) -> makes request
 *
 * Calls:
 * - player.takeShot(shooter, x, y): result
 * - enemy.shotTaken(shooter, x, y, result)
 */
function Game(config) {
    this.fieldSize = config.fieldSize;
    this.playerHealth = config.playerHealth;

    this.player = new Player(this);
    this.setAddress(this.player, config.playerAddress);

    this.enemy = new Enemy(this);
    this.setAddress(this.enemy, config.enemyAddress);
    this.enemies = [ this.enemy ];
    this.enemy.id = 0;

    this.stats = new Stats(this.enemies, {
        sending: 10,
        handling: 1,
        requestsPerTarget: 10
    });

    this.player.placeFleet();
};
util.inherits(Game, events.EventEmitter);

Game.prototype.getEnemiesAlive = function() {
    if (this.enemy.isAlive) {
        return [ this.enemy ];
    }
    return [];
};
Game.prototype.getEnemyByAddress = function(ip, port) {
    return this.enemy;
};
Game.prototype.setAddress = function(player, address) {
    if (typeof address == 'string') {
        address = address.split(':');
    }
    if (address.length < 2) {
        address[1] = 80;
    }
    player.host = address[0];
    player.port = parseInt( address[1] );
};

Game.prototype.shoot = function(shooter, target, x, y) {

    var targetPath = '/beerkoding/shoot?x=' + x + '&y=' + y;
    var req = http.request({
        host: target.host,
        port: target.port,
        path: targetPath,
        agent: false
    });

    var self = this;
    var stats = this.stats;
    stats.requestSent(target);

    req.on('response', function(res) {
        stats.responseReceived(target);
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            var result = parseInt(chunk);
            self.shotLanded(shooter, target, x, y, result);
        });
        res.on('end', function() {
            stats.responseEnded(target);
        });
        res.on('error', function(exception) {
            stats.responseError(target);
            self.shotLanded(shooter, target, x, y, UNKNOWN);
        });
    });
    req.on('error', function() {
        stats.requestError(target);
    });

    req.end();

    this.nextShot();
};

Game.prototype.shotLanded = function(player, enemy, x, y, result) {
    if (result < UNKNOWN || result > DEAD) {
        return;
    }
    var outcome = enemy.shotTaken(player, x, y, result);
    this.emit('shotLanded', { shooter: player, target: enemy, x: x, y: y, result: result });

    this.nextShot();
};


Game.prototype.takeShot = function(request) {
    var p = request.query,
        x = p.x, y = p.y;
    if (x < 0 || x >= this.fieldSize ||
        y < 0 || y >= this.fieldSize)
    {
        return MISS;
    }
    var enemy = this.getEnemyByAddress(request.ip, request.port);
    if (enemy == null) {
        return MISS;
    }
    var result = this.player.takeShot(enemy, x, y);
    this.emit('shotLanded', { shooter: enemy, target: this.player, x: x, y: y, result: result });
    return result;
};


Game.prototype.nextShot = function() {
    if (this.stats.haveCapacity() && this.player.isAlive) {
        this.emit('mayShoot', this.player);
    }
};


Game.prototype.run = function() {
    var self = this;
    var t = setInterval(function() {

        if (! this.player.isAlive || this.getEnemiesAlive().length == 0) {
            clearInterval(t);
        } else if (self.stats.haveCapacity()) {
            self.nextShot();
        }

    }, 100);
};



exports.MISS = MISS;
exports.HIT = HIT;
exports.WRECK = WRECK;
exports.DEAD = DEAD;
exports.UNKNOWN = UNKNOWN;
exports.FIRING = FIRING;

exports.Game = Game;
exports.GameField = GameField;
exports.Player = Player;
exports.Enemy = Enemy;