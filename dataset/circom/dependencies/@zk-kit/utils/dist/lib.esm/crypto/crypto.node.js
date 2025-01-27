/**
 * @module @zk-kit/utils
 * @version 1.2.1
 * @file Essential zero-knowledge utility library for JavaScript developers.
 * @copyright Ethereum Foundation 2024
 * @license MIT
 * @see [Github]{@link https://github.com/privacy-scaling-explorations/zk-kit/tree/main/packages/utils}
*/
import { randomBytes } from 'crypto';

/**
 * Generates a random sequence of bytes securely using Node.js's crypto module.
 * @param size The number of bytes to generate.
 * @returns A Uint8Array containing the generated random bytes.
 */
/* eslint-disable import/prefer-default-export */
function getRandomValues(size) {
    if (size <= 0)
        throw Error(`size ${size} is too small, need at least 1`);
    const buffer = randomBytes(size);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export { getRandomValues };
