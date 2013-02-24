
/*
 * GET home page.
 */

exports.index = function(req, res){
	res.render('index', { title: 'Main page' });
};

exports.status = function(req, res, we) {
	res.render('status', { title: 'Game status', we: we });
};

exports.enemies = function(req, res, they) {
	res.render('enemies', { title: 'Enemies status', they: they });
};

exports.map = function(req, res, field) {
	res.render('map', { title: 'Battleships location', data: field });
};