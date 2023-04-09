"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = exports.parse = void 0;
function parse(acct) {
    if (acct.startsWith('@'))
        acct = acct.substr(1);
    const split = acct.split('@', 2);
    return { username: split[0], host: split[1] || null };
}
exports.parse = parse;
function toString(acct) {
    return acct.host == null ? acct.username : `${acct.username}@${acct.host}`;
}
exports.toString = toString;
//# sourceMappingURL=acct.js.map