const router = require('../helper/router');
const entity = require('../server/controllers/entity');
const terminals = require('../server/controllers/terminals');
const roomdisplay = require('../server/controllers/roomdisplay');
const humans = require('../server/controllers/humans');
const schedules = require('../server/controllers/schedules');
const services = require('../server/controllers/services');
const servicegroups = require('../server/controllers/service-groups');
const departments = require('../server/controllers/departments');
const digitaldisplay = require('../server/controllers/digitaldisplay');
const login = require('../server/controllers/login');

module.exports = app => {
	router.post(app, '/entity-delete/terminals', terminals, 'delete');
	router.post(app, '/entity-save/terminals', terminals, 'save');
	router.post(app, '/entity-list/terminals', terminals, 'list');
	router.post(app, '/entity-delete/roomdisplays', roomdisplay, 'delete');
	router.post(app, '/entity-save/roomdisplays', roomdisplay, 'save');
	router.post(app, '/entity-list/roomdisplays', roomdisplay, 'list');
	router.post(app, '/entity-delete/humans', humans, 'delete');
	router.post(app, '/entity-save/humans', humans, 'save');
	router.post(app, '/entity-list/humans', humans, 'list');
	router.post(app, '/entity-delete/schedules', schedules, 'delete');
	router.post(app, '/entity-save/schedules', schedules, 'save');
	router.post(app, '/entity-list/schedules', schedules, 'list');
	router.post(app, '/entity-delete/services', services, 'delete');
	router.post(app, '/entity-save/services', services, 'save');
	router.post(app, '/entity-list/services', services, 'list');
	router.post(app, '/entity-delete/service-groups', servicegroups, 'delete');
	router.post(app, '/entity-save/service-groups', servicegroups, 'save');
	router.post(app, '/entity-list/service-groups', servicegroups, 'list');
	router.post(app, '/entity-delete/departments', departments, 'delete');
	router.post(app, '/entity-save/departments', departments, 'save');
	router.post(app, '/entity-list/departments', departments, 'list');
	router.post(app, '/entity-delete/digital-displays', digitaldisplay, 'delete');
	router.post(app, '/entity-save/digital-displays', digitaldisplay, 'save');
	router.post(app, '/entity-list/digital-displays', digitaldisplay, 'list');
	router.post(app, '/entity-list/:entity', entity, 'entityList');
	router.post(app, '/entity-save/:entity', entity, 'entitySave');
	router.post(app, '/entity-delete/:entity', entity, 'entityDelete');

	router.post(app, '/login', login, 'login');

	return router;
};
