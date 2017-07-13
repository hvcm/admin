const router = require('../helper/router');
const entity = require('../server/controllers/entity');
const login = require('../server/controllers/login');
const logout = require('../server/controllers/logout');

const discover = (name) => require(`../server/controllers/${name}`);

const entities = [
	'terminals',
	'roomdisplays',
	'humans',
	'schedules',
	'services',
	'service-groups',
	'departments',
	'digital-displays'
];

const actions = ['delete', 'save', 'list'];

module.exports = app => {
	entities.forEach(name => {
		const module = discover(name);
		actions.forEach(action => {
			router.post(app, `/entity-${action}/${name}`, module, action);
		})
	});

	router.post(app, '/entity-list/:entity', entity, 'entityList');
	router.post(app, '/entity-save/:entity', entity, 'entitySave');
	router.post(app, '/entity-delete/:entity', entity, 'entityDelete');

	router.post(app, '/login', login, 'login');
	router.post(app, '/logout', logout, 'logout');

	return router;
};
