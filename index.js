/******************************************************************************/
/**
 * Reduce anything in Co-like manner
 *
 * Provides a consistent interface for reducing arrays, strings,
 * object literals, maps, sets, generators and streams. Synchronously
 * when applicable.
 *
 * const collection = [ 1, 2, 3, 4 ]
 *
 * reduce(collection, function* (next) {
 *     const result = [ ]
 *     for (let pair; pair = yield next;) {
 *         const [ key, elem ] = pair
 *         const value = yield Promise.resolve(elem * key)
 *     }
 *     return result
 * }).then(result => console.log(resul))
 *
 * yield is overloaded
 *
 * value = yield promise // converts promise to a value, like Co
 * yield next            // waits for new [ key, element ] pair
 *
 * The key:
 * In arrays and strings, key is the elements' index
 * In Maps and object literals, key is the element's key
 * In generators Sets and node streams, key is the iteration's "i" provided
 * for consistency
 *
 * If no promises are yielded function returns a value returned from
 * supplied generator
 *
 * Iterates over node streams sequentially and always returns a promise.
 *
 * @module co-reduce-any
 * @author Lukasz A.J. Wrona <lukasz.andrzej.wrona@gmail.com>
 * @license MIT
 */
/******************************************************************************/

"use strict"
var typical = require("typical")
var Stream = require("stream")

/******************************************************************************/

var isPromise = typical.isPromise
var isObject = typical.isObject
var isIterable = typical.isIterable

var next = Object.freeze({ })

function* enumerateIterable(collection) {
    var elem
    var index = 0
    for (elem of collection) {
        yield [ index, elem ]
        index += 1
    }
}

// Enumerate map 1:1
function* enumerateMap(map) {
    var pair
    for (pair of map) {
        yield pair
    }
}

// Enumerate object literals
function* enumerateObject(object) {
    var key
    for (key in object) {
        yield [ key, object[key] ]
    }
}

// Inspired by Python's enumerate
function enumerate(collection) {
    if (isObject(collection)) {
        if (collection instanceof Map) {
            return enumerateMap(collection)
        } else if (isIterable(collection)) {
            return enumerateIterable(collection)
        } else {
            return enumerateObject(collection)
        }
    } else {
        throw new TypeError("Object cannot be enumerated")
    }
}

function then(value, proc) {
    return isPromise(value) ? value.then(proc) : proc(value)
}

function genStep(gen, chunk, err) {
    var done, state, value
    if (err) {
        state = gen.throw(err)
    } else {
        state = gen.next(chunk)
    }
    done = state.done
    value = state.value
    if (done) {
        return value
    } else if (value !== next) {
        if (isPromise(value)) {
            return value.catch(function (err) {
                return genStep(gen, undefined, err)
            })
            .then(function (value) {
                return genStep(gen, value)
            })
        } else {
            return genStep(gen, value)
        }
    }
}

function reduceStream(stream, generator) {
    return new Promise(function (resolve, reject) {
        var gen = generator(next)
        var promise = Promise.resolve(genStep(gen))
        stream.on("data", function (chunk) {
            stream.pause()
            promise = promise.then(function () {
                stream.resume()
                return genStep(gen, chunk)
            })
            .catch(reject)
        })
        stream.on("error", reject)
        stream.on("end", function () {
            promise = promise.then(function () {
                return genStep(gen)
            })
            .then(resolve, reject)
        })
    })
}

function _reduceGen(inGen, outGen) {
    var state = inGen.next()
    return then(genStep(outGen, state.value), function (value) {
        if (state.done) {
            return then(genStep(outGen), function () {
                return value
            })
        } else {
            return _reduceGen(inGen, outGen)
        }
    })
}

function reduceGen(inGen, generator) {
    var outGen = generator(next)
    return then(genStep(outGen), function () {
        return _reduceGen(inGen, outGen)
    })
}

function reduceAny(collection, generator) {
    if (collection instanceof Stream) {
        return reduceStream(collection, generator)
    } else {
        return reduceGen(enumerate(collection), generator)
    }
}

module.exports = reduceAny

