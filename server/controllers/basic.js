"use strict";

class Basic {
  constructor(req, res, next) {
    this.req = req;
    this.res = res;
    this.next = next;
  }
  entity() {
    this
      .res
      .send({data: 1});
  }
}

module.exports = Basic
