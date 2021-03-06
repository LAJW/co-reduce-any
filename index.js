/******************************************************************************/
/**
 * Reduce anything in Co-like manner
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
    } else if (value === next) {
        return next
    } else if (isPromise(value)) {
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

function reduceStream(stream, generator) {
    return new Promise(function (resolve, reject) {
        var gen = generator(next)
        var promise = Promise.resolve(genStep(gen))
        .then(function (result) {
            if (result !== next) {
                resolve(result)
            }
        })
        var i = 0
        stream.on("data", function (chunk) {
            stream.pause()
            promise = promise.then(function () {
                return genStep(gen, [ i, chunk ])
            })
            .then(function (result) {
                if (result === next) {
                    i++
                    stream.resume()
                } else {
                    resolve(result)
                }
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
        } else if (value === next) {
            return _reduceGen(inGen, outGen)
        } else {
            return value
        }
    })
}

function reduceGen(inGen, generator) {
    var outGen = generator(next)
    return then(genStep(outGen), function (result) {
        if (result === next) {
            return _reduceGen(inGen, outGen)
        } else {
            return result
        }
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

