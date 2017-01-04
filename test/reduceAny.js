/* global it describe */

"use strict"

var forEach     = require("..")
var assert      = require("assert")
var streamArray = require("stream-array")

function* listIterations(next) {
    var key, pair, value
    var result = [ ]
    while (pair = yield next) {
        key   = pair[0]
        value = pair[1]
        result.push([ key, yield value ])
    }
    return result
}

describe("for-each", function () {

    it("throw typerror on non-iterable", function () {
        var caught
        try {
            forEach(null, listIterations)
        } catch (error) {
            caught = error
        }
        assert.ok(caught instanceof TypeError, "Should have thrown typeerror")
    })

    it("array synchronous, successful", function () {
        var array = [ "one", "two", "three" ]
        var result = forEach(array, listIterations)
        assert.deepEqual(result, [
            [ 0, "one" ],
            [ 1, "two" ],
            [ 2, "three" ],
        ])
    })

    it("map synchronous, successful", function () {
        var map = new Map([
            [ "one", "cat" ],
            [ "two", "dog" ],
            [ "three", "moose" ]
        ])
        var result = forEach(map, listIterations)
        assert.deepEqual(result, [
            [ "one", "cat" ],
            [ "two", "dog" ],
            [ "three", "moose" ]
        ])
    })

    it("array asynchronous, successful", function () {
        var array = [ "one", "two", "three" ].map(function (val) {
            return Promise.resolve(val)
        })
        return forEach(array, listIterations)
        .then(function (result) {
            assert.deepEqual(result, [
                [ 0, "one" ],
                [ 1, "two" ],
                [ 2, "three" ],
            ])
        })
    })

    it("object synchronous", function () {
        var object = {
            one   : "uno",
            two   : "dos",
            three : "tres",
        }
        var result = forEach(object, listIterations)
        assert.deepEqual(result, [
            [ "one", "uno" ],
            [ "two", "dos" ],
            [ "three", "tres" ],
        ])
    })

    it("throw error into generator on first iteration", function () {
        var obj = { }
        var caught
        return forEach([ 1 ], function* (next) {
            yield next // this shouldn't be mandatory
            try {
                yield Promise.reject(obj)
            } catch (err) {
                caught = err
            }
        })
        .then(function () {
            assert.strictEqual(caught, obj, "Should have caught the error")
        })
    })

    it("throw error into generator before first iteration", function () {
        var obj = { }
        var caught
        return forEach([ 1 ], function* () {
            try {
                yield Promise.reject(obj)
            } catch (err) {
                caught = err
            }
        })
        .then(function () {
            assert.strictEqual(caught, obj, "Should have caught the error")
        })
    })

    it("stream, successful", function () {
        var stream = streamArray([ "one", "two", "three", "four" ])
        return forEach(stream, function* (next) {
            var result = [ ]
            var chunk
            while (chunk = yield next) {
                result.push(chunk.toString().toUpperCase())
            }
            return result
        })
        .then(function (result) {
            assert.deepEqual(result, [ "ONE", "TWO", "THREE", "FOUR" ])
        })
    })

    it("stream async, successful", function () {
        var stream = streamArray([ "one", "two", "three", "four" ])
        return forEach(stream, function* (next) {
            var result = [ ]
            var chunk
            while (chunk = yield next) {
                result.push(yield Promise.resolve(chunk.toString().toUpperCase()))
            }
            return result
        })
        .then(function (result) {
            assert.deepEqual(result, [ "ONE", "TWO", "THREE", "FOUR" ])
        })
    })

    it("stream, throw before first chunk", function () {
        var obj = { }
        var stream = streamArray([ "one", "two", "three", "four" ])
        return forEach(stream, function* () {
            throw obj
        })
        .then(function () {
            throw new Error("Should have thrown")
        })
        .catch(function (result) {
            assert.strictEqual(result, obj)
        })
    })

    it("stream, throw on second chunk", function () {
        var obj = { }
        var stream = streamArray([ "one", "two", "three", "four" ])
        return forEach(stream, function* (next) {
            yield next
            throw obj
        })
        .then(function () {
            throw new Error("Should have thrown")
        })
        .catch(function (result) {
            assert.strictEqual(result, obj)
        })
    })

    it("stream, throw after last chunk", function () {
        var stream = streamArray([ "one", "two", "three", "four" ])
        return forEach(stream, function* (next) {
            var result = [ ]
            var chunk
            while (chunk = yield next) {
                result.push(chunk.toString().toUpperCase())
            }
            throw result
        })
        .then(function () {
            throw new Error("Should have thrown")
        })
        .catch(function (err) {
            assert.deepEqual(err, [ "ONE", "TWO", "THREE", "FOUR" ])
        })
    })

})
