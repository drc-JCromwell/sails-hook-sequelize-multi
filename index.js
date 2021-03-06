// Generated by CoffeeScript 1.10.0
module.exports = function(sails) {
  global["Sequelize"] = require("sequelize");
  Sequelize.cls = require("continuation-local-storage").createNamespace("sails-sequelize-postgresql");
  return {
    initialize: function(next) {
      var connName, connection, cxn, hook, migrate, ref, seq, sequelize, sequelizeConnections;
      hook = this;
      hook.initAdapters();
      hook.initModels();
      sails.log.verbose("Using connection named " + sails.config.models.connection);
      connection = sails.config.connections[sails.config.models.connection];
      if (connection == null) {
        throw new Error("Connection '" + sails.config.models.connection + "' not found in config/connections");
      }
      if (connection.options == null) {
        connection.options = {};
      }
      connection.options.logging = connection.options.logging || sails.log.verbose;
      migrate = sails.config.models.migrate;
      sails.log.verbose("Migration: " + migrate);
      sequelize = new Sequelize(connection.database, connection.user, connection.password, connection.options);
      global["sequelize"] = sequelize;
      sequelizeConnections = {};
      ref = sails.config.connections;
      for (connName in ref) {
        cxn = ref[connName];
        if (!cxn.options) {
          cxn.options = {};
        }
        cxn.options.logging = cxn.options.logging || sails.log.verbose;
        seq = new Sequelize(cxn.database, cxn.user, cxn.password, cxn.options);
        sequelizeConnections[connName] = seq;
        if (sequelize[connName] != null) {
          throw new Error("The property '" + connName + "' already exists in sequelize. Please change the name of your connection to something else.");
        }
        sequelize[connName] = seq;
      }
      return sails.modules.loadModels(function(err, models) {
        var forceSync, modelDef, modelId, modelName, newModel;
        if (err != null) {
          return next(err);
        }
        for (modelName in models) {
          modelDef = models[modelName];
          modelId = modelDef.globalId;
          sails.log.verbose("Loading model '" + modelId + "'");
          newModel = sequelize.define(modelId, modelDef.attributes, modelDef.options);
          for (connName in sails.config.connections) {
            seq = sequelizeConnections[connName];
            if (newModel[connName] != null) {
              throw new Error("The property '" + connName + "' already exists in the model '" + modelId + ". Please change the name of your connection to something else.");
            }
            newModel[connName] = seq.define(modelId, modelDef.attributes, modelDef.options);
            sails.log.verbose("Createing model '" + modelId + "[" + connName + "]'");
          }
          global[modelId] = newModel;
          sails.models[modelId.toLowerCase()] = newModel;
        }
        for (modelName in models) {
          modelDef = models[modelName];
          hook.setAssociation(modelDef);
          hook.setDefaultScope(modelDef);
        }
        if (migrate === "safe") {
          return next();
        } else {
          forceSync = migrate === "drop";
          sequelize.sync({
            force: forceSync
          }).then(function() {
            return next();
          });
        }
      });
    },
    initAdapters: function() {
      if (sails.adapters === undefined) {
        sails.adapters = {};
      }
    },
    initModels: function() {
      if (sails.models === undefined) {
        sails.models = {};
      }
    },
    setAssociation: function(modelDef) {
      if (modelDef.associations != null) {
        sails.log.verbose("Loading associations for '" + modelDef.globalId + "'");
        if (typeof modelDef.associations === "function") {
          modelDef.associations(modelDef);
        }
      }
    },
    setDefaultScope: function(modelDef) {
      var model;
      if (modelDef.defaultScope != null) {
        sails.log.verbose("Loading default scope for '" + modelDef.globalId + "'");
        model = global[modelDef.globalId];
        if (typeof modelDef.defaultScope === "function") {
          model.$scope = modelDef.defaultScope() || {};
        }
      }
    }
  };
};
