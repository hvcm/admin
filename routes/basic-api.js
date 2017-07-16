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
	'servers'
];

const actions = ['delete', 'save', 'list'];
const options = {
	middleware: [auth]
};
module.exports = app => {

	entities.forEach(name => {
		const module = discover(name);
		actions.forEach(action => {
			router.post(app, `/entity-${action}/${name}`, module, action, options);
		})
	});

	router.post(app, '/entity-list/:entity', entity, 'entityList', options);
	router.post(app, '/entity-save/:entity', entity, 'entitySave', options);
	router.post(app, '/entity-delete/:entity', entity, 'entityDelete', options);
	router.post(app, '/servers/reload', servers, 'reload', options);

	router.post(app, '/login', login, 'login');
	router.post(app, '/logout', logout, 'logout');

	return router;
};
