/**
 @license $indexedDBProvider
 (c) 2014 Bram Whillock (bramski)
 Forked from original work by clements Capitan (webcss)
 License: MIT
 */
"use strict";

let servicesModule = require('./_index.js');
let __slice = [].slice;

const dbMode = {
  readonly: "readonly",
  readwrite: "readwrite"
};
const readyState = {
  pending: "pending"
};
const cursorDirection = {
  next: "next",
  nextunique: "nextunique",
  prev: "prev",
  prevunique: "prevunique"
};
const apiDirection = {
  ascending: cursorDirection.next,
  descending: cursorDirection.prev
};
const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
const IDBKeyRange = window.IDBKeyRange || window.mozIDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

class Transaction {
  constructor(storeNames, mode) {
    if (mode == null) {
      mode = dbMode.readonly;
    }
    this.transaction = db.transaction(storeNames, mode);
    this.defer = $q.defer();
    this.promise = this.defer.promise;
    this.setupCallbacks();
  }

  setupCallbacks() {
    this.transaction.oncomplete = ((_this) => {
      return () => {
        return $rootScope.$apply(() => {
          return _this.defer.resolve("Transaction Completed");
        });
      };
    })(this);

    this.transaction.onabort = ((_this) => {
      return (error) => {
        return $rootScope.$apply(() => {
          return _this.defer.reject("Transaction Aborted", error);
        });
      };
    })(this);

    this.transaction.onerror = ((_this) => {
      return (error) => {
        return $rootScope.$apply(() => {
          return _this.defer.reject("Transaction Error", error);
        });
      };
    })(this);
  }

  objectStore(storeName) {
    return this.transaction.objectStore(storeName);
  }

  abort() {
    return this.transaction.abort();
  }
}

class DbQ {

  constructor($q) {
    this.q = $q.defer();
    this.promise = this.q.promise;
  }

  reject() {
    let args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return $rootScope.$apply(((_this) => {
      return () => {
        var _ref;
        return (_ref = _this.q).reject.apply(_ref, args);
      };
    })(this));
  }

  rejectWith(req) {
    return req.onerror = req.onblocked = ((_this) => {
      return (e) => {
        return _this.reject(errorMessageFor(e));
      };
    })(this);
  }

  resolve() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return $rootScope.$apply(((_this) => {
      return () => {
        var _ref;
        return (_ref = _this.q).resolve.apply(_ref, args);
      };
    })(this));
  }

  notify() {
    var args;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return $rootScope.$apply(((_this) => {
      return () => {
        var _ref;
        return (_ref = _this.q).notify.apply(_ref, args);
      };
    })(this));
  }

  dbErrorFunction() {
    return ((_this) => {
      return (error) => {
        return $rootScope.$apply(() => {
          return _this.q.reject(errorMessageFor(error));
        });
      };
    })(this);
  }

  resolveWith(req) {
    this.rejectWith(req);
    return req.onsuccess = ((_this) => {
      return (e) => {
        return _this.resolve(e.target.result);
      };
    })(this);
  }
}

class Query {

  constructor() {
    this.indexName = void 0;
    this.keyRange = void 0;
    this.direction = cursorDirection.next;
  }

  $lt(value) {
    this.keyRange = IDBKeyRange.upperBound(value, true);
    return this;
  }

  $gt(value) {
    this.keyRange = IDBKeyRange.lowerBound(value, true);
    return this;
  }

  $lte(value) {
    this.keyRange = IDBKeyRange.upperBound(value);
    return this;
  }

  $gte(value) {
    this.keyRange = IDBKeyRange.lowerBound(value);
    return this;
  }

  $eq(value) {
    this.keyRange = IDBKeyRange.only(value);
    return this;
  }

  $between(low, hi, exLow, exHi) {
    if (exLow == null) {
      exLow = false;
    }
    if (exHi == null) {
      exHi = false;
    }
    this.keyRange = IDBKeyRange.bound(low, hi, exLow, exHi);
    return this;
  }

  $desc(unique) {
    this.direction = unique ? cursorDirection.prevunique : cursorDirection.prev;
    return this;
  }

  $asc(unique) {
    this.direction = unique ? cursorDirection.nextunique : cursorDirection.next;
    return this;
  }

  $index(indexName) {
    this.indexName = indexName;
    return this;
  }

}

class ObjectStore {

  constructor(storeName, transaction) {
    this.storeName = storeName;
    this.store = transaction.objectStore(storeName);
    this.transaction = transaction;
  }

  static defer() {
    return new DbQ();
  }

  static query() {
    return new Query();
  }

  _mapCursor(defer, mapFunc, req) {
    var results;
    if (req == null) {
      req = this.store.openCursor();
    }
    results = [];
    defer.rejectWith(req);
    return req.onsuccess = (e) => {
      var cursor;
      if (cursor = e.target.result) {
        results.push(mapFunc(cursor));
        defer.notify(mapFunc(cursor));
        return cursor["continue"]();
      } else {
        return defer.resolve(results);
      }
    };
  }

  _arrayOperation(data, mapFunc) {
    var defer, item, req, results, _i, _len;
    defer = this.defer();
    if (!angular.isArray(data)) {
      data = [data];
    }
    for (_i = 0, _len = data.length; _i < _len; _i++) {
      item = data[_i];
      req = mapFunc(item);
      results = [];
      defer.rejectWith(req);
      req.onsuccess = (e) => {
        results.push(e.target.result);
        defer.notify(e.target.result);
        if (results.length >= data.length) {
          return defer.resolve(results);
        }
      };
    }
    if (data.length === 0) {
      return $q.when([]);
    }
    return defer.promise;
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.getAllKeys
   @function

   @description
   gets all the keys

   @returns {Q} A promise which will result with all the keys
   */
  getAllKeys() {
    var defer, req;
    defer = this.defer();
    if (this.store.getAllKeys) {
      req = this.store.getAllKeys();
      defer.resolveWith(req);
    } else {
      this._mapCursor(defer, (cursor) => {
        return cursor.key;
      });
    }
    return defer.promise;
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.clear
   @function

   @description
   clears all objects from this store

   @returns {Q} A promise that this can be done successfully.
   */
  clear() {
    var defer, req;
    defer = this.defer();
    req = this.store.clear();
    defer.resolveWith(req);
    return defer.promise;
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.del
   @function

   @description
   Deletes the item at the key.  The operation is ignored if the item does not exist.

   @param {key} The key of the object to delete.
   @returns {Q} A promise that this can be done successfully.
   */
  del(key) {
    var defer;
    defer = this.defer();
    defer.resolveWith(this.store["delete"](key));
    return defer.promise;
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.upsert
   @function

   @description
   Updates the given item

   @param {data} Details of the item or items to update or insert
   @returns {Q} A promise that this can be done successfully.
   */
  upsert(data) {
    return this._arrayOperation(data, ((_this) => {
      return (item) => {
        return _this.store.put(item);
      };
    })(this));
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.insert
   @function

   @description
   Updates the given item

   @param {data} Details of the item or items to insert
   @returns {Q} A promise that this can be done successfully.
   */
  insert(data) {
    return this._arrayOperation(data, ((_this) => {
      return (item) => {
        return _this.store.add(item);
      };
    })(this));
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.getAll
   @function

   @description
   Fetches all items from the store

   @returns {Q} A promise which resolves with copies of all items in the store
   */
  getAll() {
    var defer;
    defer = this.defer();
    if (this.store.getAll) {
      defer.resolveWith(this.store.getAll());
    } else {
      this._mapCursor(defer, (cursor) => {
        return cursor.value;
      });
    }
    return defer.promise;
  }

  eachWhere(query) {
    var defer, direction, indexName, keyRange, req;
    defer = this.defer();
    indexName = query.indexName;
    keyRange = query.keyRange;
    direction = query.direction;
    req = indexName ? this.store.index(indexName).openCursor(keyRange, direction) : this.store.openCursor(keyRange, direction);
    this._mapCursor(defer, ((cursor) => {
      return cursor.value;
    }), req);
    return defer.promise;
  }

  findWhere(query) {
    return this.eachWhere(query);
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.each
   @function

   @description
   Iterates through the items in the store

   @param {options.beginKey} the key to start iterating from
   @param {options.endKey} the key to stop iterating at
   @param {options.direction} Direction to iterate in
   @returns {Q} A promise which notifies with each individual item and resolves with all of them.
   */
  each(options) {
    if (options == null) {
      options = {};
    }
    return this.eachBy(void 0, options);
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.eachBy
   @function

   @description
   Iterates through the items in the store using an index

   @param {indexName} name of the index to use instead of the primary
   @param {options.beginKey} the key to start iterating from
   @param {options.endKey} the key to stop iterating at
   @param {options.direction} Direction to iterate in
   @returns {Q} A promise which notifies with each individual item and resolves with all of them.
   */
  eachBy(indexName, options) {
    var q;
    if (indexName == null) {
      indexName = void 0;
    }
    if (options == null) {
      options = {};
    }
    q = new Query();
    q.indexName = indexName;
    q.keyRange = keyRangeForOptions(options);
    q.direction = options.direction || defaultQueryOptions.direction;
    return this.eachWhere(q);
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.count
   @function

   @description
   Returns a count of the items in the store

   @returns {Q} A promise which resolves with the count of all the items in the store.
   */
  count() {
    var defer;
    defer = this.defer();
    defer.resolveWith(this.store.count());
    return defer.promise;
  }

  /**
   @ngdoc function
   @name $indexedDBProvider.store.find
   @function

   @description
   Fetches an item from the store

   @returns {Q} A promise which resolves with the item from the store
   */
  find(key) {
    var defer, req;
    defer = this.defer();
    req = this.store.get(key);
    defer.rejectWith(req);
    req.onsuccess = ((_this) => {
      return (e) => {
        if (e.target.result) {
          return defer.resolve(e.target.result);
        } else {
          return defer.reject("" + _this.storeName + ":" + key + " not found.");
        }
      };
    })(this);
    return defer.promise;
  }

  /**
   @ngdoc function
   @name findBy
   @function

   @description
   Fetches an item from the store using a named index.

   @returns {Q} A promise which resolves with the item from the store.
   */
  findBy(index, key) {
    var defer;
    defer = this.defer();
    defer.resolveWith(this.store.index(index).get(key));
    return defer.promise;
  }
}

ObjectStore.defaultQueryOptions = {
  useIndex: void 0,
  keyRange: null,
  direction: cursorDirection.next
};

class IndexedDBProvider {

  constructor() {
    this.dbName = '';
    this.dbVersion = 1;
    this.db = null;
    this.upgradesByVersion = {};
    this.dbPromise = null;
    this.allTransactions = [];

  }

  /**
   *
   * @private
   * @param oldVersion
   * @param event
   * @param db
   * @param tx
   */
  applyNeededUpgrades(oldVersion, event, db, tx) {
    for (let version in this.upgradesByVersion) {
      if (!this.upgradesByVersion.hasOwnProperty(version) || version <= oldVersion) {
        continue;
      }
      console.debug("$indexedDB: Running upgrade : " + version + " from " + oldVersion);
      this.upgradesByVersion[version](event, db, tx);
    }
  }

  /**
   *
   * @private
   * @param e
   * @returns {*}
   */
  static errorMessageFor(e) {
    if (e.target.readyState === readyState.pending) {
      return "Error: Operation pending";
    } else {
      return e.target.webkitErrorMessage || e.target.error.message || e.target.errorCode;
    }
  }

  /**
   *
   * @private
   * @param promise
   * @param results
   * @returns {*}
   */
  static appendResultsToPromise(promise, results) {
    if (results !== void 0) {
      return promise.then(() => {
        return results;
      });
    } else {
      return promise;
    }
  }

  /**
   @ngdoc function
   @name connection
   @function

   @description
   sets the name of the database to use

   @param {string} databaseName database name.
   @returns {object} this
   */
  connection(databaseName) {
    this.dbName = databaseName;
    return this;
  }

  /**
   @ngdoc function
   @name upgradeDatabase
   @function

   @description provides version number and steps to upgrade the database wrapped in a
   callback function

   @param {number} newVersion new version number for the database.
   @param {function} callback the callback which proceeds the upgrade
   @returns {object} this
   */
  upgradeDatabase(newVersion, callback) {
    this.upgradesByVersion[newVersion] = callback;
    this.dbVersion = Math.max.apply(null, Object.keys(this.upgradesByVersion));
    return this;
  }

  /**
   * @ngInject
   */
  $get($q, $rootScope) {

    var rejectWithError = (deferred) => {
      return (error) => {
        return $rootScope.$apply(() => {
          return deferred.reject(errorMessageFor(error));
        });
      };
    };

    var createDatabaseConnection = () => {
      var dbReq, deferred;
      deferred = $q.defer();

      dbReq = indexedDB.open(this.dbName, this.dbVersion || 1);

      dbReq.onsuccess = () => {
        this.db = dbReq.result;
        $rootScope.$apply(() => {
          deferred.resolve(this.db);
        });
      };

      dbReq.onblocked = dbReq.onerror = rejectWithError(deferred);

      dbReq.onupgradeneeded = (event) => {
        this.db = event.target.result;
        let tx = event.target.transaction;
        console.debug("$indexedDB: Upgrading database '" + this.db.name +
        "' from version " + event.oldVersion +
        " to version " + event.newVersion + " ...");
        applyNeededUpgrades(event.oldVersion, event, this.db, tx);
      };

      return deferred.promise;
    };

    var openDatabase = () => {
      return this.dbPromise || (this.dbPromise = createDatabaseConnection());
    };

    var closeDatabase = () => {
      return openDatabase().then(() => {
        this.db.close();
        this.db = null;
        return this.dbPromise = null;
      });
    };

    var validateStoreNames = (storeNames) => {
      let found = true;
      for (let _i = 0, _len = storeNames.length; _i < _len; _i++) {
        let storeName = storeNames[_i];
        found = found & this.db.objectStoreNames.contains(storeName);
      }
      return found;
    };

    var openTransaction = (storeNames, mode) => {
      if (mode == null) {
        mode = dbMode.readonly;
      }
      return openDatabase().then(() => {
        if (!validateStoreNames(storeNames)) {
          return $q.reject("Object stores " + storeNames + " do not exist.");
        }

        var transaction = new Transaction(storeNames, mode);
        addTransaction(transaction);
        return transaction;
      });
    };

    var keyRangeForOptions = (options) => {
      if (options.beginKey && options.endKey) {
        return IDBKeyRange.bound(options.beginKey, options.endKey);
      }
    };

    var addTransaction = (transaction) => {
      this.allTransactions.push(transaction.promise);
      return transaction.promise["finally"](() => {
        var index;
        index = this.allTransactions.indexOf(transaction.promise);
        if (index > -1) {
          return this.allTransactions.splice(index, 1);
        }
      });
    };

    return {

      /**
       @ngdoc method
       @name $indexedDB.openStore
       @function

       @description an IDBObjectStore to use

       @params {string} storeName the name of the objectstore to use
       @returns {object} ObjectStore
       */
      openStore: (storeName, callBack, mode) => {
        if (mode == null) {
          mode = dbMode.readwrite;
        }
        return openTransaction([storeName], mode).then((transaction) => {
          var results;
          results = callBack(new ObjectStore(storeName, transaction));
          return appendResultsToPromise(transaction.promise, results);
        });
      },

      openStores: (storeNames, callback, mode) => {
        if (mode == null) {
          mode = dbMode.readwrite;
        }
        return openTransaction(storeNames, mode).then((transaction) => {
          var objectStores, results, storeName;

          objectStores = (() => {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = storeNames.length; _i < _len; _i++) {
              storeName = storeNames[_i];
              _results.push(new ObjectStore(storeName, transaction));
            }
            return _results;
          })();

          results = callback.apply(null, objectStores);
          return appendResultsToPromise(transaction.promise, results);
        });
      },

      openAllStores: (callback, mode) => {
        if (mode == null) {
          mode = dbMode.readwrite;
        }
        return openDatabase().then( () => {
          return () => {
            var results, storeName;
            let storeNames = Array.prototype.slice.apply(this.db.objectStoreNames);
            let transaction = new Transaction(storeNames, mode);

            addTransaction(transaction);

            let objectStores = (() => {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = storeNames.length; _i < _len; _i++) {
                storeName = storeNames[_i];
                _results.push(new ObjectStore(storeName, transaction));
              }
              return _results;
            })();

            results = callback.apply(null, objectStores);
            return appendResultsToPromise(transaction.promise, results);
          };
        });
      },

      /**
       @ngdoc method
       @name $indexedDB.closeDatabase
       @function

       @description Closes the database for use and completes all transactions.
       */
      closeDatabase: () => {
        return closeDatabase();
      },

      /**
       @ngdoc method
       @name $indexedDB.deleteDatabase
       @function

       @description Closes and then destroys the current database.  Returns a promise that resolves when this is persisted.
       */
      deleteDatabase: () => {
        return closeDatabase().then(() => {
          var defer;
          defer = new DbQ();
          defer.resolveWith(indexedDB.deleteDatabase(this.dbName));
          return defer.promise;
        })["finally"](() => {
          return console.debug("$indexedDB: " + this.dbName + " database deleted.");
        });
      },

      queryDirection: apiDirection,

      flush: () => {
        console.log("flush",this);
        if (this.allTransactions.length > 0) {
          return $q.all(this.allTransactions);
        } else {
          return $q.when([]);
        }
      },

      /**
       @ngdoc method
       @name $indexedDB.databaseInfo
       @function

       @description Returns information about this database.
       */
      databaseInfo: () => {
        return openDatabase().then(() => {
          let storeNames = Array.prototype.slice.apply(this.db.objectStoreNames);
          return openTransaction(storeNames, dbMode.readonly).then((transaction) => {
            let store, storeName;

            let stores = (() => {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = storeNames.length; _i < _len; _i++) {
                storeName = storeNames[_i];
                store = transaction.objectStore(storeName);
                _results.push({
                  name: storeName,
                  keyPath: store.keyPath,
                  autoIncrement: store.autoIncrement,
                  indices: Array.prototype.slice.apply(store.indexNames)
                });
              }
              return _results;
            })();

            return transaction.promise.then(() => {
              return {
                name: this.db.name,
                version: this.db.version,
                objectStores: stores
              };
            });
          });
        });
      }
    };
  }
}

servicesModule.provider('$indexedDB', IndexedDBProvider);