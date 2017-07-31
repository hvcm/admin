const cookiesNames = ['permissions', 'user', 'username', 'server', 'superadmin'];

module.exports = {
	extendCookie: (req, res) => {
		const opts = {
			expires: new Date(Date.now() + 12 * 60 * 60 * 1000)
		};

		cookiesNames.forEach(name => {
			const value = _.get(req, `cookies.${name}`, '');
			res.cookie(name, value, opts);
		});
	}
};
