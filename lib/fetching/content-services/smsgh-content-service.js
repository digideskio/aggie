'use strict';

var express = require('express');
var ContentService = require('../content-service');
var util = require('util');
var _ = require('underscore');

function SMSGhContentService(port) {
  this.fetchType = 'subscribe';
  this._isListening = false;
  this._app = express();
  this._connectedSources = {};
  var self = this;

  this._app.get('/smsghana', function(req, res) {

    var _params = req.query;
    res.send(200);
    var reportData = self._parse(_params);
    self.emit(self._getKeyword(req.query.keyword), reportData);

  });

  this.port = port || 1111;
}

util.inherits(SMSGhContentService, ContentService);

SMSGhContentService.prototype._getKeyword = function(keyword) {
  return 'sms_ghana:' + keyword.toLowerCase();
};

SMSGhContentService.prototype.subscribe = function(id, info) {
  var keyword = this._getKeyword(info.keywords);
  this._connectedSources[id] = keyword;
  if (!this._isListening) {
    this.server = this._app.listen(this.port);
    this._isListening = true;
  }
  return keyword;
};

SMSGhContentService.prototype.unsubscribe = function(id) {
  if (_.has(this._connectedSources, id)) {
    delete this._connectedSources[id];
  } else {
    return;
  }
  if (_.keys(this._connectedSources).length === 0) {
    this._isListening = false;
    this.server.close();
  }
  return;
};

SMSGhContentService.prototype._parse = function(query) {
  var returnObject = {};

  if (!this._validate(query)) {
    this.emit('error', new Error('Validation error, something was missing.'));
    return returnObject; // What's this?
  }

  returnObject.authoredAt = new Date(query.date);
  returnObject.fetchedAt = new Date();
  returnObject.url = ''; // since url is part of the schema
  returnObject.author = query.from;
  returnObject.keyword = query.keyword.toLowerCase();
  returnObject.content = query.fulltext;
  return returnObject;
};

SMSGhContentService.prototype._validate = function(data) {
  if (!data.hasOwnProperty('from')) {
    this.emit('warning', new Error('Parse warning: SMSGh element is missing the "from" field'));
    return false;
  }
  if (!data.hasOwnProperty('keyword')) {
    this.emit('warning', new Error('Parse warning: SMSGh element is missing the "keyword" field'));
    return false;
  }
  if (!data.hasOwnProperty('fulltext')) {
    this.emit('warning', new Error('Parse warning: SMSGh element is missing the "fulltext" field'));
    return false;
  }
  return true;
};

module.exports = new SMSGhContentService();
