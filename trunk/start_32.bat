start redis/32bit/redis-server.exe
ping -n 4 127.0.0.1 > nul
start node app.js --port 3000
start node app.js --port 3010 --enemyPort 3000