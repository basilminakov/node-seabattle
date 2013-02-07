/**
 * Created with JetBrains WebStorm.
 * User: michael
 * Date: 2/1/13
 * Time: 3:57 PM
 * To change this template use File | Settings | File Templates.
 */

function showMap(req, res, mapData) {
    var html = [];
    html.push("<h2>Map info</h2>");
    html.push("<hr>");
    html.push("<span style='font-size:7pt;'>");
    for (var i = 0; i < mapData.length; i++) {
        for (var j = 0; j < mapData.length; j++) {
            html.push(mapData[i][j] == 0 ? " " : mapData[i][j]);
            html.push("");
        }
        html.push("<br>");
    }
    html.push("</span>");

    res.send(html.join(""));
};

function showStatus(req, res, we) {
    var html = [];
    html.push("<h2>Server status</h2>");
    html.push("<hr>");
    html.push("Hitted cells: ");
    html.push(we.hitCount);
    html.push("<br>");
    html.push("Server status: ");
    if (we.isAlive) {
        html.push(" active");
    } else {
        html.push(" killed at " + we.timeOfDeath.toString());
    }
    html.push("<br>");
    html.push("Total requests: ");
    html.push(we.spyReqCount + we.shotReqCount);
    html.push("<br>");
    html.push("Spy requests: ");
    html.push(we.spyReqCount);
    html.push("<br>");
    html.push("Shoots: ");
    html.push(we.shotReqCount);
    res.send(html.join(""));
};

function showEnemies(req, res, they) {

};

exports.showMap = showMap;
exports.showStatus = showStatus;
exports.showEnemies = showEnemies;