
exports.index = function(req, res){
	res.render('index', {  
		title: 'Main page' 
	});
};

exports.status = function(req, res, game) {
	res.render('status', {  
		title: 'Game status', 
		player: game.player,
        game: game
	});
};

exports.enemies = function(req, res, they) {
	res.render('enemies', {  
		title: 'Enemies status', 
		they: they 
	});
};

exports.map = function(req, res, game) {
	res.render('map', { 
		title: 'Battleships location', 
		data: game
	});
};

exports.spy = function(req, res, servers, count) {
	res.render('spy', {
		title: 'Spy statistics',
		items: servers,
		amount: count
	});
};