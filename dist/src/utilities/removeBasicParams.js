"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeBasicParams = void 0;
const removeBasicParams = (query) => {
    if (query.search)
        delete query.search;
    if (query.limit)
        delete query.limit;
    if (query.skip)
        delete query.skip;
    return query;
};
exports.removeBasicParams = removeBasicParams;
