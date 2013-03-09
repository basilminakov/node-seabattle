var http = require('http'),
    url = require('url'), querystring = require('querystring');

var server = http.createServer(function(req, res) {
    var reqUrl = url.parse(req.url);
    var path = reqUrl.path,
        query = querystring.parse(reqUrl.query);

    if (path.indexOf('/shoot') == 0) {
        var result = takeShot(query.x, query.y);
        console.log('shot taken: ', query.x, query.y, result);

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(result);
        res.end();
    } else {
        console.log('printing status');

        res.writeHead(200, {'Content-Type': 'text/plain'});
        printStatus(res);
        res.end();
    }
});

server.listen(80);

function takeShot(x, y) {
    return '3';
}

function printStatus(res) {
    res.write('dead');
}

var shotsInFlight = 0;

function shoot(enemy) {
    var target = nextTarget(enemy);
    if (target) {
        ++shotsInFlight;
        http.get(enemy.address + '/shoot?x=' + target.x + '&y=' + target.y), function(res) {
            res.on('data', function(data) {
                --shotsInFlight;
                var result = parseInt(data);
                console.log('shot landed: ' + target.x + ' ' + target.y + ' -> ' + result);
                shotLanded(x, y, result);
            });
        }
    }
    return target;
}

var t = setInterval(function() {
    if (! player.isAlive || !enemy.isAlive) {
        clearInterval(t);
        return;
    }
    while (shotsInFlight < SHOTS_MAX) {
        if (! shoot() )
            break;
    }
}, 100);