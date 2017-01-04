# co-reduce-any

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

# Requirements

 - Node 4.7 and greater

