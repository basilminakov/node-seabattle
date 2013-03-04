var seabattle = require('../public/js/seabattle');

var events = require('events'),
    util = require('util');

exports.testSmoke = function(test) {
    test.equal(seabattle.MISS, 0);
    test.equal(typeof seabattle.Game, 'function');
    test.done();
};

exports.testGameField = function(test) {
    var field = new seabattle.GameField(10, seabattle.UNKNOWN);
    test.ok(field.isAlive);
    test.equal(field.hitCount, 0);

    test.equal(field.get(0, 0), seabattle.UNKNOWN);
    test.equal(field.get(-1, 0), seabattle.MISS);
    test.equal(field.get(9, 9), seabattle.UNKNOWN);
    test.equal(field.get(9, 10), seabattle.MISS);

    field.set(1, 0, seabattle.HIT);
    test.equal(field.get(1, 0), seabattle.HIT);
    test.equal(field.get(0, 0), seabattle.UNKNOWN);
    test.equal(field.get(2, 0), seabattle.UNKNOWN);
    test.equal(field.get(1, 1), seabattle.UNKNOWN);

    var killer = { fake: true };
    field.on('died', function(death) {
        test.ok(! field.isAlive);
        test.equal(death.shooter, killer);
        test.done();
    });
    field.die(killer);
    test.ok(! field.isAlive);
};

function MockGame(size, health) {
    this.fieldSize = size;
    this.playerHealth = health;
};
util.inherits(MockGame, events.EventEmitter);

exports.testEnemy = function(test) {
    var game = new MockGame(2, 2);
    var player = new seabattle.Player(game);
    var enemy = new seabattle.Enemy(game);

    test.equal(enemy.get(0, 0), seabattle.UNKNOWN);
    test.equal(enemy.unknownCount, 4);

    var shotsLeft = 4;
    var hitsMade = 0;
    var result = seabattle.UNKNOWN;
    var aim = enemy.shootNextTarget();
    test.deepEqual(aim, [0, 0]);
    test.equal(enemy.get(aim[0], aim[1]), seabattle.FIRING);
    test.equal(enemy.unknownCount, shotsLeft);
    test.equal(enemy.firingCount, 1);

    enemy.on('shotTaken', function(shot) {
        test.equal(enemy.get(aim[0], aim[1]), result);
        test.equal(enemy.unknownCount, shotsLeft);
        test.equal(enemy.firingCount, 0);
    });
    --shotsLeft;
    enemy.shotTaken(player, 0, 0, result = seabattle.MISS);

    aim = enemy.shootNextTarget();
    test.deepEqual(aim, [1, 0]);

    enemy.on('hitTaken', function(shot) {
        test.equal(enemy.get(aim[0], aim[1]), seabattle.HIT);
        test.equal(enemy.hitCount, hitsMade);
    });
    --shotsLeft;
    ++hitsMade;
    enemy.shotTaken(player, 1, 0, result = seabattle.HIT);


    aim = enemy.shootNextTarget();
    test.deepEqual(aim, [0, 1]);
    --shotsLeft;
    enemy.shotTaken(player, 0, 1, result = seabattle.MISS);

    aim = enemy.shootNextTarget();
    test.deepEqual(aim, [1, 1]);

    enemy.on('died', function(death) {
        test.ok(! enemy.isAlive);
        test.equal(death.shooter, player);
        test.done();
    });
    --shotsLeft;
    ++hitsMade;
    result = seabattle.HIT;
    enemy.shotTaken(player, 1, 1, seabattle.DEAD);
};