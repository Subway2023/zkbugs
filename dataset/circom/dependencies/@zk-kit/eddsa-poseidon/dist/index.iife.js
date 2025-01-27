/**
 * @module @zk-kit/eddsa-poseidon
 * @version 1.0.3
 * @file A JavaScript EdDSA library for secure signing and verification using Poseidon the Baby Jubjub elliptic curve.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/eddsa-poseidon}
*/
var eddsaPoseidon = (function (exports) {
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
  Buffer.isBuffer = isBuffer$2;
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
  function isBuffer$2(obj) {
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
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
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
  function isBuffer$1(value) {
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
      if (!isString(value)) {
          return false;
      }
      try {
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
          isBuffer$1(value) ||
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
              return isBuffer$1(value);
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

  /**
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
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

  /**
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
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
      if (hex.length % 2 !== 0) {
          hex = `0${hex}`;
      }
      return hex;
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
   * It uses little-endian byte order.
   * @param value The bigint to convert.
   * @param size The number of bytes of the buffer to return.
   * @returns The buffer representation of the bigint in little-endian.
   */
  function leBigIntToBuffer(value, size) {
      const hex = bigIntToHexadecimal(value);
      const minSize = Math.ceil(hex.length / 2);
      if (!size) {
          size = minSize;
      }
      else if (size < minSize) {
          throw Error(`Size ${size} is too small, need at least ${minSize} bytes`);
      }
      const buffer = Buffer.alloc(size, 0);
      const fromHex = Buffer.from(hex, "hex").reverse();
      fromHex.copy(buffer, 0);
      return buffer;
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
      if (isBuffer$1(value) || isUint8Array(value)) {
          return bufferToBigInt(value);
      }
      return BigInt(value);
  }

  /**
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
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

  /**
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
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
   * @module @zk-kit/baby-jubjub
   * @version 1.0.3
   * @file A JavaScript library for adding points to the curve.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/baby-jubjub}
  */
  /**
   * The following is a sqrt function (i.e. tonelliShanks) with some pre-computed
   * constants and it only works with 'r'.
   * See {@link https://eprint.iacr.org/2012/685.pdf} and
   * {@link https://github.com/iden3/ffjavascript/blob/6f37a93fabddf45100bf221de6a1399599497e5d/src/fsqrt.js#L38}
   * for more.
   * @param n The number for which to calculate the square root.
   * @returns The square root.
   */
  function tonelliShanks(n, order) {
      const Fr = new F1Field(order);
      const sqrt_s = 28;
      const sqrt_z = BigInt("5978345932401256595026418116861078668372907927053715034645334559810731495452");
      const sqrt_tm1d2 = BigInt("40770029410420498293352137776570907027550720424234931066070132305055");
      if (Fr.isZero(n))
          return Fr.zero;
      let w = Fr.pow(n, sqrt_tm1d2);
      const a0 = Fr.pow(Fr.mul(Fr.square(w), n), BigInt(2 ** (sqrt_s - 1)));
      if (Fr.eq(a0, Fr._negone)) {
          return null;
      }
      let v = sqrt_s;
      let x = Fr.mul(n, w);
      let b = Fr.mul(x, w);
      let z = sqrt_z;
      while (!Fr.eq(b, Fr.one)) {
          let b2k = Fr.square(b);
          let k = 1;
          while (!Fr.eq(b2k, Fr.one)) {
              b2k = Fr.square(b2k);
              k += 1;
          }
          w = z;
          for (let i = 0; i < v - k - 1; i += 1) {
              w = Fr.square(w);
          }
          z = Fr.square(w);
          b = Fr.mul(b, z);
          x = Fr.mul(x, w);
          v = k;
      }
      return Fr.geq(x, Fr.zero) ? x : Fr.neg(x);
  }
  /**
   * Constants and curve parameters for BabyJubJub elliptic curve operations.
   * See: {@link https://eips.ethereum.org/EIPS/eip-2494}
   */
  const r = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
  const Fr = new F1Field(r);
  const Base8 = [
      Fr.e(BigInt("5299619240641551281634865583518297030282874472190772894086521144482721001553")),
      Fr.e(BigInt("16950150798460657717958625567821834550301663161624707787222815936182638968203"))
  ];
  const a = Fr.e(BigInt("168700"));
  const d = Fr.e(BigInt("168696"));
  const order = BigInt("21888242871839275222246405745257275088614511777268538073601725287587578984328");
  const subOrder = shiftRight(order, BigInt(3));
  /**
   * Performs point addition on the Baby Jubjub elliptic curve,
   * calculating a third point from two given points.
   * Let P1 = (x1, y1) and P2 = (x2, y2) be two arbitrary points of the curve.
   * Then P1 + P2 = (x3, y3) is calculated in the following way:
   * x3 = (x1*y2 + y1*x2)/(1 + d*x1*x2*y1*y2)
   * y3 = (y1*y2 - a*x1*x2)/(1 - d*x1*x2*y1*y2)
   * @param p1 First point on the curve.
   * @param p2 Second point on the curve.
   * @returns Resultant third point on the curve.
   */
  function addPoint(p1, p2) {
      const beta = Fr.mul(p1[0], p2[1]);
      const gamma = Fr.mul(p1[1], p2[0]);
      const delta = Fr.mul(Fr.sub(p1[1], Fr.mul(a, p1[0])), Fr.add(p2[0], p2[1]));
      const tau = Fr.mul(beta, gamma);
      const dtau = Fr.mul(d, tau);
      const p3x = Fr.div(Fr.add(beta, gamma), Fr.add(Fr.one, dtau));
      const p3y = Fr.div(Fr.add(delta, Fr.sub(Fr.mul(a, beta), gamma)), Fr.sub(Fr.one, dtau));
      return [p3x, p3y];
  }
  /**
   * Performs a scalar multiplication by starting from the 'base' point and 'adding'
   * it to itself 'e' times.
   * @param base The base point used as a starting point.
   * @param e A secret number representing the private key.
   * @returns The resulting point representing the public key.
   */
  function mulPointEscalar(base, e) {
      let res = [Fr.e(BigInt(0)), Fr.e(BigInt(1))];
      let rem = e;
      let exp = base;
      while (!isZero(rem)) {
          if (isOdd(rem)) {
              res = addPoint(res, exp);
          }
          exp = addPoint(exp, exp);
          rem = shiftRight(rem, BigInt(1));
      }
      return res;
  }
  /**
   * Determines if a given point lies on the Baby Jubjub elliptic curve by verifying the curve equation.
   * This function checks if the point satisfies the curve equation `ax^2 + y^2 = 1 + dx^2y^2`.
   * @param p The point to check, represented as a pair of bigint values.
   * @returns True if the point is on the curve, otherwise false.
   */
  function inCurve(p) {
      const x1 = BigInt(p[0]);
      const y1 = BigInt(p[1]);
      const x2 = Fr.square(x1);
      const y2 = Fr.square(y1);
      return Fr.eq(Fr.add(Fr.mul(a, x2), y2), Fr.add(Fr.one, Fr.mul(Fr.mul(x2, y2), d)));
  }
  /**
   * Packs a point on the Baby Jubjub elliptic curve into a bigint.
   * This process involves converting the y-coordinate to a buffer and conditionally modifying the last byte
   * to encode the sign of the x-coordinate, following a specific compact representation format.
   * @param unpackedPoint The point to be packed, consisting of x and y coordinates.
   * @returns The packed representation of the point as a bigint.
   */
  function packPoint(unpackedPoint) {
      const buffer = leBigIntToBuffer(unpackedPoint[1], 32);
      if (Fr.lt(unpackedPoint[0], Fr.zero)) {
          buffer[31] |= 0x80;
      }
      return leBufferToBigInt(buffer);
  }
  /**
   * Unpacks a bigint back into a point on the Baby Jubjub elliptic curve, reversing the packing process.
   * This involves interpreting the bigint as the y-coordinate and extracting the sign of the x-coordinate
   * from the encoded format. The function then calculates the x-coordinate using the curve equation.
   * @param packedPoint The packed point as a bigint.
   * @returns The unpacked point as a pair of bigint values, or null if the point is invalid.
   */
  function unpackPoint(packedPoint) {
      const buffer = leBigIntToBuffer(packedPoint);
      const unpackedPoint = new Array(2);
      let sign = false;
      if (buffer[31] & 0x80) {
          sign = true;
          buffer[31] &= 0x7f;
      }
      unpackedPoint[1] = leBufferToBigInt(buffer);
      if (gt(unpackedPoint[1], r)) {
          return null;
      }
      const y2 = Fr.square(unpackedPoint[1]);
      let x = tonelliShanks(Fr.div(Fr.sub(Fr.one, y2), Fr.sub(a, Fr.mul(d, y2))), r);
      if (x == null) {
          return null;
      }
      if (sign) {
          x = Fr.neg(x);
      }
      unpackedPoint[0] = x;
      return unpackedPoint;
  }

  /**
   * @module @zk-kit/utils
   * @version 1.2.1
   * @file Essential zero-knowledge utility library for JavaScript developers.
   * @copyright Ethereum Foundation 2024
   * @license MIT
   * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
  */
  /**
   * Returns true if the value is a Buffer instance, false otherwise.
   * @param value The value to be checked.
   */
  function isBuffer(value) {
      return Buffer.isBuffer(value);
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
   * Generates a secure random sequence of bytes using the Web Cryptography API.
   * @param size The number of bytes to generate.
   * @returns A Uint8Array containing the generated random bytes.
   */
  function getRandomValues(size) {
      if (size <= 0)
          throw Error(`size ${size} is too small, need at least 1`);
      return crypto.getRandomValues(new Uint8Array(size));
  }
  var crypto_browser = Object.freeze({
      __proto__: null,
      getRandomValues: getRandomValues
  });

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  var poseidon5$1 = {};

  const F = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
  const N_ROUNDS_F = 8;
  const N_ROUNDS_P = [56, 57, 56, 60, 60, 63, 64, 63, 60, 66, 60, 65, 70, 60, 64, 68];
  const pow5 = v => {
    let o = v * v;
    return v * o * o % F;
  };
  function mix(state, M) {
    const out = [];
    for (let x = 0; x < state.length; x++) {
      let o = 0n;
      for (let y = 0; y < state.length; y++) {
        o = o + M[x][y] * state[y];
      }
      out.push(o % F);
    }
    return out;
  }
  function poseidon(_inputs, opt) {
    const inputs = _inputs.map(i => BigInt(i));
    if (inputs.length <= 0) {
      throw new Error('poseidon-lite: Not enough inputs');
    }
    if (inputs.length > N_ROUNDS_P.length) {
      throw new Error('poseidon-lite: Too many inputs');
    }
    const t = inputs.length + 1;
    const nRoundsF = N_ROUNDS_F;
    const nRoundsP = N_ROUNDS_P[t - 2];
    const {
      C,
      M
    } = opt;
    if (M.length !== t) {
      throw new Error(`poseidon-lite: Incorrect M length, expected ${t} got ${M.length}`);
    }
    let state = [0n, ...inputs];
    for (let x = 0; x < nRoundsF + nRoundsP; x++) {
      for (let y = 0; y < state.length; y++) {
        state[y] = state[y] + C[x * t + y];
        if (x < nRoundsF / 2 || x >= nRoundsF / 2 + nRoundsP) state[y] = pow5(state[y]);else if (y === 0) state[y] = pow5(state[y]);
      }
      state = mix(state, M);
    }
    return state[0];
  }
  var poseidon_1 = poseidon;
  getDefaultExportFromCjs(poseidon_1);

  var unstringify = {};

  Object.defineProperty(unstringify, "__esModule", {
    value: true
  });
  unstringify.default = unstringifyBigInts;
  function unstringifyBigInts(o) {
    if (Array.isArray(o)) {
      return o.map(unstringifyBigInts);
    } else if (typeof o == 'object') {
      const res = {};
      for (const [key, val] of Object.entries(o)) {
        res[key] = unstringifyBigInts(val);
      }
      return res;
    }
    const byteArray = Uint8Array.from(atob(o), c => c.charCodeAt(0));
    const hex = [...byteArray].map(x => x.toString(16).padStart(2, '0')).join('');
    return BigInt(`0x${hex}`);
  }

  var _5 = {};

  Object.defineProperty(_5, "__esModule", {
    value: true
  });
  _5.default = void 0;
  var _default = {
    C: ['FEhhRZjgD5jnrn3qRfvYO9loZT74OQzeLoa3Bq1AxlE=', 'CreykTiOXJ5DwNwfWR+4Ps22UCLhtwr0O4p7QMHf98M=', 'K3y7IXiW9SyajAiOZUryHoTN51SjzvWxXE1UZmEtat8=', 'K8aw3b4dcBtlcEKL3Byhvw2ln/O7u5X8K8ccDG5nplw=', 'EjpVoxmAOE89ILLOy8RO1gw4wR99IOknHvq5qQXu/Tw=', 'A3UBzIydyBkwmnafTfCY5YiwGFi8jrfieeKIO+n7jFM=', 'HCEW5H4DqGuxFpWwpfbatrmkYLHrlRqwHCWeyj/UfVE=', 'LBghNIkDLoWpyMuOmmWDm/rtE+V7wPrknb2uv1T1b5M=', 'Luj+09TSxxoEKer9jl2xcY8p4iJ5hf3yrYcDyDW54DE=', 'KMZNj17XqsAEySAp2em/kbqUNtHM6UuTFtERxwoMFxQ=', 'GKAdn/t0euDePoPHB/iyT2gshPFav1cbNCVKA0eGZeA=', 'HCHZK+8ZfnOyNOR3e2DbFOZCpWzucVFdVOGscc3nK9M=', 'CtQEzLyx4ZWJfLYMgJgeu51mpmd9u+2ti2RV/mLYB7E=', 'Cptt6DMGT5O2rbma9sAFlFy2VMt70UyLl6+LYMwfs4c=', 'ExKeP5MK7W1HaQMx/wncUWDvpY3c4sPmGA1FvsOqOm8=', 'DXphTImRUIqxzkiVgTuxyC8Yv3v8nigMzKGAeYOTh/E=', 'BTL37DbjAEGwSGmGh1yROkm93y9a9f6+jDHy9AlP/qU=', 'BrvLjo4YAgEpPnEvSVDxsLvugIydZCY8hNnYrhVcuJI=', 'D1WKTbGjrAf2Hi5r7pR/c1hr9A8hHOtPaHylZ4qdyzM=', 'K+FApgtbXy+O3XioGKlpsgxkPkGbzwtXfCSg0Oes/pg=', 'HEnEuanwn3ua1fdOusxxBRK46Ge6zifLDeoG6JuW9jE=', 'FwwacychsSzefzPkdqOaGqd6gcBuLqxQOEewDVl2Uts=', 'GcJ9DlL2XKNPTjGgaOSTMca/w52SQfnUwwIEFhXPJ/E=', 'LxvcUlT5Igwacx/FJ2lk2rJrOF+kC2sEvtmWDiVDugg=', 'BbQtL7zL9NOdK+kznKvp0Nxtkh6FXNkRVLY50o1KHPA=', 'EiAEBxWkGtWfT0EODAWkLF/TKsUv6dBviBiNcfYeCTU=', 'JflSZSYVW4OUZgn3u5UH3Ukl74cd7pFtkUTrtOzhNDw=', 'AXv+QoQpmud0C20OIElR4xSopdBFJBkUeXipWzR0JEQ=', 'Kl1HZAIcpx14qWdMtnCPFYjSzq81eMQRHPizWe7wic8=', 'F/Atq3RfvjwIEyH+XO+EXnuNBwslFNKbKnt9icwIFdo=', 'GdpiYm23GZtl9K3PV/pKPbqhdkp70VVwjubzeMie8BM=', 'D4jilfou2BtCbJH6aTZqc+33Xzm/GGNM0mbsQDiCngU=', 'H+McVUhUbHlI/k7hvXQS4ygO/30gywmqhfSfJ2YUgBc=', 'EP3BYTvb9n84vd5WGy+R5MxItZ+Y1kNjj9wK+tv+Em4=', 'HyYYwuvpV0UIucUvAADjPr/drRoD/da8pu9/AJMSe+8=', 'Ep/n/D76xqirI9um2IbzlNoR9ZU8+Y4oJpoNuip0XdM=', 'Fa/UzfHk+CDBYx1KuFykujuvz+5yvq3p+uYFIxAkSOM=', 'Hyx0ulw2fjcNco5x4VsmiFGnu4tFUoy3NJVgeayZsBI=', 'ETDhhy128vk2nPWble35zhnwH6icnDaybgne9nhtrTw=', 'E1I9Fz9+a623O2P8HJu9vuJCxhvGhlZJMydTOlwbHco=', 'FNpA0K9CemXxhBta3JZThlM2j3JUy1Zn3a27rXpXTNQ=', 'AJH5ZADkKX6oW7GGwXswToJjjlf9Yx/2MVl24aXdi4Y=', 'MDMpv5AxxVFbmjTUmmS7agJnvHtUoN7KXEUCd6ACzcs=', 'FO1H5VwdocLwXTwaGy5sGFCfyDNuz+nbc3kW4oP6ghs=', 'EWHxCzV3ddgQrVO8xKINWt0rAyUcdH3rBO6UxWXljWs=', 'F6ilCucs5wfyK8Bw65koUcqRTrlMxo6vu4qWpxTrgiE=', 'Gmxh15Xbr2L5klCzfsXfiGRaHBU3kdtjErky3CUOT2I=', 'H4vSq4qoQGZMTu4ZjEaE3EsFdyuyoIadpnIrFfRHoTM=', 'H/y4UqTwAnqXmfExzXS5jM+4y8BjSdj+/MYvEMj7Pi8=', 'A150LsUvGbNtSJxyD0Z/+td81TvC213dskayMCH3nxg=', 'Hfqu5BvflNeDqin8Yrfse1VnOqgY0wX9QtF1oF8uPYY=', 'KCE3hHegLplQBaVjUIhUCUW9Mz8tFFXwOKIZuMR5azo=', 'HbSk0PI4pXCxBhxu7IHALzH/3Up8GedjF08jjQSJdCE=', 'FL94iUV7ILehNns0o6U4IX1pO1JCav9ApLtyiTsXhMo=', 'LO1Swr8pb4fldBDD7JqUg6eW0WT2BJEnEJ/w06nAhGU=', 'Hd6sWAWn9K2k0EQe0QjjFJ1M5lhPSa5b39RtZ2buozQ=', 'Lja05enJe0YjBOjitfnciOHJ8hYboEBnP5ERI/BCrnA=', 'DGhA0csGZtxZ6JsYZSddihZLRHxe1kNHyu5jUCwjjV4=', 'E34uPonnHUYfTJvD6PEhgyYqTR21XFibLK6qwBI49Yw=', 'JQky57CtzyyE7Uv7YKNra4LlWqlHURV7HUV5Swgciq0=', 'FwpykvVjTAbdO/CatcnE7NSwDVzi81+XK0VVOR8WtC0=', 'DWjLvnconnjVy/UdcPG3W6IV30570BSdELLFDypPO4E=', 'DK90VjuQUl9kWm0gNuzRMG+h3GgLSdnOTtJMl0mXMXg=', 'IKfRwKJ/zOeP/jcvTFgwaxZvlFbtRs3rJV45W30w1Co=', 'BiPzImtUcLJ4m4pTBA5ERDOF6Wuc+gvk01AVFYpGhGU=', 'FjIwhojCXnkPV9aKU1AkEkKlYwU0feSlAJzka4zcuR8=', 'LeR5Om+ZzRTj9mQiEfTQt7z6NhWXxUT/y1pWfpB29H8=', 'HU0G0Z6hsJyteQhtUb3hFyWlVPqZVZyi8J87tz1yjGY=', 'BIDnR5pmp82ephyLKJdDiZCDUKvEqvwYzXXjPdEwwUQ=', 'MEMLAzaOvKqRJGlgSQvPkX14aBRj4ufXRL+0QzXawk0=', 'C1ezcyASfUxQ8mkSSw29yysfE1IkGl0SEDKD4InAx0I=', 'LPSJBlDSckDhlfYKT2mO2iSbjdYUsjN2tQF40t9tK48=', 'HiIcVSaJi/0S3oaFGg2XA3UaLyOQCKtfm307aRHGQYQ=', 'KOB0ha19mS7RpY8ynKEq3OTsaT6927KVLlTTOfLuvaU=', 'L0TWT4TeFtxnvV6tUe+x3IOByEUgwShU3V7zoHms1OA=', 'BQp2vDLr0d/ivjMPME7ces5xZ6t7oVFvQCHGLPDU+sI=', 'L1jEXl1lmmfXgTZyQfbDXYy0Y2HZeyiUfSlCHCcFlKk=', 'JejamuDkLoQOBLIwNw54K9tnU0hEMlujb8fl4WDGanQ=', 'L+xzTaIP4yAD6gTxJ/hEck84o2i6EMKVRCUr55YED38=', 'KIpnePOoOYio7Rcn8V6TtMsU9OOju7kd1tH6yv/9Xu8=', 'INzGx1/Yklm+f0BnULPbZ5olqM0nFdJFuRdTkKySLIQ=', 'F/QroQlC3yXLilQXgqGLb9Mc+WXREXjHsErEW03qXdM=', 'Ao7rhdEVqQQCDgxhSO7GYD6c7avGZKvudkqv1FWYa6U=', 'Cx187POnmyrT+imPbOp66V2AwCmezJGOn4ycPTjVnUA=', 'BEAznJdkzsecFu/bg0omJh244/Es4c9yLSPA4R/0zwc=', 'BspkfClyfBlioAIXfaLVBPSwel9+tXx5uI5reru9rVw=', 'LqEgqGT1xAk90ali6PATx7jvd4sE0rpb/DyrKGGbqeM=', 'K7c3VGxK7nwMwrqHwRV+KnfEeev7Xcdq27Oc+Gl2M/0=', 'DjDaZJBiXTPnnNUBdvVo+aLCjC9EmivVGiXRVoaAOpM=', 'DffKcnihNlC5GdhUl7LrsPcQNafCBDDUEx2QOrf1dSE=', 'J8xYn1v1hXlKus5Yn7inSi94TAmQuA/KppRAl/hw4tU=', 'IlXDajjIc13kXO30Uq+oQjMtMwQveOYMQ8dFVCGzJb8=', 'Ez2WAr0zeNafaBwnsFvf/Ji32GzKY9c6YMrtSFeE0Ic=', 'DhVI6UKunT4mhgaZuTcnyBeplIYWyT70rM2YGx3D14o=', 'DyDw5V2TaJ/gnsMS9q9HYnSC5L3goWAqjiyNboTopq4=', 'LlIyhIPLW3/y605FsS5RsmIyybwXtykpVMCp9r+lG7k=', 'ArIWLVM+BZpu2iq7dHEu2zp4YL7qld2KSr/JV2YIBPQ=', 'GeCSdxXRzG04lCmUf7Nzfa1zOXTGsuE+Wz1DJRlRbHQ=', 'DTqABFfXd4VjYwO4uU8X3P/LRgSIcqyfdO9/J+5XNwU=', 'LJdNGVJVehqsX3uuSZZhbaYZtz9EHE5QTcj+nPtVnjI=', 'B2a/7u3izPNwjhtP8wcUwiwdQ0zb6PVVFLq8LdXZe+8=', 'I9rI6lQIL8Ex4XOuVeRjDNTKfIcbKgpHnB505/GR5iw=', 'F9X7bCyzcBDj41irLVdTdocO0zGGuOrkmtO0fjQKjX8=', 'F13Kx22KgSYTm1g644hTKQJG5D54P6aQPsgAfxeMACM=', 'DE/Qj+3l0iGtt6v1SYmMkeW+foW/H9KmEb8YLMLnFlU=', 'J3k0uQnnLTo0dbsex2arejitWbEoMD/FAC8Cplvf5yk=', 'Dog0mZjf5wPxsYRST5w5TWAEzKz5y5UolujP2wsHi2g=', 'HxsgeLYLD84Hgk4qK8jK6O5nNRSwBwqLRXEMx4y7mUI=', 'LrFVlWbFNt28MW9kgtUfo0BVdldwD1uKhG6BKg7TNNE=', 'HE29wzXPZ2Q1Ugi0ydJD00VB1iPGad7Cw7oGa76vZ3M=', 'I3SmstpvjKuOXP6NgF3Tot/KHot+ul3IV0Ah/RJB47Q=', 'Gd00JTPMxgOplzjj+1pWm5TvcbPkn5D7h09hYXMwcvQ=', 'IX1m22x/s+/6UIgAWH0us8bQPYOFEy8vzOfzXycFzM8=', 'CBX7hZH+AQOM06OziyNvnvynfGGNO/xsKn+okpbH5k8=', 'K7lDtAwr1FamwXhTscqI6w/zb1l0sv+aX1CT6b9joW8=', 'EaUVP85llRPufLmXSubLpYHjtM0UVwxXCf7D2NP8guk=', 'G3K/0HY12FAbLv+HhaJJW650x2U8+Q5tXJ8URCaDbfQ=', 'FJAsBwDuyJeuF4uoyvhQ15Px2HUSvqDs6jnPax/uIz0=', 'CcE4xuCmFqSf+Q1DprBD87dFt4hlhW3EwaReL9hMs/Q=', 'BbWKPc5XsoGicdaYlQUtiHRYpxV4PoMX4CSmGjXsELw=', 'K+jSlSXAz91eazEl473jv1WOVfvoZ/AkRXqWdlR00Dc=', 'Bh1y948bqdxrTX93hCJdaoG9/Bta1sJDafnAVgUj2a0=', 'C/GK78rP+r30ES7drcphRXOLSAOzYUW7lRbbUBoGkuk=', 'LnPdEF+osuyTHYzfKexnnjqYAakwcafV6jBlklXwO8Y=', 'D4RA72Z8mugTN7pdjJJ6U0fecpaGCyEcrR7L+101mO8=', 'AE0wOy3qYnsnMb6D+TrDTn0U0XihOABVjKc5Y5XrEY8=', 'I0VBrXIECnDaKZajUmkjDJRpnu8xOk1IBQgAjLw9N8E=', 'DRI/HnLSa5K92P1z0UKGwxKtTCOstGsuCMFXEEQJ4XQ=', 'L7Ngd28N551wmO56pBI8Be5rBai+Rgp3TzoEjhOFRbs=', 'A2hcB5Q04WcnbFfTzHlwO339xBwVbqHot/mbaValUyY=', 'Jgrw4P/8yXcsFjGxeTRFZrR6qto2geuQNMb3XDcFwcc=', 'KGK0E3T4m2lSdLM7dz8lVJFuK/+f9nJUX8L0lWP2J2c=', 'AqmRL+FwMQInGJ6h5pHQNi8Ys4tACw7/GSyllRPrqNU=', 'COUTreaUoNisHz6/GpZEDTLHE9UFjhIk4HA0jCgfSm8=', 'FApKQx4u55QA7XRll42EdzITxigmT/gPIax6a2c9Cas=', 'KWr00BnLXffZWbKdVJw/BxICtOuotT3F7pee0UM3eSc=', 'AYMuKEp/TIFhSIK2k5/A8YVXO9ICPj5QV2VHC7gSs0k=', 'GoTVame/3T2WWr3NMpqnjU/pNDRJby0QOGH9GdZtcmA=', 'BAy4KEd3OSfSrv3AdIkDep0fdjHsp1yfsN2gy5294UM=', 'AQ3PCEzCnLfK7PJqpjO85O0rAZ8oh87nsaePidP6vi8=', 'B+3CKgkR6iFEJe9UK3dtsjsP5YF4ENQMcsqYqr2a+oM=', 'LupKsIrsd18hSEeeo2+7lpNtpYuki9HS06zUgXOqq+c=', 'HkDA6CV/5KYQBc3PrRSM9/R9G1z936oIJzhpVRgkXxk=', 'I6J4CVg70epR9DbeVEPhCPadRM31HcHwPiGUi0mAuHY=', 'LkZSsETb/kDmO2sjL81fPzmr+9IFHuaK3HVAgNSSUKk=', 'Eeer227Lr8Ln2M3v6ce5xQR160dds8LK9/fWf0hXdfI=', 'GZ1SNQzDDoxzgh+AIJbw5UehNVGye/a4mTlvY6xc+Oc=', 'D1ddbuZ8vs2YNFYk4DKjfIWafL7zCz/dyUnNCXhIQQE=', 'HEtvmiritBjmJlrLqclrBhhNBwKOX7eE80da53cv8Fc=', 'Lctc+Ilt458ijhV8DFWT9GJvubwiUgY4PbIDYKvwySU=', 'E0CrufThExhr3CbL30vMpQtTGhB/hjylRFdePPhw+OE=', 'I2jmkrcnh8uIcOqIjnFOAG9Z0rRGDPt0xIqMxzsdGls=', 'H6ua3ZuqSk9W8jFld1xvLZIqdjKpT5Y3S33IUnVvVLY=', 'DH97gjANPGzj+JV7oeSt1UxMAV4g2XZdIgVxwWq4aA8=', 'FdY+hr6s2Txgg2iOXZyPPGlHkp+fH5mrV4pMOpIu/wM=', 'C+hDrl+bB+UlcheK99ro7QXTaxLAYHhikpNV6nQCPZ4=', 'EzJ0nFI2lMtpNeCWOgfoGwWWfOHZUMC3MQWOySp6DJo=', 'JUOUCIEOB0wL3UWYuYFf7okruVylECns8Am/+lubloI=', 'BX6NGd2ZmpGNopsJQLODup/RXbCw9kmW3/Z/61X5p0I=', 'HgFON+mxF887SHDZmfK1XTU00Ka+mOnjV/pD8B5wop0=', 'Gk7STm4DrrzWvbEAUz3JZll6/hXIUbS4Y/boiQhMZHk=', 'JTQgAHCD8aqGOtR2CQXBA57UERyfBT8ncQRS+DzjapA=', 'InahRBlxcJr/5tKpkyAAHsRexyFVxXXd7srA4ydZqwY=', 'KJV90SGOp5n9NBHrGTJYU633rorhKB91MwL+fTHfp7A=', 'L9klcmq3lMiL11eWqj5/HmaS8pFM+AImfd8B43kCoAg=', 'HPilycdqhLFHyCONklPNVbR8DEPYKWbEY2ooZ0cF/Zo=', 'A3PLvDBuG6uecHc2hxXmIwtLLi5KHbnGdLjDWaQekQg=', 'BgKD0v5/I9/1E9kRCz3GJEi8SPUxzgweq1kgvyMpCkA=', 'DatGXW2RB0DzPvbMDq3HG/gRm9/Vo1J9yLv636pAJjw=', 'DLp7y8giSyqOSroXl3IwpobNZCHcDKU0bzRGtiQ5xMM=', 'HkNl2weQycT0RbBlPEZv8h25bDi0B2uovWi8tN6mkR0=', 'G7LbohmamrO8hu9fnef2xcoT1g6rQs7WjemPxkOACo0=', 'CtPBhwxtbvQO661SEjzRopE9nWLoC/usroEuCCAh+co=', 'AbCYyR57DLtcNFiAd8Dd+VMA3fYUk1YwwM46JickUwg=', 'Gf1cDqwU+udZi9TO6jseKZiwwWhJO21yrkG1duVbnD8=', 'DUdJ15zBY/FxEKQEpG/kJ8ZDTz/me357TM+mq5W9fhg=', 'Hrv+gRSkG7gJ4LMzmSQSMuuUCthyjIpRbUCtpEDb/c8=', 'JwTlthM9l2TW0/F9SdgzIj45N/gOufrqu/upuvS0wbg=', 'IWXhyAJzBbGuDjI1cWNeXVQNE9cQw/mjkLaRPxTQNeM=', 'LjSX5NNf2llsBq+mO8Og8uVdTuukrOtg5lCBrWOqi4o=', 'Ax2kNF7s1ttsD3sHx4Fdet0f4FRtc49NeatcV6qEHt8=', 'CJ7OVOR6pckI5D5fCHN8FDaWcIkAasqxyc0Z6sSiCHY=', 'L1PBXire0zxH9VoHBIPmzH84Ifv4qkBnfQVS7Z0Q2Ec=', 'FCqjT0suitDfeiGz45wAyLCqKFcJSAHqr9cr7+0Hf5M=', 'F66k2kx7zw11iLAU64tAl53Scl7aTmrOMxmCRnx/8r8=', 'DpcMGdGXSNjEZRBNjwIgA2P5pBeG8C8YJ3QrINwNFyc=', 'BLytnlU3lWQvWbr3FKa9tDL8RaCgt38aujqYI0dt+bk=', 'JCwL+82qdvcV29S6glxx/P7WccGxkB+khMh/gQMV0M4=', 'JdsTQ8JBBAcQI/tu002ZCQeDEeHv6FrwoRsZEU+p55A=', 'L/5NnEIKWenNx8Masr81GHyhR8uJijlC3rNnd4YDaoA=', 'EluwOvPizxi75vW1kOs7+NDRumO+aWSD6Y8oO8fNB6M=', 'CBa+QnRbfbtM7/5bjiTqYP2LcZ3rpQA3rHt1lIdFxrw=', 'ERFg+az27DYNG2pxIxOg28viPmRCAFVHHS7kxd7bNdQ=', 'E3eXjhsfaokl+o57eUG9+PtZq5VCNCQZKD2CA0Nck5E=', 'De/B2IghZu88zeU6TyNvuoPThGIZN87lfkIaUT0NM5c=', 'L4+lx4xwbjpdSgPyp6OVMEbX6Uy4in7zUOZ7W6Dw3r8=', 'GiqVfsCnI9phwhNLqwvxe+sA5tzYRpDCMNy55Y2pSCc=', 'HN+HEJlfXgNBK0p/aZUy+f0B8OoWeo38Hd834oBa3e8=', 'Jv0xRxgow2rjbCe3SAVLDAxP5SObMBaZ43Ze6+zBiUY=', 'B3XZlswsRFbzA6LB+QB2R+Eakh2f6j97kmFDuZ0voL4=', 'AW+5M3cIymOM39qRvQ2uprlyJO97IGJnKt3RvRi7iQA=', 'LDkvvn0/3kL8pPlHi7Q5MxJYJVNW8YSvb3bxGQVBF9c=', 'GHoqO/eaafo+UInvnx/Vb9tHxV7s53qiKKo94bSGvLE=', 'AnGoY6KAoyZB/6M1ELLt0njJhjA1lTLz5Qaydf1dIM4=', 'FVdFnJx0yUqgDlr2mh4xEvtpU3zol+wMcYlY2WUW8qs=', 'Ko4myo1kfZpjiFFuqdz/iQg9U55YFowqUMba4w8QnyE=', 'Ict1IZTPQ/O1GULrAEDrqd4rz7HCo/rpeSS3EPJoMs0=', 'LCba+Za+JHrNbdSsrWDTi1pHHmMiGI0CwTfny0hDd+w=', 'AkAXbuDnmC7r6Spo0+OjjCaCGswPXQWM+ME3vKLSbxs=', 'JjbglzyGXBvZdN142qqNCoTNr2vhrUfs8qDRjxFzGPI=', 'GehPTyWnmUlgQWYdxdl1toH24GdEzuibe+XZ/eF0SsA=', 'Dr+JBko68kfKHzb281cBiOJx4LMmxPsmZk6J4UVMoRA=', 'Jcfpe0db4A6LVZo4xFI2T0ycUx/suKxpj3/XPOIucew=', 'BETJnlkjU+WuyqMCrdkBwU2MVScKFgr+1EKe9VmK108=', 'E424iHgwVl8mk9Dg8C5OeeFEln8LpTsDUZq6dktcmUo=', 'JNQPRiEU/p7gKq/PdLT8ok4a42XcdcO1K7E8u7LyHt0=', 'IeZdbY7kN2C8pA5zC130xM86inMtsUj0spUbTGHWjow=', 'JI3XlmnsCdvwNQoV1sdcapvarO/KFNUTAJePE9GrbRw=', 'K4I4wVSPnL4p/TXPkee0jw69p+Y57faf6NWrp5JNU2I=', 'JDn9I5JX84GBx7489RPxv3I166lPa4lCqUy93s9vYvc=', 'IAlYI1KBphuixL4KoygqGMdLbSYvXefC4z0rs+iT3+w=', 'Dh7KXfiO5fYM+n4f5b77txn62CEfqbLQL8wjMZDBfxI=', 'JrU0J/mz6ix2nZxmD8YIgaFpwScy0AG3FY7ksbhCyiQ=', 'IPOz9Kyv6fivPgZmGzqPd4+igSUiudcKZ0As/42ysbQ=', 'IR5dKznWJSCnpifs6MrLrJ+XUG3vTsKGkoumwn1GOxc=', 'C7dD7jSAISnFVnMa7Z0wLc0IUxPOVy9iQtE4MuU2tLQ=', 'I8smYbSI7nHkx1P/I65L0l2KRAlPZrZTKXfiIUDrpcs=', 'A6NaoxI5Ec20U1uu0zWfX2pSBbnJPvMdNTI6R4B7i8k=', 'J4A4SKCu2WqT+pQ7ZjXkUCF+E39K3nSmLXkXMicUtpc=', 'DLN4OcLJp/95iEy+x19B6b5eR8dtYVOCMb2BYpltb2c=', 'HwAm0L8fjh3VQjzC/sH7XNqh7NxMPLIY287vd8ANL5M=', 'AqfXu5cLim7S7mb6u7qVa22jsQD1tfuSju9C+XCCc8k=', 'DP1/QhXkNMjaF+wyWLC8YFrRqy6QqklDUeTuQLvEkfo=', 'GAsRtyBiKhVoSdxvf25/VxZZvmloIjDF7ZrDOXAKfN4=', 'BOlqllvOPToKJKSkV8lRWCyHE0nOfu4aq/5XipTGUBE=', 'FZMfeCtF9/tlbyzb0fdwXDU6I/4dMKWkahUi7RYN860=', 'LiluV8l6Uwms0m/r9VrJY6VETBxfcDrYig17l7ndOLE=', 'JhV7zreOhGu7Ji+aHgbUJxveWlvOjwQZlS+X/9E+rKg=', 'IZTriYR9aw8Yl/Z18ZwMVrYbEySO/zyjbjT7nRx57kM=', 'I1C/NUd2VomRUa193pbqeFfhVQFEcAjatrPSfI/6J08=', 'GkhvCuWRys2vCcWKScTReVQFQ1NAgZ4APwRp0RC3dSs=', 'G1bc92+yPMSoNNRVpAZeEzVxQCt98wnVm8MQXUKowwE=', 'GnSdeWSvC3ICkT7yBMZT8rS/tlzqt7aFIzq1nOO7aSU=', 'GK5ZAHP5aWlq92L/pOjw67+X+Mx4fjfN3R8yG+O+rbs=', 'IcR7J12C3eZGDV52mplCEUSxxanaWSlK3py7MXED8kk=', 'BHPdvVLnN+UnNk6OtjIHl1w41f1swysnIQKwgs0VGPs=', 'CxL6yVttOogdiSZXyEJOZFrE5rAFFfkC1ZRXQwKybgI=', 'CK52FqJgz2ZX+Pc6woRYjSxfB/9CXYN6p83O9j4+IQM=', 'A52vaHYoC4Doc78qMv0oNKg8aXV7rdWKiI74Gekmzig=', 'Jeex10cKPHXxPwtWVGyOCfLY7+/wbvdm+ceDyoadEw0=', 'Ho/TY0w/92QYTQNDX5hYSxG1sVrrnHUmLaPx6iwqnno=', 'JB3MUaw3gIpBXdHjwoHwWv8ReJ3Ayv3XejVITgmT+aQ=', 'H/wxU8Vu+XVZMs6ivgVzdJva/hxPoHgaS4tAeM6ddUc=', 'F2MNYtmj5RDIik1Dw2D5K8D6ALZgMa3sKb2VQ/06F+4=', 'KYBADt0ddOPWnbVFjSzNX6vbI27BaoKkMBoKtZ6kpuk=', 'MDT7JDZhI+xtyvytNXJtv7FhlMA23NZI+mlDm/zQDNQ=', 'Gqfo9Bicqd/z2yq3ZIvgojkplc5GBB4EaA3KitcjLfA=', 'H6GV+DSmnmI3L2DrSX2hZ2RurhQVPYA7OdxdEfXXgAs=', 'DyPxx01fv2GVrVpq7l5WmTxUd+hFP1uToNe6/TMwNtM=', 'AWVW+sk0inNatQqgiclxUbPKrwogo0+52TcFBaFRVyk=', 'I9kreTZIEQ/Fru8GM/DHfKyw27yhh5uKb25d9EXl9ws=', 'LkwQ7F5l4vI5u8Q8EwMd8mhqtA/XmjBLBdYRuCPyO3M=', 'EkGLv9d7Y61eFoZK2cMv+/xaPdm3jsK3kyn+XgqNKVM=', 'HkqKrOFavB1bdqnoSEMdLAanj3K2vrsSk+bFjlGFaW0=', 'Dz6WEH3s29aHLCDqCaz5LN8Xo+4dEzFIgJLZYXbet1U=', 'ASw3gCB/OVzCHesKvZUWge6jJJjdumzol6j58MI1cGc=', 'E+qxtOZyuhscG7kBdpMB8eVlnQPqEMYd4kd/8KwiFCE=', 'INxmSrsgt0VsBmKc43oeyxonpOiyTjG0i5xGNaowMj4=', 'LGseLP6njiw2eF52qM+xsFfpRx8k9bORF1w97LAeAA8=', 'GIySYlX1t689qWNVcpwqhnCrTCxwQASBsqyQN0Dgxas=', 'L5kTII4J49bp5vumOE/QdquJ8mYpduPjDghwuzDrVPI=', 'KzOAPZCIlwbnFPcgtWKNJvtgtUWh8+nOSaaukSsCQIY=', 'JsyrwQ6wQyfLXMPd4quzbwlwhsl+c4wTPJ9XB350iwk=', 'GxauDXxUQIy3X9kx8kZ1HysMPcINeegqJTG3bCK01d8=', 'EdC7RhvYryhE9J8PhAyU75UYslETRHQtH1Q4/j1BWuQ=', 'IzAxhHtHa+rQEY09szjokTPsQg1nPlBK1kclnfZVVx4=', 'H4TpeJW+5DjrPJLcmxhGya0pwWQ4ewautu0YQe2MTco=', 'J39/m1QvDCu19FvtBU8JYkU2AQw8+UUtInMZMyf4AdY=', 'HvyckGnlBouqwT0uZkVkG30n6A/CMHcWFTXERoLuV6k=', 'DW7Ed3YeLvusTxSzvz1SV6meZMPyX+EE+vmIsg/l/0Q=', 'Dg59fFUBmZt9Fhc7WbfK4fIDvvIa6/ACUYgUOcz5MBM=', 'IXvvL08SxtzJHCBYojORy3feU8puRNzcbqPTb+oybqY=', 'BXgMiK3wFTG1D4F+P+RER9KbNaqKOJxx6M8SJqzvaLo=', 'GHM4h6ays7TJDY5JkBluI0ReR9fqWTnr+4mj7j1ntL0=', 'ILrOY6z8rgscnyvuJLjp2oW6WX03sJBXIMTxXbIxsHo=', 'Fm6llTdaZ4asUn7p7O1z7Wv1UIdqvK86yStCyAiwDY8=', 'MEJiqe/0BArPQ+Mi1vUmdq4vhT7C56gNsAxIjPkXx04=', 'ImuscFAWbl9tt4zQsS028wW26MmgVRFK13Ceb1ckW2s=', 'JrL1OcVzgp9qypG6qVRQW8XD604d8dY4WCcX+98jiMw=', 'BqD79M1S6Tul5MbEr2XbAu6WKX+K0gDy8c/yUudptVE=', 'LLnCQRLTU0Gs6siDYPtSiSTli27KwyG5+ynmqjNo/yM=', 'IOiKTWB1Jt0H/gijVSpEZpEp64f8wLE6rI/or9kwFSE=', 'FURkmivXPjunLzlt+R3WVAHdj69R3jJfuu251TatlPw=', 'GYAHdFeZVxLETafhdxMljj+Os1S/2A7Z6vPsuvaWAQU=', 'JdHSL/E+dwXTwIX5f8Tk9pFLgv+qXSCR7GTaxCN2Xvc=', 'L+yZDvVW7+EDWkZP9VgedAZ0Rc1Uq8r2uMA5n+DSTPw=', 'G9lWNQbZVE7z5IMOE1RQEsV5N5wtzBMwQWxK5JvE7GE=', 'AK/80XumADxW36hVcfwpc3siWoDUgOfdft7AHxTyMBA=', 'I2cNuu+WaIHwf5GaLYgxKMeyPPdnpHeysuB2K8DbwYs=', 'H5OlMpFzlMfiL9F6vupjicZv164t2fAvhg9tlpR/Dt0=', 'LeQun1N7fWGwITdxwOdPVVUSvge2pQk0c04sW+tAvjc=', 'JcVX9FuZeBzTfTuyKTFmKmf3izd4LIhbRWu5bVXohAQ=', 'IHTItwlwXJiIU4p/ijxK/2R3Mb0W+OJU+nTqnyvnZiw=', 'Jzg1WVYpgTiUnkQhcdak5LdO8gZXQNt8/DoLYP1XOss=', 'E9Nq0KTr64GWl3hkllnGXLfQxBzFGYcf23Gp6moMqlY=', 'CKLBi6QTgTSMGs+/lhdxaAa0YqFpG8LjQ7ebgIXjdrA=', 'BZCS/Dla7ShYB7v1V62aEEH1nAeYIrEIhFeIL+57YSw=', 'FhkkFRtaWtLYysEZUiqZGpBvFehTHccFZ/ayg3HMJOM=', 'HGjKj3qhdlkHVAXvY0G45popi5pNcvO7hUswnkuoehs=', 'J/XQO8ocggf3I5pLLPc65VmhWqN+e93fOqsF7sXOVZI=', 'Dsv/SEaWKpddNH6pqPxGX7RoYVV2IvLCVkp+Y5gzwWk=', 'J3xN4jY9i1tFbPxaf/jkb/LsjapZhV9a1kvAUh86xWc=', 'GxGGLFKs01G3pGR5P0+7V/7Jn4MrYyJvldF1yNL8CLI=', 'BqcZxYTHT/vdchjrVly0yL2GyS49+zxz4VJyAapRI04=', 'Iw5K3uy3mYd/fOmljINrmdUzWEoZXB13oxOr4cfRJr0=', 'ELEJuGSAnEdnoTPM5sutbIhigXO46lHozKhYMMp95SI=', 'DiEReXDc+9SxUmslNjbzd1ONO0+q61qLJL9iANFMxZE=', 'Jmc0mXhAE2L2sXk57rDmT/VWB+vbNccHHbRrs+e6R3g=', 'BQAPpf2lBeApoTv+MEwmew2GxywDm6v20/8C7iRr4C4=', 'Jk2eCUrtX0GmAkIiCjSihAiQh7JDapv86BdMyb6MLiA=', 'CAdvnEdD3mEw/2Is9AHt0skvJL/hFPPF5ySJF0YxXEc=', 'EyNwq927Cx3VfypSDCUza9fO3pS5W79cIVHW2I5kG2Q=', 'CP8RFreiJ7/f1EZaZ4kIgrYVyMTBfyjY0klY7fYC3cs=', 'K8sLDbi54+ArfpwclGD92cbNmFYjMuZI2KPgq5RZdSA=', 'EupozmiBvsrX+KaxF7A6uXb3q9WX+QOwvyMNINIalDo=', 'J0OcmKdmiAZ6CXsZtv3X141fiOJ04Nj+peprdAb92n8=', 'AvQNCtBfVlLjHvlECtcevIQZ45NJOTfwXwBJnQKpnjY=', 'L78EKEMn7k9oDwa9OQ4wnQ0TrMdLnFsUtjBZuMx6v/U=', 'G+aG1T4qitV6gosGUUJc/Gl4xwJ+2/JH9rZyPCHfhuc=', 'JoO0JehaUI+WhS8UtCIPz+n3rYsXv+/A40jEfKeLtX8=', 'FtrOmy6AEuMdscfr5nLYa75hoao+FpPg7d/A3gqd2VE=', 'J6Mh+MfTyQIuli9/7y48hItFOdu3WqE58wQw/lRbzts=', 'BszXIQ3uHWsOIreeEtGQgtgHi3iNcQB7leendO2GplE=', 'CkHdQiIWU3Ur7zUPbXSpF7bLsf12o6EhZvTQvpeOQCY=', 'IgoCiB5NR6yU2VDN+DhidNF4LifL0NhFl43uyRKY8WU=', 'DiFVpUX+Xzy7Y5dgZYnqwZzZJjkznGsBcpikrTQItLk=', 'Dw8ZxikeUVRqJnxgzHdOX7nQiLrFMHgtiR7Br0uEcHM=', 'DpJbzRxt20o6HGfsje771AxTwNM+eu7xtGeVrtWUPJ0=', 'KtAAsXSKu4Es1uVBEoa5/z7wpb09JZo25F7wW561vus=', 'CmWqIy0y7W6N5j0c3/68Lz+mFkZcJ6r5fozT3P9khlI=', 'AmPYRwq0scYddNjoliQvTyYdyxZ6OgaSOJPXyyyT1qE=', 'KQHZRq3clLBA/VgATZpfjNGSZUDHqGEs7BxYy2DCs6U=', 'GInPqCCfSVLfkCLbncWDtXF6BpbaQc7mSTfQzWMh5pM=', 'I2Bk1xy2xkyEdHrCX8+NiBUC5fA7/4dWG4WhFrHzmso=', 'L/ehdP/Owphi4E9dvcc+vzZhVwAzV2KQwMH2zYztJ64=', 'GeckoddCyrEDRV8AQO33RaJpanEITJPjInFUUN1Nb1s=', 'A+7TiStvDmxdoQWcXzeTmFg1qig1AKgSmQSpTIfxYb8=', 'COK4Jzv6MMGshQMG2R5Gip6NBQkq7ky8gMaHJIRjujA=', 'B63Mp22DN3KIOaG2rDs+1Cr7h9cq+Y9S9Bby7FiyjOw=', 'Fx7zeJa64rECCgpYOb1ReEzhG7QjfVSMFxFp0y+hm0A=', 'IP/fy4b00AUGTtvClpGMMy0y++/xcp3lBWomq7w6Nfo=', 'COzXpvFzXu2GuqCU5gj0iPONuzmPz+1LmUODoMqORkc=', 'HD9dhuWSH96YkBifHYxhh1QohgDmkovBgqxNXkyfDMs=', 'KcYRhO2dRg8zdVihr2Oap+PAl15AFO2OvK1KJdUeq/M=', 'De/UWyiVhygiituy29rval6bGmSQKnNPQCuM77irO1Y=', 'CnTqItigkzYGBhAXmsHYL/+pSS33be7U6mDgEzsIEag=', 'A6N78S2vFADSl6xKwTuiTBfcJi2xbIUj3u5ODM3ppoA=', 'Ef4XkNWrv1k1/yIxjk9//mmWatovkTa1T4MOrLCmU2g=', 'AYFlhC9AY3XyNGaGkVr7FL8f4FZMiFjuO94Kuj3l9o8=', 'Jh2yXnz/Wp+3LydrH5JgtmcwD7fTYbUP1cDotplbBfk=', 'KjrDMUsrZueW++Nt93jF5GlyMgzEPsgHBIgmtnBLp8Q=', 'I8qkuA7PqZ6dP+orvB2782nRv8iTfQPQdAYcMP2M12s=', 'J9smAIXiJImN8UXyP2NfIGbY5OEk5YHoxiYZKbHf4Qc=', 'J09sX9NKeE1rkV7wXUJO5sC6u/Np55qxOLgWe1YY7H8=', 'LDop4TqE0moJEckona8apM9YQKraBwHVfiPfx5babaE=', 'HqIQ8gAaM00+gB9OUycNQtp6rzF6VTtCgqp46qIoLm0=', 'JU2+tSiEtpnBun+g1ugNYQkDsYo+UJw2NRzMOwJJRuM=', 'BZ54HWWJbr4OS6JtwvKZB/R7ze2kososcT2FBeox/V0=', 'C1sc7GPULV5hXcJpuIWiTO8wPseMly3RfNuz6RXMT/s=', 'KnwBXpw7LFfKi30m05obzIXW/6y32fvWbSqPHWTtDJI=', 'Kbc2uRHXGnnPY9im94bxG9Wr7iQWHcVnp8hR6uHkO1E=', 'KFdFqQp/49Ca9agIcEvGnG8XAeVzkS31zB4mXVlsQUE=', 'LZAbgZXDyWyMNuuZ/sATTsK4MEroEL0w2lVOMICCZxU=', 'GQXTUYNV6rp4WbWR7XuMnCU5gPBFDb31TXp3groFg5I=', 'I+gTAm/AuABk0ZtcVCiUL99+/qgL+o7ECVJyv9t7TJ8=', 'I8ChmiUsh+axwcIbGnmAAgDD+/8+MwDn5VaAcd6e+4E=', 'EcSuYHuuSSQTv2LNqiwoaO0f7G3AYxsGfKYPqxJbnio=', 'LNBV67fuRoY2XepFDwRv9iQF+uGxr8n7AXB8+B2g47k=', 'BTyf7y4CH6miD62iL96hUFtYoxWbu0czfb95GyFbFFI=', 'CjW9dOh8urqr6JrRMZ0snoY7TGMcIZOMmlOVv5eHKp8=', 'HBFQVlOc4gzVoE0aXEPisA++g7JZAb429d3EZm/Dg/4=', 'JClUBH5Xcv073tWQ7IvrTFQvLiZMjD4oTNxHNQXFGpA=', 'Diq9MVtHwNyThJwM3yZ+gRy9vbIApufCtn7ffLAXQhQ=', 'KCs3AgwIkNdRw/12lQ2AaGaOHf6uYh3VUtLeiH2i6nU=', 'KJM4UiZrUtnqa1u5I9nZTy5aW+XHeOdeB5QsI0tkO9k=', 'CZq2dlUFuhGY7xQOd7eVTU++eaBWznK6zjnASMANo88=', 'KvIR2OCsLY/af4SbjyKaIlxhhrVXYsensq4tHdhcV8s=', 'DNBw8jQBSigJq5DHHB2mHpipYyL+3Zm2qq4coQTz+s8=', 'Jnk+KryNPDDGBib7qhWPJjWH1r0Vgz1EixFiZLkwJWo=', 'IlvjbtDuheH4Ra2oTldIpWaZFSET/2G1BWtti95gwZ0=', 'AhdPSe2wLVFU0r7KLckrnMWVOD2h/ejwnkte4+paBl4=', 'D2SJHCyLAg5Gw1lMt1jwvdzb0JvQMIgW+0FzSoaYcsM=', 'GSqEyi+Z02mR4tKx3v85idHBVsI54Q6fVhQOGFRXYGc=', 'Kd/Ne2PwWr8nU6jDQda3pgxiQ7BMmhuLMyC7oEpNR4c=', 'HuJ61rm1qGdzOvxhorPnalK6PkvV5let6R/AOIGduls=', 'CrR3PxUMP4rTvJU49DzsOVp+NzGulz/v62I6CSF+ZMc=', 'E8NSoC9ZUYYgLLC5n6WMVUKrZ/m206Cv0QPe7/bYD0E=', 'KpfPLBDEv7/SmfZ8UqFp+SwFt9rFakHE3U/ofIJGzhQ=', 'AL7LtHBCvX+Mn2u0IhYtGu0ImihIL3/RarBqEyhf5wI=', 'AI5E2iHXOGkbiBdX7zftKcW9n3pEUPz1MpCpLMLKIXY=', 'KyBai21LcGPZMfO7XTRkBThD/n++S4PBeIP4ZSeIKhg=', 'LZ4yp8kFVv4QjSVawB513zOPzWOyv4TBkoDUJymIY/w=', 'KaMiqEwlvS3fbi5CACKNlavWNJoCJmrB27pSBzjOypc=', 'BnjJv8by3wEvT+VeM7torBTO0d8NAhUnkgidBG2CjEM=', 'D6/zpedCV5T+IKfg62FbixdgOUt/IwQoajrkAJEk2yM=', 'H49bYRr5/rnOqGwIQFgSBVPkBBA67iE/WkHR0CVBwNM=', 'Fgh12EeWAvlvQKzC0ELuUsFYi2op3kKEllptxskw6gc=', 'Fth6UYOjFqHXCvyVHv4s1mfHcyj8/aRYy/X+MEX0bZ4='],
    M: [['EkZm+AVh7VkW8vBwsb0kjG1T9E0nPZVqDIe5F2kqTRg=', 'EZJPAv0ZsJJVqqHPRuoFGOPXv+70dCFglJEBHbC9CwI=', 'JH+n8CIwShmU/1BUVsIgHvm3FzaUmNP/zkRmAe2d+EU=', 'A/17Ge8shh8i93/4EPVOJ3vJTrdsAtedmGvj3N8FHD8=', 'GL1BI5w+cVeaZ3RD7P+9VVqB7u6mk1Kmi2fIVjwMKgY=', 'LXjDpdKN6f81vwoldjUZblcwyn9ASTJ3B4zXXai069w='], ['ClFKXCJ/TOyV36Ap6N0STDSJWqRrsnwJEfN4DVAVVAo=', 'GS4W0X2VayV7haZS7v3y7glYnqxb6AkVd1cj0ssdoG0=', 'KYzgweMRO7k1xwWOd3K1M7GqnbDAkmvciRflYFyjrBA=', 'CUy06DYhr9Jx5BvHFyfwFY69YSI5rJ1pixf+S+Bbf8g=', 'A9iAOVvpPCfWSa9f0ULnazORjLiEHVooFzvVz30yh5E=', 'KO6ua1hmrWjkQ7uvkWgNt9fiswN+OP72G0LLzP/OyoE='], ['J4u0mntORK6kbrD4gstpKAGm5g/dW1wjxjzWXMzk/go=', 'Bj7ewb7YMfUGr422SNb96hRTRYh+i9z/EJA1odm2dNc=', 'G67xy1UJtSakIGH7U2V/mbMjJQDoVRksvoyUDgaMR18=', 'EyRWSse9+eIhZOmFjX+o42ixZerqPa9Otn7lnA3y5dQ=', 'AFdhuMauyxqMpOpN/CyDdgZKSoAEzu2iEKVSQFYt3BM=', 'EMnigxWdWMtMsuNf3oOjuh/cKAAu2ZY9KpnxhheKFI0='], ['DDmen2eqQHB6ID/u+wuVi72tzsXKNJAdJT0CaiQZ9qI=', 'CD8N8/GgNR0DMOw/9gLKjMNTt/bnYscQcYTNe0I0SfY=', 'Gmdk1ZQ/xKcgtMChn9uMcRmEMHKHpYubX59dWCEssmM=', 'ARpjom/qv4f6Zr3mbMJakiyWOC12xqf/SPFTe+rtaDo=', 'CMp7ZGV8NUjzK+9bY60kKIpBwLJRCZrSf5Q0MH4+ZNQ=', 'AZmCcEcek2GVVEawzbi+qRXsBnXxzWSN3LBDA1B6RIk='], ['HWs9X26jacJvgl0jYpM+qjHqNewKd8H72eAcoVI+RDI=', 'EZ7xiLs90NMjBpdsGZQehmS+aH56aWkton2iFabwbUA=', 'LZ4KtcBok9/f0DSBOBuoa25ikt9WCdcfLGSy2aefgJ4=', 'JfFmMb93Bg9+o0CHwCW/E1eEMZ7wjNouMUGe4KUp5lg=', 'FEx6EdpafF2rrj8z+9A8rYbRi8WUx5pJfsuYlO21VPE=', 'D5cRYmJ3I/P+rayyiwwQTLj3TeUIdS+o18DbKvE96O4='], ['JL5RAJVDYgbdCr0LDLuVyIOrMEqlJZixppMG7JgaaI0=', 'IRYQ4q1KN3Qm+t9waLDBpsKZoWTBwaYD6u2USHDQubk=', 'FaZ9mBBBsfbwnz+evv2GTnedOvCBV3hqwHdQXlDsefw=', 'BJMn+nnSjBKiyCQGlH938Gd1sCh0aLMTaHdwHb58lZg=', 'IwlA3MUjJlj/nClpej/UFtFw6MmY8aqF3qDELXn5Uao=', 'GxIcBJzRFZ4okAfgydqZlcxLq0wm+4iOw5cqii5laWQ=']]
  };
  _5.default = _default;

  Object.defineProperty(poseidon5$1, "__esModule", {
    value: true
  });
  var poseidon5_2 = poseidon5$1.poseidon5 = poseidon5;
  var _poseidon = _interopRequireDefault(poseidon_1);
  var _unstringify = _interopRequireDefault(unstringify);
  var _ = _interopRequireDefault(_5);
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
  const c = (0, _unstringify.default)(_.default);
  function poseidon5(inputs) {
    return (0, _poseidon.default)(inputs, c);
  }

  /**
   * Copyright
   * This code is a TypeScript adaptation of the 'blake-hash' library code (https://www.npmjs.com/package/blake-hash)
   * using the 'buffer' npm package (https://www.npmjs.com/package/buffer).
   * The 'js-crypto' library (https://github.com/iden3/js-crypto/blob/main/src/blake.ts) from Iden3 was used as a reference
   * for this work, specifically for types and adaptation.
   */
  /**
   * @module Blake
   * Implements the Blake-512 cryptographic hash function.
   * Blake-512 is part of the BLAKE family of cryptographic hash functions, known
   * for its speed and security. This module offers functionality to compute Blake-512
   * hashes of input data, providing both one-time hashing capabilities and incremental
   * hashing to process large or streaming data.
   *
   * This code is adapted from the "blake-hash" JavaScript library, ensuring compatibility
   * and performance in TypeScript environments. It supports hashing with optional
   * salt for enhanced security in certain contexts.
   */
  const zo = Buffer.from([0x01]);
  const oo = Buffer.from([0x81]);
  // Static properties for sigma, u256, u512, and padding are defined here below
  const sigma = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
      [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
      [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
      [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
      [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
      [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
      [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
      [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
      [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0],
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
      [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
      [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
      [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
      [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9]
  ];
  const u512 = [
      0x243f6a88, 0x85a308d3, 0x13198a2e, 0x03707344, 0xa4093822, 0x299f31d0, 0x082efa98, 0xec4e6c89, 0x452821e6,
      0x38d01377, 0xbe5466cf, 0x34e90c6c, 0xc0ac29b7, 0xc97c50dd, 0x3f84d5b5, 0xb5470917, 0x9216d5d9, 0x8979fb1b,
      0xd1310ba6, 0x98dfb5ac, 0x2ffd72db, 0xd01adfb7, 0xb8e1afed, 0x6a267e96, 0xba7c9045, 0xf12c7f99, 0x24a19947,
      0xb3916cf7, 0x0801f2e2, 0x858efc16, 0x636920d8, 0x71574e69
  ];
  const padding = Buffer.from([
      0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ]);
  /**
   * Performs a bitwise rotation on the values of two elements in an array.
   * This operation is a key component of the Blake-512 algorithm, enabling
   * the mixing of bits in a non-linear fashion.
   * @param v The array containing values to rotate.
   * @param i The index of the first element to rotate.
   * @param j The index of the second element to rotate.
   * @param n The number of bits to rotate by.
   */
  function rot(v, i, j, n) {
      let hi = v[i * 2] ^ v[j * 2];
      let lo = v[i * 2 + 1] ^ v[j * 2 + 1];
      if (n >= 32) {
          lo ^= hi;
          hi ^= lo;
          lo ^= hi;
          n -= 32;
      }
      if (n === 0) {
          v[i * 2] = hi >>> 0;
          v[i * 2 + 1] = lo >>> 0;
      }
      else {
          v[i * 2] = ((hi >>> n) | (lo << (32 - n))) >>> 0;
          v[i * 2 + 1] = ((lo >>> n) | (hi << (32 - n))) >>> 0;
      }
  }
  /**
   * The G function is one of the core operations in the Blake-512 compression function.
   * It mixes the input values based on the message block and the round constants,
   * contributing to the diffusion and confusion properties of the hash function.
   * @param v The working vector, part of the state being updated.
   * @param m - The message block being processed.
   * @param i The current round index.
   * @param a, b, c, d Indices within the working vector to mix.
   * @param e Index within the message block and round constants.
   */
  function g(v, m, i, a, b, c, d, e) {
      let lo;
      // v[a] += (m[sigma[i][e]] ^ u512[sigma[i][e+1]]) + v[b];
      lo = v[a * 2 + 1] + ((m[sigma[i][e] * 2 + 1] ^ u512[sigma[i][e + 1] * 2 + 1]) >>> 0) + v[b * 2 + 1];
      v[a * 2] =
          (v[a * 2] + ((m[sigma[i][e] * 2] ^ u512[sigma[i][e + 1] * 2]) >>> 0) + v[b * 2] + ~~(lo / 0x0100000000)) >>> 0;
      v[a * 2 + 1] = lo >>> 0;
      // v[d] = ROT( v[d] ^ v[a],32);
      rot(v, d, a, 32);
      // v[c] += v[d];
      lo = v[c * 2 + 1] + v[d * 2 + 1];
      v[c * 2] = (v[c * 2] + v[d * 2] + ~~(lo / 0x0100000000)) >>> 0;
      v[c * 2 + 1] = lo >>> 0;
      // v[b] = ROT( v[b] ^ v[c],25);
      rot(v, b, c, 25);
      // v[a] += (m[sigma[i][e+1]] ^ u512[sigma[i][e]])+v[b];
      lo = v[a * 2 + 1] + ((m[sigma[i][e + 1] * 2 + 1] ^ u512[sigma[i][e] * 2 + 1]) >>> 0) + v[b * 2 + 1];
      v[a * 2] =
          (v[a * 2] + ((m[sigma[i][e + 1] * 2] ^ u512[sigma[i][e] * 2]) >>> 0) + v[b * 2] + ~~(lo / 0x0100000000)) >>> 0;
      v[a * 2 + 1] = lo >>> 0;
      // v[d] = ROT( v[d] ^ v[a],16);
      rot(v, d, a, 16);
      // v[c] += v[d];
      lo = v[c * 2 + 1] + v[d * 2 + 1];
      v[c * 2] = (v[c * 2] + v[d * 2] + ~~(lo / 0x0100000000)) >>> 0;
      v[c * 2 + 1] = lo >>> 0;
      // v[b] = ROT( v[b] ^ v[c],11)
      rot(v, b, c, 11);
  }
  /**
   * Processes the carry for the bit length counter, ensuring it remains
   * within bounds as a 128-bit number.
   * @param arr The array representing the 128-bit counter.
   */
  function lengthCarry(arr) {
      for (let j = 0; j < arr.length; j += 1) {
          if (arr[j] < 0x0100000000)
              break;
          arr[j] -= 0x0100000000;
          arr[j + 1] += 1;
      }
  }
  /**
   * Represents a Blake-512 hash computation instance.
   * This class maintains the internal state, buffers, and counters needed to
   * process input data and produce the final hash output. It supports incremental
   * hashing, allowing data to be added in chunks.
   */
  /* eslint-disable import/prefer-default-export */
  class Blake512 {
      /**
       * Initializes a new Blake-512 hash instance with the default parameters.
       */
      constructor() {
          this._h = [
              0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1, 0x510e527f,
              0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179
          ];
          this._s = [0, 0, 0, 0, 0, 0, 0, 0];
          this._block = Buffer.alloc(128);
          this._blockOffset = 0;
          this._length = [0, 0, 0, 0];
          this._nullt = false;
          this._zo = zo;
          this._oo = oo;
      }
      /**
       * The core compression function for Blake-512. It transforms the internal
       * state based on the input block and the current hash parameters.
       */
      _compress() {
          const v = new Array(32);
          const m = new Array(32);
          let i;
          for (i = 0; i < 32; i += 1)
              m[i] = this._block.readUInt32BE(i * 4);
          for (i = 0; i < 16; i += 1)
              v[i] = this._h[i] >>> 0;
          for (i = 16; i < 24; i += 1)
              v[i] = (this._s[i - 16] ^ u512[i - 16]) >>> 0;
          for (i = 24; i < 32; i += 1)
              v[i] = u512[i - 16];
          if (!this._nullt) {
              v[24] = (v[24] ^ this._length[1]) >>> 0;
              v[25] = (v[25] ^ this._length[0]) >>> 0;
              v[26] = (v[26] ^ this._length[1]) >>> 0;
              v[27] = (v[27] ^ this._length[0]) >>> 0;
              v[28] = (v[28] ^ this._length[3]) >>> 0;
              v[29] = (v[29] ^ this._length[2]) >>> 0;
              v[30] = (v[30] ^ this._length[3]) >>> 0;
              v[31] = (v[31] ^ this._length[2]) >>> 0;
          }
          for (i = 0; i < 16; i += 1) {
              /* column step */
              g(v, m, i, 0, 4, 8, 12, 0);
              g(v, m, i, 1, 5, 9, 13, 2);
              g(v, m, i, 2, 6, 10, 14, 4);
              g(v, m, i, 3, 7, 11, 15, 6);
              /* diagonal step */
              g(v, m, i, 0, 5, 10, 15, 8);
              g(v, m, i, 1, 6, 11, 12, 10);
              g(v, m, i, 2, 7, 8, 13, 12);
              g(v, m, i, 3, 4, 9, 14, 14);
          }
          for (i = 0; i < 16; i += 1) {
              this._h[(i % 8) * 2] = (this._h[(i % 8) * 2] ^ v[i * 2]) >>> 0;
              this._h[(i % 8) * 2 + 1] = (this._h[(i % 8) * 2 + 1] ^ v[i * 2 + 1]) >>> 0;
          }
          for (i = 0; i < 8; i += 1) {
              this._h[i * 2] = (this._h[i * 2] ^ this._s[(i % 4) * 2]) >>> 0;
              this._h[i * 2 + 1] = (this._h[i * 2 + 1] ^ this._s[(i % 4) * 2 + 1]) >>> 0;
          }
      }
      /**
       * Adds padding to the message as per the Blake-512 specification, ensuring
       * the message length is a multiple of the block size.
       */
      _padding() {
          const len = this._length.slice();
          len[0] += this._blockOffset * 8;
          lengthCarry(len);
          const msglen = Buffer.alloc(16);
          for (let i = 0; i < 4; i += 1)
              msglen.writeUInt32BE(len[3 - i], i * 4);
          if (this._blockOffset === 111) {
              this._length[0] -= 8;
              this.update(this._oo);
          }
          else {
              if (this._blockOffset < 111) {
                  if (this._blockOffset === 0)
                      this._nullt = true;
                  this._length[0] -= (111 - this._blockOffset) * 8;
                  this.update(padding.subarray(0, 111 - this._blockOffset));
              }
              else {
                  this._length[0] -= (128 - this._blockOffset) * 8;
                  this.update(padding.subarray(0, 128 - this._blockOffset));
                  this._length[0] -= 111 * 8;
                  this.update(padding.subarray(1, 1 + 111));
                  this._nullt = true;
              }
              this.update(this._zo);
              this._length[0] -= 8;
          }
          this._length[0] -= 128;
          this.update(msglen);
      }
      /**
       * Completes the hash computation and returns the final hash value.
       * This method applies the necessary padding, performs the final compression,
       * and returns the hash output.
       * @returns The Blake-512 hash of the input data.
       */
      digest() {
          this._padding();
          const buffer = Buffer.alloc(64);
          for (let i = 0; i < 16; i += 1)
              buffer.writeUInt32BE(this._h[i], i * 4);
          return buffer;
      }
      /**
       * Updates the hash with new data. This method can be called multiple
       * times to incrementally add data to the hash computation.
       * @param data The data to add to the hash.
       * @returns This instance, to allow method chaining.
       */
      update(data) {
          const block = this._block;
          let offset = 0;
          while (this._blockOffset + data.length - offset >= block.length) {
              for (let i = this._blockOffset; i < block.length;)
                  /* eslint-disable no-plusplus */
                  block[i++] = data[offset++];
              this._length[0] += block.length * 8;
              lengthCarry(this._length);
              this._compress();
              this._blockOffset = 0;
          }
          while (offset < data.length)
              /* eslint-disable no-plusplus */
              block[this._blockOffset++] = data[offset++];
          return this;
      }
  }

  /**
   * Prunes a buffer to meet the specific requirements for using it as a private key
   * or part of a signature.
   * @param buff The buffer to be pruned.
   * @returns The pruned buffer.
   */
  function pruneBuffer(buff) {
      buff[0] &= 0xf8;
      buff[31] &= 0x7f;
      buff[31] |= 0x40;
      return buff;
  }
  /**
   * Validates if the given object is a valid point on the Baby Jubjub elliptic curve.
   * @param point The point to validate.
   * @returns True if the object is a valid point, false otherwise.
   */
  function isPoint(point) {
      return isArray(point) && point.length === 2 && isBigNumber(point[0]) && isBigNumber(point[1]);
  }
  /**
   * Checks if the provided object conforms to the expected format of a Signature.
   * @param signature The signature to validate.
   * @returns True if the object is a valid Signature, false otherwise.
   */
  function isSignature(signature) {
      return (isObject(signature) &&
          Object.prototype.hasOwnProperty.call(signature, "R8") &&
          Object.prototype.hasOwnProperty.call(signature, "S") &&
          isPoint(signature.R8) &&
          isBigNumber(signature.S));
  }
  /**
   * Validates and converts a BigNumberish private key to a Buffer.
   * @param privateKey The private key to check and convert.
   * @returns The private key as a Buffer.
   */
  function checkPrivateKey(privateKey) {
      requireTypes(privateKey, "privateKey", ["Buffer", "Uint8Array", "string"]);
      return Buffer.from(privateKey);
  }
  /**
   * Validates and converts a BigNumberish message to a bigint.
   * @param message The message to check and convert.
   * @returns The message as a bigint.
   */
  function checkMessage(message) {
      requireTypes(message, "message", ["bignumberish", "string"]);
      if (isBigNumberish(message)) {
          return bigNumberishToBigInt(message);
      }
      return bufferToBigInt(Buffer.from(message));
  }
  /**
   * Computes the Blake512 hash of the input message.
   * Blake512 is a cryptographic hash function that produces a hash value of 512 bits,
   * commonly used for data integrity checks and other cryptographic applications.
   * @param message The input data to hash, provided as a Buffer.
   * @returns A Buffer containing the 512-bit hash result.
   */
  function hash(message) {
      const engine = new Blake512();
      engine.update(Buffer.from(message));
      return engine.digest();
  }

  /**
   * Derives a secret scalar from a given EdDSA private key.
   *
   * This process involves hashing the private key with Blake1, pruning the resulting hash to retain the lower 32 bytes,
   * and converting it into a little-endian integer. The use of the secret scalar streamlines the public key generation
   * process by omitting steps 1, 2, and 3 as outlined in RFC 8032 section 5.1.5, enhancing circuit efficiency and simplicity.
   * This method is crucial for fixed-base scalar multiplication operations within the correspondent cryptographic circuit.
   * For detailed steps, see: {@link https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.5}.
   * For example usage in a circuit, see: {@link https://github.com/semaphore-protocol/semaphore/blob/2c144fc9e55b30ad09474aeafa763c4115338409/packages/circuits/semaphore.circom#L21}
   *
   * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
   * generate entropy and there is no limit in size.
   * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
   * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
   * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
   *
   * @param privateKey The EdDSA private key for generating the associated public key.
   * @returns The derived secret scalar to be used to calculate public key and optimized for circuit calculations.
   */
  function deriveSecretScalar(privateKey) {
      // Convert the private key to buffer.
      privateKey = checkPrivateKey(privateKey);
      let hash$1 = hash(privateKey);
      hash$1 = hash$1.slice(0, 32);
      hash$1 = pruneBuffer(hash$1);
      return shiftRight(leBufferToBigInt(hash$1), BigInt(3)) % subOrder;
  }
  /**
   * Derives a public key from a given private key using the
   * {@link https://eips.ethereum.org/EIPS/eip-2494|Baby Jubjub} elliptic curve.
   * This function utilizes the Baby Jubjub elliptic curve for cryptographic operations.
   * The private key should be securely stored and managed, and it should never be exposed
   * or transmitted in an unsecured manner.
   *
   * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
   * generate entropy and there is no limit in size.
   * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
   * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
   * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
   *
   * @param privateKey The private key used for generating the public key.
   * @returns The derived public key.
   */
  function derivePublicKey(privateKey) {
      const s = deriveSecretScalar(privateKey);
      return mulPointEscalar(Base8, s);
  }
  /**
   * Signs a message using the provided private key, employing Poseidon hashing and
   * EdDSA with the Baby Jubjub elliptic curve.
   *
   * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
   * generate entropy and there is no limit in size.
   * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
   * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
   * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
   *
   * @param privateKey The private key used to sign the message.
   * @param message The message to be signed.
   * @returns The signature object, containing properties relevant to EdDSA signatures, such as 'R8' and 'S' values.
   */
  function signMessage(privateKey, message) {
      // Convert the private key to buffer.
      privateKey = checkPrivateKey(privateKey);
      // Convert the message to big integer.
      message = checkMessage(message);
      const hash$1 = hash(privateKey);
      const sBuff = pruneBuffer(hash$1.slice(0, 32));
      const s = leBufferToBigInt(sBuff);
      const A = mulPointEscalar(Base8, shiftRight(s, BigInt(3)));
      const msgBuff = leBigIntToBuffer(message, 32);
      const rBuff = hash(Buffer.concat([hash$1.slice(32, 64), msgBuff]));
      const Fr = new F1Field(subOrder);
      const r = Fr.e(leBufferToBigInt(rBuff));
      const R8 = mulPointEscalar(Base8, r);
      const hm = poseidon5_2([R8[0], R8[1], A[0], A[1], message]);
      const S = Fr.add(r, Fr.mul(hm, s));
      return { R8, S };
  }
  /**
   * Verifies an EdDSA signature using the Baby Jubjub elliptic curve and Poseidon hash function.
   * @param message The original message that was be signed.
   * @param signature The EdDSA signature to be verified.
   * @param publicKey The public key associated with the private key used to sign the message.
   * @returns Returns true if the signature is valid and corresponds to the message and public key, false otherwise.
   */
  function verifySignature(message, signature, publicKey) {
      if (!isPoint(publicKey) ||
          !isSignature(signature) ||
          !inCurve(signature.R8) ||
          !inCurve(publicKey) ||
          BigInt(signature.S) >= subOrder) {
          return false;
      }
      // Convert the message to big integer.
      message = checkMessage(message);
      // Convert the signature values to big integers for calculations.
      const _signature = {
          R8: [BigInt(signature.R8[0]), BigInt(signature.R8[1])],
          S: BigInt(signature.S)
      };
      // Convert the public key values to big integers for calculations.
      const _publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1])];
      const hm = poseidon5_2([signature.R8[0], signature.R8[1], publicKey[0], publicKey[1], message]);
      const pLeft = mulPointEscalar(Base8, BigInt(signature.S));
      let pRight = mulPointEscalar(_publicKey, mul(hm, BigInt(8)));
      pRight = addPoint(_signature.R8, pRight);
      // Return true if the points match.
      return Fr.eq(pLeft[0], pRight[0]) && Fr.eq(pLeft[1], pRight[1]);
  }
  /**
   * Converts a given public key into a packed (compressed) string format for efficient transmission and storage.
   * This method ensures the public key is valid and within the Baby Jubjub curve before packing.
   * @param publicKey The public key to be packed.
   * @returns A string representation of the packed public key.
   */
  function packPublicKey(publicKey) {
      if (!isPoint(publicKey) || !inCurve(publicKey)) {
          throw new Error("Invalid public key");
      }
      // Convert the public key values to big integers for calculations.
      const _publicKey = [BigInt(publicKey[0]), BigInt(publicKey[1])];
      return packPoint(_publicKey);
  }
  /**
   * Unpacks a public key from its packed string representation back to its original point form on the Baby Jubjub curve.
   * This function checks for the validity of the input format before attempting to unpack.
   * @param publicKey The packed public key as a bignumberish.
   * @returns The unpacked public key as a point.
   */
  function unpackPublicKey(publicKey) {
      requireBigNumberish(publicKey, "publicKey");
      const unpackedPublicKey = unpackPoint(bigNumberishToBigInt(publicKey));
      if (unpackedPublicKey === null) {
          throw new Error("Invalid public key");
      }
      return unpackedPublicKey;
  }
  /**
   * Packs an EdDSA signature into a buffer of 64 bytes for efficient storage.
   * Use {@link unpackSignature} to reverse the process without needing to know
   * the details of the format.
   *
   * The buffer contains the R8 point packed int 32 bytes (via
   * {@link packSignature}) followed by the S scalar.  All encodings are
   * little-endian.
   *
   * @param signature the signature to pack
   * @returns a 64 byte buffer containing the packed signature
   */
  function packSignature(signature) {
      if (!isSignature(signature) || !inCurve(signature.R8) || BigInt(signature.S) >= subOrder) {
          throw new Error("Invalid signature");
      }
      const numericSignature = {
          R8: signature.R8.map((c) => BigInt(c)),
          S: BigInt(signature.S)
      };
      const packedR8 = packPoint(numericSignature.R8);
      const packedBytes = Buffer.alloc(64);
      packedBytes.set(leBigIntToBuffer(packedR8, 32), 0);
      packedBytes.set(leBigIntToBuffer(numericSignature.S, 32), 32);
      return packedBytes;
  }
  /**
   * Unpacks a signature produced by {@link packSignature}.  See that function
   * for the details of the format.
   *
   * @param packedSignature the 64 byte buffer to unpack
   * @returns a Signature with numbers in string form
   */
  function unpackSignature(packedSignature) {
      requireBuffer(packedSignature, "packedSignature");
      if (packedSignature.length !== 64) {
          throw new Error("Packed signature must be 64 bytes");
      }
      const sliceR8 = packedSignature.subarray(0, 32);
      const sliceS = packedSignature.subarray(32, 64);
      const unpackedR8 = unpackPoint(leBufferToBigInt(sliceR8));
      if (unpackedR8 === null) {
          throw new Error(`Invalid packed signature point ${sliceS.toString("hex")}.`);
      }
      return {
          R8: unpackedR8,
          S: leBufferToBigInt(sliceS)
      };
  }
  /**
   * Represents a cryptographic entity capable of signing messages and verifying signatures
   * using the EdDSA scheme with Poseidon hash and the Baby Jubjub elliptic curve.
   */
  class EdDSAPoseidon {
      /**
       * Initializes a new instance, deriving necessary cryptographic parameters from the provided private key.
       * If the private key is not passed as a parameter, a random 32-byte hexadecimal key is generated.
       *
       * The private key must be an instance of Buffer, Uint8Array or a string. The input will be used to
       * generate entropy and there is no limit in size.
       * The string is used as a set of raw bytes (in UTF-8) and is typically used to pass passwords or secret messages.
       * If you want to pass a bigint, a number or a hexadecimal, be sure to convert them to one of the supported types first.
       * The 'conversions' module in @zk-kit/utils provides a set of functions that may be useful in case you need to convert types.
       *
       * @param privateKey The private key used for signing and public key derivation.
       */
      constructor(privateKey = crypto_browser.getRandomValues(32)) {
          this.privateKey = privateKey;
          this.secretScalar = deriveSecretScalar(privateKey);
          this.publicKey = derivePublicKey(privateKey);
          this.packedPublicKey = packPublicKey(this.publicKey);
      }
      /**
       * Signs a given message using the private key and returns the signature.
       * @param message The message to be signed.
       * @returns The signature of the message.
       */
      signMessage(message) {
          return signMessage(this.privateKey, message);
      }
      /**
       * Verifies a signature against a message and the public key stored in this instance.
       * @param message The message whose signature is to be verified.
       * @param signature The signature to be verified.
       * @returns True if the signature is valid for the message and public key, false otherwise.
       */
      verifySignature(message, signature) {
          return verifySignature(message, signature, this.publicKey);
      }
  }

  exports.EdDSAPoseidon = EdDSAPoseidon;
  exports.derivePublicKey = derivePublicKey;
  exports.deriveSecretScalar = deriveSecretScalar;
  exports.packPublicKey = packPublicKey;
  exports.packSignature = packSignature;
  exports.signMessage = signMessage;
  exports.unpackPublicKey = unpackPublicKey;
  exports.unpackSignature = unpackSignature;
  exports.verifySignature = verifySignature;

  return exports;

})({});
