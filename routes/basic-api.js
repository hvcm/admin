const router = require('../helper/router');
const entity = require('../server/controllers/entity');
const login = require('../server/controllers/login');

module.exports = app => {
	router.post(app, '/entity-list/:entity', entity, 'entityList');
	router.post(app, '/entity-save/:entity', entity, 'entitySave');
	router.post(app, '/login', login, 'login');

	return router;
};
