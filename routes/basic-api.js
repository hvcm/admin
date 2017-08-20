const router = require('../helper/router');
const entity = require('../server/controllers/entity');
const login = require('../server/controllers/login');
const logout = require('../server/controllers/logout');
const servers = require('../server/controllers/servers');
const auth = require('../middleware/auth');

const discover = (name) => require(`../server/controllers/${name}`);

const entities = [
	'terminals',
	'roomdisplays',
	'humans',
	'schedules',
	'services',
	'service-groups',
	'departments',
	'digital-displays',
	'servers',
	'restricted-days',
	'system-workstations',
	'globals'
];

const actions = ['delete', 'save', 'list', 'check'];
const options = {
	middleware: [auth]
};
module.exports = app => {

	entities.forEach(name => {
		actions.forEach(action => {
			router.post(app, `/entity-${action}/${name}`, discover(name), action, options);
		})
	});

	router.post(app, '/entity-list/:entity', entity, 'entityList', options);
	router.post(app, '/entity-save/:entity', entity, 'entitySave', options);
	router.post(app, '/entity-check/workstation', entity, 'check', options);
	router.post(app, '/entity-delete/:entity', entity, 'entityDelete', options);
	router.post(app, '/servers/reload', servers, 'reload', options);

	router.post(app, '/login', login, 'login');
	router.post(app, '/logout', logout, 'logout');

	return router;
};
