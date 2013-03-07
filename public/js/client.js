function openSocket(serverAddress) {
    console.debug('connecting to ' + serverAddress);

    var socket = io.connect(serverAddress, {
        'transports': [ 'xhr-polling' ],
        'try multiple transports': false
    });

    socket.on('connect', function() {
        console.log('LIVE! connected through socket.IO');
    });
    socket.on('error', function(err) {
        console.error('socket.io error', err);
    });
    socket.on('disconnect', function(data) {
        console.error('socket.io disconnected', data);
    });

    socket.on('shotLanded', function(data) {
        shotLanded(data);
    });
    socket.on('died', function(data) {
        playerDied(data);
    });
    return socket;
}

function startShooting(socket) {
    console.debug('start shooting!');

    socket.emit('startShooting', {});
}

function shotLanded(shot) {
    console.debug('shot landed:', shot);

    var target = document.getElementById(shot.target);
    if (! target) {
        return;
    }

    var cells = target.getElementsByTagName('span');
    var size = Math.floor( Math.sqrt(cells.length) );
    var x = parseInt(shot.x), y = parseInt(shot.y);
    var cellShot = cells[x * size + y];
    if (x < 0 || x > size || y < 0 || y > size || ! cellShot) {
        console.error('bad shot coordinates: target=' + shot.target + " x=" + x + " y=" + y);
        return;
    }

    var result = parseInt(shot.result);
    var cellClass =
        (result == -2) ? 'firing' :
        (result == -1) ? 'unknown' :
        (result == 0) ? 'empty' :
        (result == 1) ? 'hit' :
        'undefined_' + shot.result;
    cellShot.className = 'cell ' + cellClass;
}

function playerDied(death) {
    console.debug(death.target + 'is dead');

    var target = document.getElementById(death.target);
    if (! target) {
        return;
    }
    target.className = 'border dead';
}

var mySocket = openSocket('http://' + location.host);

var startBtn = document.getElementById('start');
if (startBtn) {
    startBtn.onclick = function() {
        try {
            startShooting(mySocket);
        } catch (e) {
            console.error(e);
        }
        return false;
    };
}