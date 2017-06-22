const express = require('express');
const appRouter = new express.Router();
const assert = require('assert');

const methods = ['get', 'post'];

module.exports = methods.reduce((route, method) => {
  route[method] = (app, url, Controller, nameMethod, options) => {
    assert(Controller, 'Controller is not defined');
    options = options || {};

    appRouter[method](url, options.middleware || [], (req, res, next) => {
      const instanceController = new Controller(req, res, next);
      instanceController[nameMethod]();
    });

    app.use(appRouter);

    return this;
  };

  return route;
}, {});
