function openSocket(serverAddress) {
    console.debug('connecting to ' + serverAddress);
    var socket = io.connect(serverAddress);

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
    var cellShot = cells[shot.x * size + shot.y];
    var cellClass =
        (shot.result == -2) ? 'firing' :
        (shot.result == -1) ? 'unknown' :
        (shot.result == 0) ? 'empty' :
        (shot.result == 1) ? 'hit' :
        'undefined_' + shot.result;
    cellShot.className = 'cell ' + cellClass;
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