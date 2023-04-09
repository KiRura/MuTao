"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = exports.urlQuery = void 0;
const autobind_decorator_1 = __importDefault(require("autobind-decorator"));
const eventemitter3_1 = require("eventemitter3");
const reconnecting_websocket_1 = __importDefault(require("reconnecting-websocket"));
function urlQuery(obj) {
    const params = Object.entries(obj)
        .filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined)
        .reduce((a, [k, v]) => (a[k] = v, a), {});
    return Object.entries(params)
        .map((e) => `${e[0]}=${encodeURIComponent(e[1])}`)
        .join('&');
}
exports.urlQuery = urlQuery;
class Stream extends eventemitter3_1.EventEmitter {
    constructor(origin, user, options) {
        super();
        this.state = 'initializing';
        this.sharedConnectionPools = [];
        this.sharedConnections = [];
        this.nonSharedConnections = [];
        this.idCounter = 0;
        options = options || {};
        const query = urlQuery({
            i: user?.token,
            _t: Date.now(),
        });
        const wsOrigin = origin.replace('http://', 'ws://').replace('https://', 'wss://');
        this.stream = new reconnecting_websocket_1.default(`${wsOrigin}/streaming?${query}`, '', {
            minReconnectionDelay: 1,
            WebSocket: options.WebSocket,
        });
        this.stream.addEventListener('open', this.onOpen);
        this.stream.addEventListener('close', this.onClose);
        this.stream.addEventListener('message', this.onMessage);
    }
    genId() {
        return (++this.idCounter).toString();
    }
    useChannel(channel, params, name) {
        if (params) {
            return this.connectToChannel(channel, params);
        }
        else {
            return this.useSharedConnection(channel, name);
        }
    }
    useSharedConnection(channel, name) {
        let pool = this.sharedConnectionPools.find(p => p.channel === channel);
        if (pool == null) {
            pool = new Pool(this, channel, this.genId());
            this.sharedConnectionPools.push(pool);
        }
        const connection = new SharedConnection(this, channel, pool, name);
        this.sharedConnections.push(connection);
        return connection;
    }
    removeSharedConnection(connection) {
        this.sharedConnections = this.sharedConnections.filter(c => c !== connection);
    }
    removeSharedConnectionPool(pool) {
        this.sharedConnectionPools = this.sharedConnectionPools.filter(p => p !== pool);
    }
    connectToChannel(channel, params) {
        const connection = new NonSharedConnection(this, channel, this.genId(), params);
        this.nonSharedConnections.push(connection);
        return connection;
    }
    disconnectToChannel(connection) {
        this.nonSharedConnections = this.nonSharedConnections.filter(c => c !== connection);
    }
    onOpen() {
        const isReconnect = this.state === 'reconnecting';
        this.state = 'connected';
        this.emit('_connected_');
        if (isReconnect) {
            for (const p of this.sharedConnectionPools)
                p.connect();
            for (const c of this.nonSharedConnections)
                c.connect();
        }
    }
    onClose() {
        if (this.state === 'connected') {
            this.state = 'reconnecting';
            this.emit('_disconnected_');
        }
    }
    onMessage(message) {
        const { type, body } = JSON.parse(message.data);
        if (type === 'channel') {
            const id = body.id;
            let connections;
            connections = this.sharedConnections.filter(c => c.id === id);
            if (connections.length === 0) {
                const found = this.nonSharedConnections.find(c => c.id === id);
                if (found) {
                    connections = [found];
                }
            }
            for (const c of connections) {
                c.emit(body.type, body.body);
                c.inCount++;
            }
        }
        else {
            this.emit(type, body);
        }
    }
    send(typeOrPayload, payload) {
        const data = payload === undefined ? typeOrPayload : {
            type: typeOrPayload,
            body: payload,
        };
        this.stream.send(JSON.stringify(data));
    }
    close() {
        this.stream.close();
    }
}
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "genId", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "useChannel", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "useSharedConnection", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "removeSharedConnection", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "removeSharedConnectionPool", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "connectToChannel", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "disconnectToChannel", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "onOpen", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "onClose", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "onMessage", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "send", null);
__decorate([
    autobind_decorator_1.default
], Stream.prototype, "close", null);
exports.default = Stream;
class Pool {
    constructor(stream, channel, id) {
        this.users = 0;
        this.isConnected = false;
        this.channel = channel;
        this.stream = stream;
        this.id = id;
        this.stream.on('_disconnected_', this.onStreamDisconnected);
    }
    onStreamDisconnected() {
        this.isConnected = false;
    }
    inc() {
        if (this.users === 0 && !this.isConnected) {
            this.connect();
        }
        this.users++;
        if (this.disposeTimerId) {
            clearTimeout(this.disposeTimerId);
            this.disposeTimerId = null;
        }
    }
    dec() {
        this.users--;
        if (this.users === 0) {
            this.disposeTimerId = setTimeout(() => {
                this.disconnect();
            }, 3000);
        }
    }
    connect() {
        if (this.isConnected)
            return;
        this.isConnected = true;
        this.stream.send('connect', {
            channel: this.channel,
            id: this.id,
        });
    }
    disconnect() {
        this.stream.off('_disconnected_', this.onStreamDisconnected);
        this.stream.send('disconnect', { id: this.id });
        this.stream.removeSharedConnectionPool(this);
    }
}
__decorate([
    autobind_decorator_1.default
], Pool.prototype, "onStreamDisconnected", null);
__decorate([
    autobind_decorator_1.default
], Pool.prototype, "inc", null);
__decorate([
    autobind_decorator_1.default
], Pool.prototype, "dec", null);
__decorate([
    autobind_decorator_1.default
], Pool.prototype, "connect", null);
__decorate([
    autobind_decorator_1.default
], Pool.prototype, "disconnect", null);
class Connection extends eventemitter3_1.EventEmitter {
    constructor(stream, channel, name) {
        super();
        this.inCount = 0;
        this.outCount = 0;
        this.stream = stream;
        this.channel = channel;
        this.name = name;
    }
    send(type, body) {
        this.stream.send('ch', {
            id: this.id,
            type: type,
            body: body,
        });
        this.outCount++;
    }
}
__decorate([
    autobind_decorator_1.default
], Connection.prototype, "send", null);
exports.Connection = Connection;
class SharedConnection extends Connection {
    constructor(stream, channel, pool, name) {
        super(stream, channel, name);
        this.pool = pool;
        this.pool.inc();
    }
    get id() {
        return this.pool.id;
    }
    dispose() {
        this.pool.dec();
        this.removeAllListeners();
        this.stream.removeSharedConnection(this);
    }
}
__decorate([
    autobind_decorator_1.default
], SharedConnection.prototype, "dispose", null);
class NonSharedConnection extends Connection {
    constructor(stream, channel, id, params) {
        super(stream, channel);
        this.params = params;
        this.id = id;
        this.connect();
    }
    connect() {
        this.stream.send('connect', {
            channel: this.channel,
            id: this.id,
            params: this.params,
        });
    }
    dispose() {
        this.removeAllListeners();
        this.stream.send('disconnect', { id: this.id });
        this.stream.disconnectToChannel(this);
    }
}
__decorate([
    autobind_decorator_1.default
], NonSharedConnection.prototype, "connect", null);
__decorate([
    autobind_decorator_1.default
], NonSharedConnection.prototype, "dispose", null);
//# sourceMappingURL=streaming.js.map