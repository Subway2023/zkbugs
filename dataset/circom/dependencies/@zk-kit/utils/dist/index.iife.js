/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
var zkKitUtils = (function (exports) {
  'use strict';

  var global$1 = (typeof global !== "undefined" ? global :
    typeof self !== "undefined" ? self :
    typeof window !== "undefined" ? window : {});

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;
  function init () {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray (b64) {
    if (!inited) {
      init();
    }
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4')
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

    // base64 is 4/3 + up to two characters of the original data
    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = (tmp >> 16) & 0xFF;
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
      arr[L++] = (tmp >> 8) & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr
  }

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
  }

  function encodeChunk (uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
      output.push(tripletToBase64(tmp));
    }
    return output.join('')
  }

  function fromByteArray (uint8) {
    if (!inited) {
      init();
    }
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[(tmp << 4) & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
      output += lookup[tmp >> 10];
      output += lookup[(tmp >> 4) & 0x3F];
      output += lookup[(tmp << 2) & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('')
  }

  function read (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? (nBytes - 1) : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & ((1 << (-nBits)) - 1);
    s >>= (-nBits);
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & ((1 << (-nBits)) - 1);
    e >>= (-nBits);
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : ((s ? -1 : 1) * Infinity)
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
  }

  function write (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
    var i = isLE ? 0 : (nBytes - 1);
    var d = isLE ? 1 : -1;
    var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = (e << mLen) | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString = {}.toString;

  var isArray$1 = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

  /*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */
  /* eslint-disable no-proto */


  var INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
    ? global$1.TYPED_ARRAY_SUPPORT
    : true;

  /*
   * Export kMaxLength after typed array support is determined.
   */
  kMaxLength();

  function kMaxLength () {
    return Buffer.TYPED_ARRAY_SUPPORT
      ? 0x7fffffff
      : 0x3fffffff
  }

  function createBuffer (that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length')
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }

    return that
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer (arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length)
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error(
          'If encoding is specified then the first argument must be a string'
        )
      }
      return allocUnsafe(this, arg)
    }
    return from(this, arg, encodingOrOffset, length)
  }

  Buffer.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr
  };

  function from (that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number')
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length)
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset)
    }

    return fromObject(that, value)
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length)
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
    if (typeof Symbol !== 'undefined' && Symbol.species &&
        Buffer[Symbol.species] === Buffer) ;
  }

  function assertSize (size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number')
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative')
    }
  }

  function alloc (that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size)
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string'
        ? createBuffer(that, size).fill(fill, encoding)
        : createBuffer(that, size).fill(fill)
    }
    return createBuffer(that, size)
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding)
  };

  function allocUnsafe (that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size)
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size)
  };

  function fromString (that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding')
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that
  }

  function fromArrayLike (that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that
  }

  function fromArrayBuffer (that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds')
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds')
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that
  }

  function fromObject (that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that
      }

      obj.copy(that, 0, 0, len);
      return that
    }

    if (obj) {
      if ((typeof ArrayBuffer !== 'undefined' &&
          obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0)
        }
        return fromArrayLike(that, obj)
      }

      if (obj.type === 'Buffer' && isArray$1(obj.data)) {
        return fromArrayLike(that, obj.data)
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
  }

  function checked (length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                           'size: 0x' + kMaxLength().toString(16) + ' bytes')
    }
    return length | 0
  }
  Buffer.isBuffer = isBuffer$1;
  function internalIsBuffer (b) {
    return !!(b != null && b._isBuffer)
  }

  Buffer.compare = function compare (a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers')
    }

    if (a === b) return 0

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  Buffer.isEncoding = function isEncoding (encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true
      default:
        return false
    }
  };

  Buffer.concat = function concat (list, length) {
    if (!isArray$1(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }

    if (list.length === 0) {
      return Buffer.alloc(0)
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer
  };

  function byteLength (string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
        (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2
        case 'hex':
          return len >>> 1
        case 'base64':
          return base64ToBytes(string).length
        default:
          if (loweredCase) return utf8ToBytes(string).length // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;

  function slowToString (encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return ''
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return ''
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return ''
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end)

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end)

        case 'ascii':
          return asciiSlice(this, start, end)

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end)

        case 'base64':
          return base64Slice(this, start, end)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer.prototype._isBuffer = true;

  function swap (b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16 () {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits')
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this
  };

  Buffer.prototype.swap32 = function swap32 () {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits')
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this
  };

  Buffer.prototype.swap64 = function swap64 () {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits')
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this
  };

  Buffer.prototype.toString = function toString () {
    var length = this.length | 0;
    if (length === 0) return ''
    if (arguments.length === 0) return utf8Slice(this, 0, length)
    return slowToString.apply(this, arguments)
  };

  Buffer.prototype.equals = function equals (b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
    if (this === b) return true
    return Buffer.compare(this, b) === 0
  };

  Buffer.prototype.inspect = function inspect () {
    var str = '';
    var max = INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>'
  };

  Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer')
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index')
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0
    }
    if (thisStart >= thisEnd) {
      return -1
    }
    if (start >= end) {
      return 1
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break
      }
    }

    if (x < y) return -1
    if (y < x) return 1
    return 0
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset;  // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : (buffer.length - 1);
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1
      else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;
      else return -1
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer.TYPED_ARRAY_SUPPORT &&
          typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
        }
      }
      return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
    }

    throw new TypeError('val must be string, number or Buffer')
  }

  function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' ||
          encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read (buf, i) {
      if (indexSize === 1) {
        return buf[i]
      } else {
        return buf.readUInt16BE(i * indexSize)
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break
          }
        }
        if (found) return i
      }
    }

    return -1
  }

  Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1
  };

  Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
  };

  function hexWrite (buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i
      buf[offset + i] = parsed;
    }
    return i
  }

  function utf8Write (buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
  }

  function asciiWrite (buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length)
  }

  function latin1Write (buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length)
  }

  function base64Write (buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length)
  }

  function ucs2Write (buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
  }

  Buffer.prototype.write = function write (string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
    // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
    // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
    // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error(
        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
      )
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds')
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length)

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length)

        case 'ascii':
          return asciiWrite(this, string, offset, length)

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length)

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length)

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length)

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON () {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    }
  };

  function base64Slice (buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf)
    } else {
      return fromByteArray(buf.slice(start, end))
    }
  }

  function utf8Slice (buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = (firstByte > 0xEF) ? 4
        : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
        : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res)
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray (codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(
        String,
        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
      );
    }
    return res
  }

  function asciiSlice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret
  }

  function latin1Slice (buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret
  }

  function hexSlice (buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out
  }

  function utf16leSlice (buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res
  }

  Buffer.prototype.slice = function slice (start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset (offset, ext, length) {
    if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
  }

  Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val
  };

  Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val
  };

  Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset]
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | (this[offset + 1] << 8)
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return (this[offset] << 8) | this[offset + 1]
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return ((this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16)) +
        (this[offset + 3] * 0x1000000)
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] * 0x1000000) +
      ((this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      this[offset + 3])
  };

  Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val
  };

  Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return (this[offset])
    return ((0xff - this[offset] + 1) * -1)
  };

  Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | (this[offset + 1] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | (this[offset] << 8);
    return (val & 0x8000) ? val | 0xFFFF0000 : val
  };

  Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16) |
      (this[offset + 3] << 24)
  };

  Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] << 24) |
      (this[offset + 1] << 16) |
      (this[offset + 2] << 8) |
      (this[offset + 3])
  };

  Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4)
  };

  Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4)
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8)
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8)
  };

  function checkInt (buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = (value / mul) & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = (value & 0xff);
    return offset + 1
  };

  function objectWriteUInt16 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
        (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  function objectWriteUInt32 (buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = (value >>> 24);
      this[offset + 2] = (value >>> 16);
      this[offset + 1] = (value >>> 8);
      this[offset] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
    }

    return offset + byteLength
  };

  Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = (value & 0xff);
    return offset + 1
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 8);
      this[offset + 1] = (value & 0xff);
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value & 0xff);
      this[offset + 1] = (value >>> 8);
      this[offset + 2] = (value >>> 16);
      this[offset + 3] = (value >>> 24);
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = (value >>> 24);
      this[offset + 1] = (value >>> 16);
      this[offset + 2] = (value >>> 8);
      this[offset + 3] = (value & 0xff);
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4
  };

  function checkIEEE754 (buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range')
    if (offset < 0) throw new RangeError('Index out of range')
  }

  function writeFloat (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4);
    }
    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert)
  };

  function writeDouble (buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8);
    }
    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert)
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert)
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy (target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0
    if (target.length === 0 || this.length === 0) return 0

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds')
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
    if (end < 0) throw new RangeError('sourceEnd out of bounds')

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(
        target,
        this.subarray(start, start + len),
        targetStart
      );
    }

    return len
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill (val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string')
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding)
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index')
    }

    if (end <= start) {
      return this
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val)
        ? val
        : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean (str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return ''
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str
  }

  function stringtrim (str) {
    if (str.trim) return str.trim()
    return str.replace(/^\s+|\s+$/g, '')
  }

  function toHex (n) {
    if (n < 16) return '0' + n.toString(16)
    return n.toString(16)
  }

  function utf8ToBytes (string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue
          }

          // valid lead
          leadSurrogate = codePoint;

          continue
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break
        bytes.push(
          codePoint >> 0x6 | 0xC0,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break
        bytes.push(
          codePoint >> 0xC | 0xE0,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break
        bytes.push(
          codePoint >> 0x12 | 0xF0,
          codePoint >> 0xC & 0x3F | 0x80,
          codePoint >> 0x6 & 0x3F | 0x80,
          codePoint & 0x3F | 0x80
        );
      } else {
        throw new Error('Invalid code point')
      }
    }

    return bytes
  }

  function asciiToBytes (str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray
  }

  function utf16leToBytes (str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray
  }


  function base64ToBytes (str) {
    return toByteArray(base64clean(str))
  }

  function blitBuffer (src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if ((i + offset >= dst.length) || (i >= src.length)) break
      dst[i + offset] = src[i];
    }
    return i
  }

  function isnan (val) {
    return val !== val // eslint-disable-line no-self-compare
  }


  // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  function isBuffer$1(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
  }

  function isFastBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
  }

  /**
   * @module TypeChecks
   * This module provides utility functions to check data types.
   * It defines a set of supported types and includes functions to check if
   * a value is defined and if it matches a supported type. These functions
   * are useful for type checking and validation in the other libraries,
   * enhancing code robustness and reliability.
   */
  /** @internal */
  const supportedTypes = [
      "number",
      "string",
      "function",
      "Array",
      "Uint8Array",
      "Buffer",
      "object",
      "bigint",
      "stringified-bigint",
      "hexadecimal",
      "bignumber",
      "bignumberish"
  ];
  /**
   * Returns true if the value is defined, false otherwise.
   * @param value The value to be checked.
   */
  function isDefined(value) {
      return typeof value !== "undefined";
  }
  /**
   * Returns true if the value is a number, false otherwise.
   * @param value The value to be checked.
   */
  function isNumber(value) {
      return typeof value === "number";
  }
  /**
   * Returns true if the value is a string, false otherwise.
   * @param value The value to be checked.
   */
  function isString(value) {
      return typeof value === "string";
  }
  /**
   * Returns true if the value is a function, false otherwise.
   * @param value The value to be checked.
   */
  function isFunction(value) {
      return typeof value === "function";
  }
  /**
   * Returns true if the value is an object, false otherwise.
   * Please, note that arrays are also objects in JavaScript.
   * @param value The value to be checked.
   */
  function isObject(value) {
      return typeof value === "object";
  }
  /**
   * Returns true if the value is an Array instance, false otherwise.
   * @param value The value to be checked.
   */
  function isArray(value) {
      return isObject(value) && Array.isArray(value);
  }
  /**
   * Returns true if the value is a Uint8Array instance, false otherwise.
   * @param value The value to be checked.
   */
  function isUint8Array(value) {
      return value instanceof Uint8Array;
  }
  /**
   * Returns true if the value is a Buffer instance, false otherwise.
   * @param value The value to be checked.
   */
  function isBuffer(value) {
      return Buffer.isBuffer(value);
  }
  /**
   * Returns true if the value is a bigint, false otherwise.
   * @param value The value to be checked.
   */
  function isBigInt(value) {
      return typeof value === "bigint";
  }
  /**
   * Checks if the given value is a string that represents a valid bigint.
   * @param value The value to be checked if it's a stringified bigint.
   */
  function isStringifiedBigInt(value) {
      // Check if value is a string first.
      if (!isString(value)) {
          return false;
      }
      try {
          // Attempt to convert the string to BigInt.
          BigInt(value);
          return true;
      }
      catch {
          return false;
      }
  }
  /**
   * Checks if a string is a valid hexadecimal string representation.
   * If 'prefix' is 'true', the string must start with '0x' or '0X' followed by one or more
   * hexadecimal digits (0-9, a-f, A-F), otherwise no prefix is expected. 'prefix' is optional and
   * if its value it is not explicitly defined it will be set to 'true' by default.
   * @param value The string to be tested.
   * @param prefix A boolean to include or not a '0x' or '0X' prefix.
   */
  function isHexadecimal(value, prefix = true) {
      if (!isString(value)) {
          return false;
      }
      if (prefix) {
          return /^(0x|0X)[0-9a-fA-F]+$/.test(value);
      }
      return /^[0-9a-fA-F]+$/.test(value);
  }
  /**
   * Checks if the given value can be considered as BigNumber.
   * A value is considered a BigNumber if it is a bigint or a string
   * that can be converted to a bigint (via `Bigint(s)`).
   * @param value The value to check.
   */
  function isBigNumber(value) {
      return isBigInt(value) || isStringifiedBigInt(value);
  }
  /**
   * Checks if the given value can be considered as BigNumberish.
   * A value is considered BigNumberish if it meets
   * any of the following conditions: it's a number, a bigint, a string
   * that can be converted to a bigint, a hexadecimal
   * string, or a Buffer object.
   * @param value The value to check.
   */
  function isBigNumberish(value) {
      return (isNumber(value) ||
          isBigInt(value) ||
          isStringifiedBigInt(value) ||
          isHexadecimal(value) ||
          isBuffer(value) ||
          isUint8Array(value));
  }
  /**
   * Returns true if the value type is the same as the type passed
   * as the second parameter, false otherwise.
   * @param value
   * @param type The expected type.
   */
  function isType(value, type) {
      switch (type) {
          case "number":
              return isNumber(value);
          case "string":
              return isString(value);
          case "function":
              return isFunction(value);
          case "Array":
              return isArray(value);
          case "Uint8Array":
              return isUint8Array(value);
          case "Buffer":
              return isBuffer(value);
          case "object":
              return isObject(value);
          case "bigint":
              return isBigInt(value);
          case "stringified-bigint":
              return isStringifiedBigInt(value);
          case "hexadecimal":
              return isHexadecimal(value);
          case "bignumber":
              return isBigNumber(value);
          case "bignumberish":
              return isBigNumberish(value);
          default:
              return false;
      }
  }
  /**
   * Returns true if the type is being supported by this utility
   * functions, false otherwise.
   * @param type The type to be checked.
   */
  function isSupportedType(type) {
      return supportedTypes.includes(type);
  }

  var typeChecks = /*#__PURE__*/Object.freeze({
    __proto__: null,
    isArray: isArray,
    isBigInt: isBigInt,
    isBigNumber: isBigNumber,
    isBigNumberish: isBigNumberish,
    isBuffer: isBuffer,
    isDefined: isDefined,
    isFunction: isFunction,
    isHexadecimal: isHexadecimal,
    isNumber: isNumber,
    isObject: isObject,
    isString: isString,
    isStringifiedBigInt: isStringifiedBigInt,
    isSupportedType: isSupportedType,
    isType: isType,
    isUint8Array: isUint8Array,
    supportedTypes: supportedTypes
  });

  /**
   * @module ErrorHandlers
   * This module is designed to provide utility functions for validating
   * function parameters. It includes functions that throw type errors if
   * the parameters do not meet specified criteria, such as being defined,
   * a number, a string, a function, or an array. This module helps ensure
   * that functions receive the correct types of inputs, enhancing code
   * reliability and reducing runtime errors.
   */
  /**
   * @throws Throws a type error if the parameter value has not been defined.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireDefined(parameterValue, parameterName) {
      if (!isDefined(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not defined`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a number.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireNumber(parameterValue, parameterName) {
      if (!isNumber(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a number, received type: ${typeof parameterValue}`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a string.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireString(parameterValue, parameterName) {
      if (!isString(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a string, received type: ${typeof parameterValue}`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a function.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireFunction(parameterValue, parameterName) {
      if (!isFunction(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a function, received type: ${typeof parameterValue}`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not an Array.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireArray(parameterValue, parameterName) {
      if (!isArray(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not an Array instance`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a Uint8Array.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireUint8Array(parameterValue, parameterName) {
      if (!isUint8Array(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a Uint8Array instance`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a Buffer.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireBuffer(parameterValue, parameterName) {
      if (!isBuffer(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a Buffer instance`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not an object.
   * Please, note that arrays are also objects in JavaScript.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireObject(parameterValue, parameterName) {
      if (!isObject(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not an object, received type: ${typeof parameterValue}`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a bigint.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireBigInt(parameterValue, parameterName) {
      if (!isBigInt(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a bigint, received type: ${typeof parameterValue}`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a stringified bigint.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireStringifiedBigInt(parameterValue, parameterName) {
      if (!isStringifiedBigInt(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a stringified bigint`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a hexadecimal string.
   * If 'prefix' is 'true', the string must start with '0x' or '0X' followed by one or more
   * hexadecimal digits (0-9, a-f, A-F), otherwise no prefix is expected. 'prefix' is optional and
   * if its value it is not explicitly defined it will be set to 'true' by default.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   * @param prefix A boolean to include or not a '0x' or '0X' prefix.
   */
  function requireHexadecimal(parameterValue, parameterName, prefix = true) {
      if (!isHexadecimal(parameterValue, prefix)) {
          throw new TypeError(`Parameter '${parameterName}' is not a hexadecimal string`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a bignumber.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireBigNumber(parameterValue, parameterName) {
      if (!isBigNumber(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a bignumber`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value is not a bignumber-ish.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireBigNumberish(parameterValue, parameterName) {
      if (!isBigNumberish(parameterValue)) {
          throw new TypeError(`Parameter '${parameterName}' is not a bignumber-ish`);
      }
  }
  /**
   * @throws Throws a type error if the parameter value type is not part of the list of types.
   * @param parameterValue The parameter value.
   * @param parameterName The parameter name.
   */
  function requireTypes(parameterValue, parameterName, types) {
      for (const type of types) {
          if (!isSupportedType(type)) {
              throw new Error(`Type '${type}' is not supported`);
          }
      }
      for (const type of types) {
          if (isType(parameterValue, type)) {
              return;
          }
      }
      throw new TypeError(`Parameter '${parameterName}' is none of the following types: ${types.join(", ")}`);
  }

  var errorHandlers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    requireArray: requireArray,
    requireBigInt: requireBigInt,
    requireBigNumber: requireBigNumber,
    requireBigNumberish: requireBigNumberish,
    requireBuffer: requireBuffer,
    requireDefined: requireDefined,
    requireFunction: requireFunction,
    requireHexadecimal: requireHexadecimal,
    requireNumber: requireNumber,
    requireObject: requireObject,
    requireString: requireString,
    requireStringifiedBigInt: requireStringifiedBigInt,
    requireTypes: requireTypes,
    requireUint8Array: requireUint8Array
  });

  /**
   * @module Conversions
   * This module provides a collection of utility functions for converting
   * between different numerical formats, particularly focusing on
   * conversions involving bigints, hexadecimals and buffers.
   * The module is structured with clear function naming to indicate
   * the conversion direction (e.g., `bigIntToHexadecimal` for BigInt
   * to hexadecimal, `bufferToBigInt` for buffer to bigint) and employs
   * type checks to ensure the correct handling of various input types.
   * It also includes variations for both big-endian (`be`) and little-endian
   * (`le`) conversions. It is important to note that when there is no prefix,
   * the order of bytes is always big-endian.
   */
  /**
   * Converts a bigint to a hexadecimal string.
   * @param value The bigint value to convert.
   * @returns The hexadecimal representation of the bigint.
   */
  function bigIntToHexadecimal(value) {
      requireBigInt(value, "value");
      let hex = value.toString(16);
      // Ensure even length.
      if (hex.length % 2 !== 0) {
          hex = `0${hex}`;
      }
      return hex;
  }
  /**
   * Converts a hexadecimal string to a bigint. The input is interpreted as hexadecimal
   * with or without a '0x' prefix. It uses big-endian byte order.
   * @param value The hexadecimal string to convert.
   * @returns The bigint representation of the hexadecimal string.
   */
  function hexadecimalToBigInt(value) {
      if (!isHexadecimal(value) && !isHexadecimal(value, false)) {
          throw new TypeError(`Parameter 'value' is not a hexadecimal string`);
      }
      // Ensure the hex string starts with '0x'.
      const formattedHexString = value.startsWith("0x") ? value : `0x${value}`;
      return BigInt(formattedHexString);
  }
  /**
   * Converts a buffer of bytes to a bigint using big-endian byte order.
   * It accepts 'Buffer' or 'Uint8Array'.
   * @param value The buffer to convert.
   * @returns The bigint representation of the buffer's contents.
   */
  function beBufferToBigInt(value) {
      requireTypes(value, "value", ["Buffer", "Uint8Array"]);
      return BigInt(`0x${Buffer.from(value).toString("hex")}`);
  }
  /**
   * Converts a buffer to a bigint using little-endian byte order.
   * It accepts 'Buffer' or 'Uint8Array'.
   * @param value The buffer to convert.
   * @returns The bigint representation of the buffer's contents in little-endian.
   */
  function leBufferToBigInt(value) {
      requireTypes(value, "value", ["Buffer", "Uint8Array"]);
      return BigInt(`0x${Buffer.from(value).reverse().toString("hex")}`);
  }
  /**
   * Converts a buffer to a bigint. Alias for beBufferToBigInt.
   * @param value The buffer to convert.
   * @returns The bigint representation of the buffer's contents.
   */
  function bufferToBigInt(value) {
      return beBufferToBigInt(value);
  }
  /**
   * Converts a bigint to a buffer and fills with zeros if a valid
   * size (i.e. number of bytes) is specified. If the size is not defined,
   * it gets the size from the given bigint. If the specified size is smaller than
   * the size of the bigint (i.e. `minSize`), an error is thrown.
   * It uses big-endian byte order.
   * @param value The bigint to convert.
   * @param size The number of bytes of the buffer to return.
   * @returns The buffer representation of the bigint.
   */
  function beBigIntToBuffer(value, size) {
      const hex = bigIntToHexadecimal(value);
      // Calculate the minimum buffer size required to represent 'n' in bytes.
      // Each hexadecimal character represents 4 bits, so 2 characters are 1 byte.
      const minSize = Math.ceil(hex.length / 2);
      if (!size) {
          size = minSize;
      }
      else if (size < minSize) {
          throw Error(`Size ${size} is too small, need at least ${minSize} bytes`);
      }
      // Allocate buffer of the desired size, filled with zeros.
      const buffer = Buffer.alloc(size, 0);
      const fromHex = Buffer.from(hex, "hex");
      fromHex.copy(buffer, size - fromHex.length);
      return buffer;
  }
  /**
   * Converts a bigint to a buffer and fills with zeros if a valid
   * size (i.e. number of bytes) is specified. If the size is not defined,
   * it gets the size from the given bigint. If the specified size is smaller than
   * the size of the bigint (i.e. `minSize`), an error is thrown.
   * It uses little-endian byte order.
   * @param value The bigint to convert.
   * @param size The number of bytes of the buffer to return.
   * @returns The buffer representation of the bigint in little-endian.
   */
  function leBigIntToBuffer(value, size) {
      const hex = bigIntToHexadecimal(value);
      // Calculate the minimum buffer size required to represent 'n' in bytes.
      // Each hexadecimal character represents 4 bits, so 2 characters are 1 byte.
      const minSize = Math.ceil(hex.length / 2);
      if (!size) {
          size = minSize;
      }
      else if (size < minSize) {
          throw Error(`Size ${size} is too small, need at least ${minSize} bytes`);
      }
      // Allocate buffer of the desired size, filled with zeros.
      const buffer = Buffer.alloc(size, 0);
      const fromHex = Buffer.from(hex, "hex").reverse();
      fromHex.copy(buffer, 0);
      return buffer;
  }
  /**
   * Converts a bigint to a buffer. Alias for beBigIntToBuffer.
   * @param value The bigint to convert.
   * @returns The buffer representation of the bigint.
   */
  function bigIntToBuffer(value) {
      return beBigIntToBuffer(value);
  }
  /**
   * Converts a BigNumberish type to a bigint. If the input is already a bigint,
   * the return value will be the bigint itself, otherwise it will be converted
   * to a bigint using big-endian byte order.
   * @param value The BigNumberish value to convert.
   * @returns The bigint representation of the BigNumberish value.
   */
  function bigNumberishToBigInt(value) {
      requireBigNumberish(value, "value");
      if (isBuffer(value) || isUint8Array(value)) {
          return bufferToBigInt(value);
      }
      return BigInt(value);
  }
  /**
   * Converts a BigNumberish type to a buffer. If the input is already a buffer,
   * the return value will be the buffer itself, otherwise it will be converted
   * to a buffer using big-endian byte order.
   * @param value The BigNumberish value to convert.
   * @returns The buffer representation of the BigNumberish value.
   */
  function bigNumberishToBuffer(value) {
      requireBigNumberish(value, "value");
      if (isBuffer(value) || isUint8Array(value)) {
          return Buffer.from(value);
      }
      return bigIntToBuffer(bigNumberishToBigInt(value));
  }
  /**
   * Converts an hexadecimal string to a buffer. The hexadecimal string
   * should not start with '0x' or '0X'. It keeps the bytes in the same order.
   * @param value The hexadecimal string to convert.
   * @returns The buffer representation of the hexadecimal string.
   */
  function hexadecimalToBuffer(value) {
      requireHexadecimal(value, "value", false);
      // Ensure even length before converting to buffer.
      if (value.length % 2 !== 0) {
          value = `0${value}`;
      }
      return Buffer.from(value, "hex");
  }
  /**
   * Converts a buffer to a hexadecimal string. It accepts 'Buffer' or 'Uint8Array'.
   * The hexadecimal string will not start with '0x' or '0X'. It keeps the bytes in the same order.
   * @param value The buffer to convert.
   * @returns The converted hexadecimal string.
   */
  function bufferToHexadecimal(value) {
      requireTypes(value, "value", ["Buffer", "Uint8Array"]);
      return Buffer.from(value).toString("hex");
  }
  /**
   * Converts bytes to a base64 string. It accepts 'Buffer' or 'Uint8Array'.
   * @param value The bytes to convert.
   * @returns The converted base64 string.
   */
  function bufferToBase64(value) {
      requireTypes(value, "value", ["Buffer", "Uint8Array"]);
      return Buffer.from(value).toString("base64");
  }
  /**
   * Converts a base64 string to bytes (i.e. a buffer). This function does not check
   * if the input value is a valid base64 string. If there are unsupported characters
   * they will be ignored.
   * @param value The base64 string to convert.
   * @returns The converted buffer.
   */
  function base64ToBuffer(value) {
      requireString(value, "value");
      return Buffer.from(value, "base64");
  }
  /**
   * Converts text (utf8) to a base64 string.
   * @param value The text to convert.
   * @returns The converted base64 string.
   */
  function textToBase64(value) {
      requireString(value, "value");
      return Buffer.from(value, "utf8").toString("base64");
  }
  /**
   * Converts a base64 string to text (utf8). This function does not check
   * if the input value is a valid base64 string. If there are unsupported characters
   * they could be ignored and the result may be unexpected.
   * @param value The base64 string to convert.
   * @returns The converted text.
   */
  function base64ToText(value) {
      requireString(value, "value");
      return Buffer.from(value, "base64").toString("utf8");
  }

  var conversions = /*#__PURE__*/Object.freeze({
    __proto__: null,
    base64ToBuffer: base64ToBuffer,
    base64ToText: base64ToText,
    beBigIntToBuffer: beBigIntToBuffer,
    beBufferToBigInt: beBufferToBigInt,
    bigIntToBuffer: bigIntToBuffer,
    bigIntToHexadecimal: bigIntToHexadecimal,
    bigNumberishToBigInt: bigNumberishToBigInt,
    bigNumberishToBuffer: bigNumberishToBuffer,
    bufferToBase64: bufferToBase64,
    bufferToBigInt: bufferToBigInt,
    bufferToHexadecimal: bufferToHexadecimal,
    hexadecimalToBigInt: hexadecimalToBigInt,
    hexadecimalToBuffer: hexadecimalToBuffer,
    leBigIntToBuffer: leBigIntToBuffer,
    leBufferToBigInt: leBufferToBigInt,
    textToBase64: textToBase64
  });

  /**
   * Generates a secure random sequence of bytes using the Web Cryptography API.
   * @param size The number of bytes to generate.
   * @returns A Uint8Array containing the generated random bytes.
   */
  /* eslint-disable import/prefer-default-export */
  function getRandomValues(size) {
      if (size <= 0)
          throw Error(`size ${size} is too small, need at least 1`);
      return crypto.getRandomValues(new Uint8Array(size));
  }

  var crypto_browser = /*#__PURE__*/Object.freeze({
    __proto__: null,
    getRandomValues: getRandomValues
  });

  /**
   * @module Scalar
   * This module provides utility functions for performing scalar operations
   * within a field, especially designed to handle operations on bigints.
   * The operations include scalar inversion (`inv`), scalar exponentiation (`pow`),
   * and modular reduction. Functions are carefully implemented to ensure
   * mathematical correctness and efficiency, supporting both positive and
   * negative bigint values. The module aims to provide robust tools for
   * cryptographic calculations and other applications requiring high-precision
   * arithmetic in fields.
   */
  /**
   * Checks if a bigint scalar value is zero.
   * @param a The bigint scalar value to check.
   * @returns True if 'a' is zero, false otherwise.
   */
  function isZero(a) {
      return !a;
  }
  /**
   * Determines whether a bigint scalar value is odd.
   * @param a The bigint scalar value to check.
   * @returns True if 'a' is odd, false if it is even.
   */
  function isOdd(a) {
      return (a & BigInt(1)) === BigInt(1);
  }
  /**
   * Performs a bitwise right shift on a bigint scalar value.
   * This operation is equivalent to dividing by 2^n, but it operates directly
   * on the binary representation, making it efficient for certain types of calculations.
   * @param a The bigint scalar value to shift.
   * @param n The number of bits to shift 'a' by.
   * @returns The result of shifting 'a' right by 'n' bits.
   */
  function shiftRight(a, n) {
      return a >> n;
  }
  /**
   * Multiplies two bigint scalar values.
   * @param a The first bigint scalar value.
   * @param b The second bigint scalar value.
   * @returns The product of 'a' and 'b'.
   */
  function mul(a, b) {
      return a * b;
  }
  /**
   * Compares two bigint scalar values to determine if the first is greater than the second.
   * @param a The first bigint scalar value to compare.
   * @param b The second bigint scalar value to compare.
   * @returns True if 'a' is greater than 'b', false otherwise.
   */
  function gt(a, b) {
      return a > b;
  }
  /**
   * Converts a bigint scalar value into an array of bits, represented as numbers.
   * This function is particularly useful for examining the binary structure of bigints,
   * which can be necessary for bit manipulation and understanding the representation
   * of numbers at a lower level.
   * @param n The bigint scalar value to convert into bits.
   * @returns An array of numbers representing the bits of 'n', starting from the least significant bit.
   */
  function bits(n) {
      const res = [];
      let E = n;
      while (E) {
          if (E & BigInt(1)) {
              res.push(1);
          }
          else {
              res.push(0);
          }
          E >>= BigInt(1);
      }
      return res;
  }

  var scalar = /*#__PURE__*/Object.freeze({
    __proto__: null,
    bits: bits,
    gt: gt,
    isOdd: isOdd,
    isZero: isZero,
    mul: mul,
    shiftRight: shiftRight
  });

  /**
   * @class F1Field
   * Represents a finite field of order 'order' providing arithmetic operations under modulus.
   * This class includes operations such as addition, subtraction, multiplication, division,
   * and inversion, all performed modulo the field's order. It's designed to work with bigints,
   * supporting large numbers for cryptographic purposes and other applications requiring
   * modular arithmetic.
   * Note that the outputs of the functions will always be within the field if and only if
   * the input values are within the field. Devs need to make sure of that.
   *
   * @property one Represents the scalar value 1 in the field.
   * @property zero Represents the scalar value 0 in the field.
   * @property _order The order of the finite field (i.e., the modulus).
   * @property _half Half the order of the field, used for certain comparisons.
   * @property _negone The scalar value -1 in the field, represented positively.
   */
  class F1Field {
      constructor(order) {
          this.one = 1n;
          this.zero = 0n;
          this._order = order;
          this._half = order >> this.one;
          this._negone = this._order - this.one;
      }
      /**
       * Ensures a given result falls within the field by applying modular reduction.
       * This method also handles negative inputs, correctly mapping them into the field.
       * @param res The result to be normalized to the field.
       * @returns The equivalent value within the field.
       */
      e(res) {
          res %= this._order;
          return res < 0 ? res + this._order : res;
      }
      /**
       * Performs modular multiplication of two bigint values within the field.
       * @param a The first value.
       * @param b The second value.
       * @returns The product of 'a' and 'b' modulo the field's order.
       */
      mul(a, b) {
          return (a * b) % this._order;
      }
      /**
       * Subtracts one bigint from another under modulus.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The value from which to subtract.
       * @param b The value to be subtracted.
       * @returns The difference of 'a' and 'b' modulo the field's order.
       */
      sub(a, b) {
          return a >= b ? a - b : this._order - b + a;
      }
      /**
       * Adds two bigint values together under modulus.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The first value.
       * @param b The second value.
       * @returns The sum of 'a' and 'b' modulo the field's order.
       */
      add(a, b) {
          const res = a + b;
          return res >= this._order ? res - this._order : res;
      }
      /**
       * Computes the multiplicative inverse of a given value within the field.
       * This method uses the Extended Euclidean Algorithm to find the inverse,
       * ensuring the result is always a positive value less than the field's order.
       * If the input value is zero, which has no inverse, an error is thrown.
       * @param a The value for which to compute the inverse.
       * @returns The multiplicative inverse of 'a' modulo the field's order.
       * @throws if 'a' is zero.
       */
      inv(a) {
          if (a === this.zero) {
              throw new Error("Zero has no inverse");
          }
          let t = this.zero;
          let r = this._order;
          let newt = this.one;
          let newr = a % this._order;
          while (newr) {
              const q = r / newr;
              [t, newt] = [newt, t - q * newt];
              [r, newr] = [newr, r - q * newr];
          }
          if (t < this.zero) {
              t += this._order;
          }
          return t;
      }
      /**
       * Divides one bigint by another within the field by multiplying the first value
       * by the multiplicative inverse of the second.
       * @param a The dividend.
       * @param b The divisor.
       * @returns The result of the division of 'a' by 'b' modulo the field's order.
       */
      div(a, b) {
          return this.mul(a, this.inv(b));
      }
      /**
       * Checks if two bigint values are equal within the context of the field.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The first value to compare.
       * @param b The second value to compare.
       * @returns True if 'a' equals 'b', false otherwise.
       */
      eq(a, b) {
          return a === b;
      }
      /**
       * Squares a bigint value within the field.
       * This is a specific case of multiplication where the value is multiplied by itself,
       * optimized for performance where applicable.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The value to square.
       * @returns The square of 'a' modulo the field's order.
       */
      square(a) {
          return (a * a) % this._order;
      }
      /**
       * Compares two bigint values to determine if the first is less than the second,
       * taking into account the field's order for modular comparison.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The first value to compare.
       * @param b The second value to compare.
       * @returns True if 'a' is less than 'b', false otherwise.
       */
      lt(a, b) {
          const aa = a > this._half ? a - this._order : a;
          const bb = b > this._half ? b - this._order : b;
          return aa < bb;
      }
      /**
       * Compares two bigint values to determine if the first is greater than or equal to the second,
       * considering the field's modular context.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The first value to compare.
       * @param b The second value to compare.
       * @returns True if 'a' is greater than or equal to 'b', false otherwise.
       */
      geq(a, b) {
          const aa = a > this._half ? a - this._order : a;
          const bb = b > this._half ? b - this._order : b;
          return aa >= bb;
      }
      /**
       * Computes the negation of a bigint value within the field.
       * The result is the modular additive inverse that, when added to the original value,
       * yields zero in the field's modulus.
       * It ensures the result is within the field if and only if the input values are within the field.
       * @param a The value to negate.
       * @returns The negation of 'a' modulo the field's order.
       */
      neg(a) {
          return a ? this._order - a : a;
      }
      /**
       * Checks if a bigint value is zero within the context of the field.
       * @param a The value to check.
       * @returns True if 'a' is zero, false otherwise.
       */
      isZero(a) {
          return a === this.zero;
      }
      /**
       * Raises a base to an exponent within the field, efficiently computing
       * scalar exponentiation using the square-and-multiply algorithm.
       * Supports both positive and negative exponents through the use of the `inv` method for negatives.
       * @param base The base to be exponentiated.
       * @param e The exponent.
       * @returns The result of raising 'base' to the power 'e' modulo the field's order.
       */
      pow(base, e) {
          if (isZero(e)) {
              return this.one;
          }
          if (e < 0n) {
              base = this.inv(base);
              e = -e;
          }
          const n = bits(e);
          if (n.length === 0) {
              return this.one;
          }
          let res = base;
          for (let i = n.length - 2; i >= 0; i -= 1) {
              res = this.square(res);
              if (n[i]) {
                  res = this.mul(res, base);
              }
          }
          return res;
      }
  }

  /**
   * @module ProofPacking
   *
   * This module provides utility functions to pack and unpack
   * various types of objects, making it easier to export or use
   * them externally.
   */
  /**
   * Packs a Snarkjs Groth16 proof into a single list usable as calldata in Solidity (public signals are not included).
   * @param proof The Groth16 proof generated with SnarkJS.
   * @returns Solidity calldata.
   */
  function packGroth16Proof(proof) {
      return [
          proof.pi_a[0],
          proof.pi_a[1],
          proof.pi_b[0][1],
          proof.pi_b[0][0],
          proof.pi_b[1][1],
          proof.pi_b[1][0],
          proof.pi_c[0],
          proof.pi_c[1]
      ];
  }
  /**
   * Unpacks a PackedGroth16Proof Solidity calldata into its original form which is a SnarkJS Groth16 proof.
   * @param proof Solidity calldata.
   * @returns The Groth16 proof compatible with SnarkJS.
   */
  function unpackGroth16Proof(proof) {
      return {
          pi_a: [proof[0], proof[1]],
          pi_b: [
              [proof[3], proof[2]],
              [proof[5], proof[4]]
          ],
          pi_c: [proof[6], proof[7]],
          protocol: "groth16",
          curve: "bn128"
      };
  }

  var proofPacking = /*#__PURE__*/Object.freeze({
    __proto__: null,
    packGroth16Proof: packGroth16Proof,
    unpackGroth16Proof: unpackGroth16Proof
  });

  exports.Buffer = Buffer;
  exports.F1Field = F1Field;
  exports.base64ToBuffer = base64ToBuffer;
  exports.base64ToText = base64ToText;
  exports.beBigIntToBuffer = beBigIntToBuffer;
  exports.beBufferToBigInt = beBufferToBigInt;
  exports.bigIntToBuffer = bigIntToBuffer;
  exports.bigIntToHexadecimal = bigIntToHexadecimal;
  exports.bigNumberishToBigInt = bigNumberishToBigInt;
  exports.bigNumberishToBuffer = bigNumberishToBuffer;
  exports.bufferToBase64 = bufferToBase64;
  exports.bufferToBigInt = bufferToBigInt;
  exports.bufferToHexadecimal = bufferToHexadecimal;
  exports.conversions = conversions;
  exports.crypto = crypto_browser;
  exports.errorHandlers = errorHandlers;
  exports.hexadecimalToBigInt = hexadecimalToBigInt;
  exports.hexadecimalToBuffer = hexadecimalToBuffer;
  exports.isArray = isArray;
  exports.isBigInt = isBigInt;
  exports.isBigNumber = isBigNumber;
  exports.isBigNumberish = isBigNumberish;
  exports.isBuffer = isBuffer;
  exports.isDefined = isDefined;
  exports.isFunction = isFunction;
  exports.isHexadecimal = isHexadecimal;
  exports.isNumber = isNumber;
  exports.isObject = isObject;
  exports.isString = isString;
  exports.isStringifiedBigInt = isStringifiedBigInt;
  exports.isSupportedType = isSupportedType;
  exports.isType = isType;
  exports.isUint8Array = isUint8Array;
  exports.leBigIntToBuffer = leBigIntToBuffer;
  exports.leBufferToBigInt = leBufferToBigInt;
  exports.packGroth16Proof = packGroth16Proof;
  exports.packing = proofPacking;
  exports.requireArray = requireArray;
  exports.requireBigInt = requireBigInt;
  exports.requireBigNumber = requireBigNumber;
  exports.requireBigNumberish = requireBigNumberish;
  exports.requireBuffer = requireBuffer;
  exports.requireDefined = requireDefined;
  exports.requireFunction = requireFunction;
  exports.requireHexadecimal = requireHexadecimal;
  exports.requireNumber = requireNumber;
  exports.requireObject = requireObject;
  exports.requireString = requireString;
  exports.requireStringifiedBigInt = requireStringifiedBigInt;
  exports.requireTypes = requireTypes;
  exports.requireUint8Array = requireUint8Array;
  exports.scalar = scalar;
  exports.supportedTypes = supportedTypes;
  exports.textToBase64 = textToBase64;
  exports.typeChecks = typeChecks;
  exports.unpackGroth16Proof = unpackGroth16Proof;

  return exports;

})({});
