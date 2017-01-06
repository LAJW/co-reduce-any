# co-reduce-any

[![Build Status][travis-img]][travis-url]
[![Coverage Status][coveralls-img]][coveralls-url]
[![Dependencies][david-img]][david-url]
[![devDependency Status][david-dev-img]][david-dev-url]
[![Github Releases][release-img]][release-url]
[![GitHub license][license-img]][license-url]
[![Node version][node-img]][node-url]


## Reduce anything in [Co](https://www.npmjs.com/package/co)-like manner

Provides a consistent interface for reducing arrays, strings,
object literals, maps, sets, generators and streams. Synchronously
whenever possible.

# Installation

```bash
yarn add co-reduce-any
npm i -S co-reduce-any
```

# Usage

`reduce` behaves like [Co](https://www.npmjs.com/package/co), except
it's supplied with helper `next` object. Yielding `next` returns next
pair of the iteration or `undefined` when there are no more elements.

Additionally if no promises were yielded, function returns by
value. Always returns a promise when iterating over streams.

```javascript

const reduce = require("co-reduce-any")

const collection = [ 1, 2, 3, 4 ]

reduce(collection, function* (next) {
    const result = [ ]
    for (let pair; pair = yield next;) {
        const [ key, elem ] = pair
        const value = yield Promise.resolve(elem * key)
        result.push(value)
    }
    return result
}).then(result => console.log(result))

```

Key points:

```javascript
value = yield promise // extract value from promise or throw, just like Co
yield next            // waits for next [ key, element ] pair
```

# What's the pair?

Pair is a 2-element array containing in order the key and the value of
current element.

- In arrays and strings, key is the elements' index
- In ES6 Maps and object literals, key is the element's key
- In generators, ES6 Sets and node streams, key is the iteration's "i"
provided for consistency

It's to preserve consistency with `for...of` loop over ES6 Map. That
way you can write algorithms that work on any kind of collection.


[travis-img]: https://travis-ci.org/LAJW/co-reduce-any.svg?branch=master
[travis-url]: https://travis-ci.org/LAJW/co-reduce-any
[coveralls-img]: https://coveralls.io/repos/github/LAJW/co-reduce-any/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/LAJW/co-reduce-any?branch=master
[david-img]: https://david-dm.org/lajw/co-reduce-any.svg
[david-url]: https://david-dm.org/lajw/co-reduce-any
[david-dev-img]: https://david-dm.org/lajw/co-reduce-any/dev-status.svg
[david-dev-url]: https://david-dm.org/lajw/co-reduce-any#info=devDependencies
[release-img]: https://img.shields.io/github/release/lajw/co-reduce-any.svg
[release-url]: https://github.com/lajw/co-reduce-any/releases
[license-img]: https://img.shields.io/badge/license-MIT-blue.svg
[license-url]: https://raw.githubusercontent.com/lajw/co-reduce-any/master/LICENSE
[node-img]: https://img.shields.io/node/v/co-reduce-any.svg
[node-url]: https://npmjs.org/package/co-reduce-any 
