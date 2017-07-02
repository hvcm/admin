const router = require('../helper/router');
const entity = require('../server/controllers/entity');
const terminals = require('../server/controllers/terminals');
const roomdisplay = require('../server/controllers/roomdisplay');
const digitaldisplay = require('../server/controllers/digitaldisplay');
const login = require('../server/controllers/login');

module.exports = app => {
	router.post(app, '/entity-delete/terminals', terminals, 'delete');
	router.post(app, '/entity-save/terminals', terminals, 'save');
	router.post(app, '/entity-list/terminals', terminals, 'list');
	router.post(app, '/entity-delete/roomdisplays', roomdisplay, 'delete');
	router.post(app, '/entity-save/roomdisplays', roomdisplay, 'save');
	router.post(app, '/entity-list/roomdisplays', roomdisplay, 'list');
	router.post(app, '/entity-delete/digital-displays', digitaldisplay, 'delete');
	router.post(app, '/entity-save/digital-displays', digitaldisplay, 'save');
	router.post(app, '/entity-list/digital-displays', digitaldisplay, 'list');
	router.post(app, '/entity-list/:entity', entity, 'entityList');
	router.post(app, '/entity-save/:entity', entity, 'entitySave');
	router.post(app, '/entity-delete/:entity', entity, 'entityDelete');

	router.post(app, '/login', login, 'login');

	return router;
};
