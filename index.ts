import type { BunFile, TLSOptions } from "bun";
import { geminiState, type geminiRequest, makeRequest } from "./src/request";
import { geminiResponse, geminiStatus } from "./src/response";

export type bunicapOptions = {
	/** 
	 * Omit if the encryption is being handled by a proxy server
	 */
	tls?: TLSOptions
};

type handlerFn = (req: geminiRequest, res: geminiResponse, next: () => any) => any;

type handlerDescriptor = {
	path: string,
	handler: handlerFn | bunicap;
}

const geminiPathLike = /^([a-zA-Z0-9]|[\/+-_.]|\%[0-9a-fA-F][0-9a-fA-F])+$/;
const geminiPathPatternLike = /^(([a-zA-Z0-9]|[\/+-_.]|\%[0-9a-fA-F][0-9a-fA-F])+\*{0,1}|\*)$/;

export default class bunicap {
	#tls?: TLSOptions;

	#routes: handlerDescriptor[] = [];

	constructor(opt: bunicapOptions) {
		this.#tls = opt.tls;
	}

	use(capsule: bunicap): bunicap;
	use(endpoint: string, capsule: bunicap): bunicap;
	use(endpoint_or_capsule: string | bunicap, capsule?: bunicap) {
		var endpoint = "*";
		if (!capsule) {
			capsule = <bunicap>endpoint_or_capsule;
			endpoint = "*";
		} else
			endpoint = <string>endpoint_or_capsule;
		return this;
	}
	path(endpoint: string, handler: handlerFn) {
		if (!geminiPathPatternLike.test(endpoint))
			throw new Error('Path is invalid');
		this.#routes.push({
			path: endpoint,
			handler
		});
		return this;
	}

	#getRoutes(path: string) {
		return this.#routes.filter((route) => {
			if (route.path.at(-1) == '*')
				return (path.startsWith(route.path.slice(0, -1)));
			if (route.path.indexOf(":") != -1) {
				var master = route.path.split("/");
				var candidate = path.split("/");
				if (master.length != candidate.length)
					return false;
				for (var idx in master) {
					var key = <string>master[idx];
					if (key.startsWith(":"))
						continue;
					if (key != candidate[idx])
						return false;
				}
				return true;
			}
			return (route.path == path);
		});
	}

	async trickleRequest(req: geminiRequest, res: geminiResponse, next: Function) {
		var continueAfterCatch = false;
		var caughtOnce = false;
		var nextFn: (() => any) = () => { continueAfterCatch = true; };
		var routes = this.#getRoutes(req.endpoint);
		if (routes.length == 0)
			return false;
		for (var route of routes) {
			if (route.path.indexOf(":") != -1) {
				var master = route.path.split("/");
				var candidate = req.endpoint.split("/");
				if (master.length != candidate.length)
					return false;
				for (var idx in master) {
					var key = <string>master[idx];
					if (!key.startsWith(":"))
						continue;
					req.params[key.slice(1)] = <string>candidate[idx];
				}
			}
			continueAfterCatch = false;
			if (typeof route.handler == "function") {
				caughtOnce = true;
				await route.handler(req, res, nextFn);
			} else {
				var savedPath = req.endpoint;
				req.endpoint = req.endpoint.split('/').slice(1, route.path.split('/').length - 1).join("/");
				if (!req.endpoint.startsWith('/'))
					req.endpoint = '/' + req.endpoint;
				if (await route.handler.trickleRequest(req, res, nextFn))
					caughtOnce = true;
				else
					continueAfterCatch = true;
				req.endpoint = savedPath;
			}
			if (!continueAfterCatch)
				break;
		}
		if (continueAfterCatch)
			next();
		return caughtOnce;
	}

	listen(address: string, port: number, callback?: (capsule: Bun.TCPSocketListener<geminiRequest>) => any) {
		var _this = this;
		
		if (this.#tls) {
			this.#tls.requestCert = true;
			this.#tls.rejectUnauthorized = false;
		}
		
		var s = Bun.listen<geminiRequest>({
			hostname: address,
			port,
			tls: _this.#tls,
			socket: {
				async data(socket, data) {
					if (!socket.data)
						socket.data = makeRequest();
					if (socket.data.state == geminiState.BEGIN) {
						socket.data.state = geminiState.PROCESSING;
						try {
							var req = data.toString();

							if (!req.endsWith(`\r\n`))
								throw new Error(`Bad Request Termination`);

							if (req.split('\r\n').length > 2) { // assumed HTTPS
								socket.write([
									'HTTP/1 400 gemini protocol required',
									'400 gemini protocol required'
								].join("\r\n\r\n"));
								socket.close();
								return;
							}

							var uri = new URL(req);
							if (uri.protocol != "gemini:")
								throw new Error("Bad Protocol");
							var request = socket.data;
							
							var clientCert = socket.getPeerCertificate();
							if (clientCert != null)
								request.certificate = clientCert;
							
							request.hostname = uri.hostname;
							request.endpoint = uri.pathname;
							if (uri.search)
								request.search = uri.search.slice(1);
							const response = new geminiResponse(socket, request);

							if (!(await _this.trickleRequest(socket.data, response, () => { }))) {
								response.status(geminiStatus.Failure).send("Failed to Respond");
							}
						} catch (err: any) {
							console.log(err.message);
							socket.write(`40 ${err.message}\r\n`);
							socket.data.state = geminiState.CLOSED;
							socket.close();
						}
					} else {
						socket.write(`40 Unexpected Data\r\n`);
						socket.data.state = geminiState.CLOSED;
						socket.close();
					}

				}
			}
		});
		if (callback) callback(s);
		return this;
	}
}