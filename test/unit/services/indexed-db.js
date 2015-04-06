'use strict';
var __slice = [].slice;

describe("$indexedDB", function () {
  var providerConfig = {};
  var $q = {};

  var itPromises = function (message, testFunc) {
    return it(message, function (done) {
      var successCb;
      successCb = sinon.spy();
      return testFunc.apply(this, []).then(successCb)["catch"](function (error) {
        console.error("Unhandled failure from test: " + error);
        return expect(false).toBeTruthy();
      })["finally"](function () {
        return done();
      });
    });
  };

  var promiseBefore = function (beforeFunc) {
    return beforeEach(function (done) {
      return beforeFunc.apply(this, [])["finally"](done);
    });
  };

  beforeEach(function () {
    angular.module('app')
      .config(function ($indexedDBProvider) {
        providerConfig = $indexedDBProvider;
      });

    module('app');

    return inject(function () {
    });
  });

  beforeEach(inject(function ($indexedDB, _$q_) {
    this.subject = $indexedDB;
    return $q = _$q_;
  }));

  beforeEach(function () {
    return providerConfig.connection("testDB")
      .upgradeDatabase(1, function (event, db, txn) {
        return db.createObjectStore("TestObjects", {
          keyPath: 'id'
        });
      })
      .upgradeDatabase(2, function (event, db, txn) {
        var store;
        store = db.createObjectStore("ComplexTestObjects", {
          keyPath: 'id'
        });
        return store.createIndex("name", "name", {
          unique: false
        });
      });
  });

  afterEach(function (done) {
    return this.subject.deleteDatabase()["finally"](done);
  });

  describe('#openStore', function () {
    itPromises("returns the object store", function () {
      return this.subject.openStore("TestObjects", function (store) {
        return store.getAllKeys().then(function (keys) {
          return expect(keys.length).toEqual(0);
        });
      });
    });
    itPromises("throws an error for non-existent stores", function () {
      var called, notCalled;
      notCalled = sinon.spy();
      called = sinon.spy();
      return this.subject.openStore("NoSuchStore", notCalled)["catch"](function (problem) {
        expect(problem).toEqual("Object stores NoSuchStore do not exist.");
        return called();
      })["finally"](function () {
        expect(notCalled).not.toHaveBeenCalled();
        return expect(called).toHaveBeenCalled();
      });
    });
    describe("multiple transactions", function () {
      promiseBefore(function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo"
            }, {
              id: 2,
              data: "bar"
            }
          ]);
        });
      });
      itPromises("can open a transaction within a transaction", function () {
        return this.subject.openStore("TestObjects", (function (_this) {
          return function (store) {
            var p;
            p = store.insert;
            return _this.subject.openStore("TestObjects", function (store2) {
              return expect(store2).toBeTruthy();
            });
          };
        })(this));
      });
    });
    describe("#delete", function () {
      promiseBefore(function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo"
            }, {
              id: 2,
              data: "bar"
            }
          ]);
        });
      });
      itPromises("can delete an item", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store["delete"](1);
          return store.getAll().then(function (objects) {
            expect(objects.length).toEqual(1);
            return expect(objects[0].id).toEqual(2);
          });
        });
      });
      itPromises("errors gracefully when it doesn't exist", function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store["delete"](55);
        })["catch"](function () {
          return expect(true).toBeFalsy();
        });
      });
    });
    describe("#query", function () {
      promiseBefore(function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo",
              name: "bbb"
            }, {
              id: 2,
              data: "bar",
              name: "aaa"
            }, {
              id: 3,
              data: "woof",
              name: "zzz"
            }
          ]);
        });
      });
      itPromises("iterates by the index name with lt and lte", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          store.findWhere(store.query().$index("name")).then(function (results) {
            return expect(results[0].id).toEqual(2);
          });
          store.findWhere(store.query().$index("name").$lt("bbb")).then(function (results) {
            expect(results.length).toEqual(1);
            return expect(results[0].id).toEqual(2);
          });
          return store.findWhere(store.query().$index("name").$lte("bbb")).then(function (results) {
            expect(results.length).toEqual(2);
            expect(results[0].id).toEqual(2);
            return expect(results[1].id).toEqual(1);
          });
        });
      });
      itPromises("iterates by the index name with gt and gte", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          store.findWhere(store.query().$index("name")).then(function (results) {
            return expect(results[0].id).toEqual(2);
          });
          store.findWhere(store.query().$index("name").$gt("bbb")).then(function (results) {
            expect(results.length).toEqual(1);
            return expect(results[0].id).toEqual(3);
          });
          return store.findWhere(store.query().$index("name").$gte("bbb")).then(function (results) {
            expect(results.length).toEqual(2);
            expect(results[1].id).toEqual(3);
            return expect(results[0].id).toEqual(1);
          });
        });
      });
      itPromises("finds one object with $eq", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          return store.findWhere(store.query().$index("name").$eq("bbb")).then(function (results) {
            expect(results[0].id).toEqual(1);
            return expect(results.length).toEqual(1);
          });
        });
      });
      itPromises("finds two objects with $between", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          return store.findWhere(store.query().$index("name").$between("aaa", "bbb")).then(function (results) {
            expect(results[0].id).toEqual(2);
            return expect(results.length).toEqual(2);
          });
        });
      });
      itPromises("orders differently with $desc", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          return store.findWhere(store.query().$index("name").$desc()).then(function (results) {
            expect(results[0].id).toEqual(3);
            return expect(results.length).toEqual(3);
          });
        });
      });
    });
    describe("#find", function () {
      promiseBefore(function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo"
            }, {
              id: 2,
              data: "bar"
            }
          ]);
        });
      });
      itPromises("finds an existing item", function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.find(1).then(function (item) {
            return expect(item.data).toEqual("foo");
          });
        });
      });
      itPromises("returns the result of the callback to the receiver", function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.find(1);
        }).then(function (item) {
          expect(item.data).toEqual("foo");
          return true;
        });
      });
      itPromises("does not find a non-existent item", function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.find(404).then(function (item) {
            return expect(false).toBeTruthy();
          })["catch"](function (error) {
            return expect(true).toBeTruthy();
          });
        });
      });
    });
    describe("#each", function () {
      promiseBefore(function () {
        this.subject.openStore("TestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo",
              name: "bbb"
            }, {
              id: 2,
              data: "bar",
              name: "aaa"
            }
          ]);
        });
        return this.subject.openStore("ComplexTestObjects", function (store) {
          return store.insert([
            {
              id: 1,
              data: "foo",
              name: "bbb"
            }, {
              id: 2,
              data: "bar",
              name: "aaa"
            }
          ]);
        });
      });
      itPromises(" yields the items in succession", function () {
        return this.subject.openStore("TestObjects", function (store) {
          var i;
          i = 1;
          return store.each().then(null, null, function (item) {
            expect(item.id).toEqual(i);
            return i += 1;
          });
        });
      });
      itPromises(" yields the items in opposite succession given a different direction", function () {
        return this.subject.openStore("TestObjects", (function (_this) {
          return function (store) {
            var i;
            i = 2;
            return store.each({
              direction: _this.subject.queryDirection.descending
            }).then(null, null, function (item) {
              expect(item.id).toEqual(i);
              return i -= 1;
            });
          };
        })(this));
      });
      itPromises(" uses a range on the object keys", function () {
        return this.subject.openStore("TestObjects", (function (_this) {
          return function (store) {
            var i;
            i = 1;
            return store.each({
              beginKey: 1,
              endKey: 1
            }).then(null, null, function (item) {
              expect(item.id).toEqual(i);
              return i += 1;
            }).then(function (items) {
              return expect(items.length).toEqual(1);
            });
          };
        })(this));
      });
      itPromises(" can operate on an index", function () {
        return this.subject.openStore("ComplexTestObjects", function (store) {
          var i;
          i = 2;
          return store.eachBy("name").then(null, null, function (item) {
            expect(item.id).toEqual(i);
            return i -= 1;
          });
        });
      });
    });
    describe("#upsert", function () {
      itPromises("adds the item", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store.upsert({
            id: 1,
            data: "something"
          }).then(function (result) {
            return expect(result).toBeTruthy();
          });
          store.getAll().then(function (objects) {
            expect(objects.length).toEqual(1);
            return expect(objects[0].data).toEqual("something");
          });
          return store.find(1).then(function (object) {
            return expect(object.id).toEqual(1);
          });
        });
      });
      itPromises("when openStore returns nothing it doesn't fail", function () {
        this.subject.openStore("TestObjects", function (store) {
          store.upsert({
            id: 1,
            data: "something"
          }).then(function (result) {
            return expect(result).toBeTruthy();
          });
        });
        return this.subject.openStore("TestObjects", function (store) {
          return store.getAll().then(function (objects) {
            console.log("got all objects?", objects);
            return expect(objects.length).toEqual(1);
          });
        });
      });
      itPromises("can add an item of the same key twice", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store.upsert({
            id: 1,
            data: "something"
          });
          return store.upsert({
            id: 1,
            data: "somethingelse"
          })["catch"](function (errorMessage) {
            return expect(true).toBeFalsy();
          }).then(function () {
            return expect(true).toBeTruthy();
          });
        });
      });
      itPromises("can add multiple items", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store.upsert([
            {
              id: 1,
              data: "1"
            }, {
              id: 2,
              data: "2"
            }
          ]).then(function (result) {
            return expect(result).toBeTruthy();
          });
          store.getAll().then(function (objects) {
            return expect(objects.length).toEqual(2);
          });
          return store.count().then(function (count) {
            return expect(count).toEqual(2);
          });
        });
      });
    });
    describe("#insert", function () {
      itPromises("adds the item", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store.insert({
            id: 1,
            data: "something"
          }).then(function (result) {
            return expect(result).toBeTruthy();
          });
          store.getAll().then(function (objects) {
            expect(objects.length).toEqual(1);
            return expect(objects[0].data).toEqual("something");
          });
          return store.find(1).then(function (object) {
            return expect(object.id).toEqual(1);
          });
        });
      });
      itPromises("cannot add an item of the same key twice", function () {
        var failedCb, successCb;
        successCb = sinon.spy();
        failedCb = sinon.spy();
        return this.subject.openStore("TestObjects", function (store) {
          store.insert({
            id: 1,
            data: "something"
          });
          return store.insert({
            id: 1,
            data: "somethingelse"
          })["catch"](function (errorMessage) {
            expect(errorMessage).toEqual("Key already exists in the object store.");
            failedCb();
            return $q.reject("expected");
          }).then(successCb);
        })["catch"](function (error) {
          expect(error).toEqual("Transaction Error");
        })["finally"](function () {
          expect(successCb).not.toHaveBeenCalled();
          return expect(failedCb).toHaveBeenCalled();
        });
      });
      itPromises("can add multiple items", function () {
        return this.subject.openStore("TestObjects", function (store) {
          store.insert([
            {
              id: 1,
              data: "1"
            }, {
              id: 2,
              data: "2"
            }
          ]).then(function (result) {
            return expect(result).toBeTruthy();
          });
          store.getAll().then(function (objects) {
            return expect(objects.length).toEqual(2);
          });
          return store.count().then(function (count) {
            return expect(count).toEqual(2);
          });
        });
      });
      itPromises("does nothing for no items", function () {
        return this.subject.openStore("TestObjects", function (store) {
          return store.insert([]).then(function () {
            return expect(true).toBeTruthy();
          });
        });
      });
    });
  });

  describe("#openStores", function () {
    itPromises("returns the object stores", function () {
      return this.subject.openStores(["TestObjects", "ComplexTestObjects"], function (store1, store2) {

        store1.insert({id: 1, data: "foo"});
        store2.insert({id: 2, name: "barf"});

        store1.getAllKeys().then(function (keys) {
          expect(keys.length).toEqual(1);
        });
      });
    });
    itPromises("to cause a failure when the store does not exist.", function () {
      var success = sinon.spy();
      var fail = sinon.spy();

      return this.subject
        .openStores(["TestObjects", "NonExistentObjects"], success)
        .then(success, fail)
        .finally(function () {
          expect(success).not.toHaveBeenCalled();
          expect(fail).toHaveBeenCalledWith("Object stores TestObjects,NonExistentObjects do not exist.");
        });
    });
  });

  describe("#openAllStores", function () {
    itPromises("returns all the object stores", function () {
      return this.subject.openAllStores(function () {
        var stores;
        stores = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        expect(stores.length).toEqual(2);
        stores[0].insert({
          id: 1,
          data: "foo"
        });
        stores[1].insert({
          id: 2,
          name: "barf"
        });
        return stores[0].getAllKeys().then(function (keys) {
          return expect(keys.length).toEqual(1);
        });
      });
    });
  });

  describe('#flush', function () {
    itPromises("it flushes any waiting transactions", function () {
      return this.subject.openStore("TestObjects", (function (_this) {
        return function (store) {
          var i, _i;
          for (i = _i = 0; _i <= 10000; i = ++_i) {
            store.insert([
              {
                id: i,
                data: "foo",
                extra: "a" * i
              }
            ]);
          }
          return _this.subject.flush();
        };
      })(this));
    });
  });
});