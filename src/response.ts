import type { Socket } from "bun";
import { geminiState, type geminiRequest } from "./request";
import { MIMETypeFromExtension } from "./MIMETypes";

export enum geminiStatus {
	InputRequired = 10,
	SensitiveInputRequired = 11,

	OK = 20,

	TemporaryRedirect = 30,
	PermanentRedirect = 31,

	ServerUnavailable = 41,
	CGIError = 42,
	ProxyError = 43,
	SlowDown = 44,

	Failure = 50,
	NotFound = 51,
	Gone = 52,
	ProxyRequestRefused = 53,
	BadRequest = 59,

	RequestCertificate = 60,
	CertificateNotAuthorized = 61,
	CertificateInvalid = 62,
}

export class geminiResponse {
	#socket: Socket<geminiRequest>;
	#req: geminiRequest;
	#status: geminiStatus = 20;

	#type: string = "text/gemini";

	constructor(socket: Socket<geminiRequest>, req: geminiRequest) {
		this.#socket = socket;
		this.#req = req;
	}

	/**
	 * Tells the client to require a certificate in the next request
	 * 
	 * @see {@link https://geminiprotocol.net/docs/protocol-specification.gmi#status-60}
	*/
	requireCertificate() {
		this.#socket.data.sent = true;
		this.#socket.data.state = geminiState.CLOSED;
		this.#socket.write(`60 Certificate Required\r\n`);
		this.#socket.close();
	}
	
	/**
	 * Tells the client to ask the user for an input
	 * 
	 * if true is provided in the arguments, it asks the user for a password
	 * or a hidden text input for sensitive data
	 * 
	 * @see {@link https://geminiprotocol.net/docs/protocol-specification.gmi#status-10}
	*/
	requireInput(sensitive = false) {
		this.#socket.data.sent = true;
		this.#socket.data.state = geminiState.CLOSED;
		this.#socket.write(`${sensitive ? 11 : 10} Input Required\r\n`);
		this.#socket.close();
	}

	/**
	 * Sets the status code of the response
	 * 
	 * @see {@link https://geminiprotocol.net/docs/protocol-specification.gmi#status-codes}
	*/
	status(code: geminiStatus) {
		const lowerLimit = 10;
		const upperLimit = 69;
		if (!(lowerLimit <= this.#status && this.#status <= upperLimit))
			throw new Error(`Gemini Status Codes must be within ${lowerLimit}-${upperLimit}`);
		this.#status = code;
		return this;
	}

	/**
	 * Sets the type of the data being sent to the client
	 * 
	 * @see {@link https://geminiprotocol.net/docs/protocol-specification.gmi#success}
	 */
	type(MIMEType: string) {
		this.#type = MIMEType;
		return this;
	}

	/**
	 * Tells the client to change request endpoint to a new capsule or path
	 * 
	 * @see {@link https://geminiprotocol.net/docs/protocol-specification.gmi#status-30}
	 */
	async redirect(uri: string)  {
		if (!(30 <= this.#status && this.#status < 40))
			this.#status = 30;
		this.#req.sent = true;
		this.#socket.write(`${this.#status} ${uri}\r\n`);
		this.#socket.close();
	}

	/**
	 * If the status is a SUCCESS (2x): Sets the body of the response,
	 * else: sets the error message,
	 * 
	 * Then it sends the response to the client.
	 * 
	 * @see {@link geminiResponse.sendFile}
	 */
	async send(data: string | Buffer) {
		if (this.#req.sent)
			return;
		this.#req.sent = true;
		this.#req.state = geminiState.CLOSED;
		if (20 <= this.#status && this.#status < 30) {
			this.#socket.write(`${this.#status} ${this.#type}\r\n`);
			this.#socket.write(data);
		} else
			this.#socket.write(`${this.#status} ${typeof data == "string" ? data : data.toString()}\r\n`);
		this.#socket.close();
	}

	/**
	 * Sets 
	 * 
	 * @see {@link geminiResponse.send}
	 */
	async sendFile(filename: string, errCallback?: (err: Error) => any) {
		if (!(20 <= this.#status && this.#status < 30))
			throw new Error("Cannot send file when status of response is not 20-29.");
		try {		
			var file = Bun.file(filename);

			if (!(await file.exists()))
				throw new Error("File does not exist");
			this.#type = MIMETypeFromExtension(filename);

			this.#req.sent = true;
			this.#req.state = geminiState.CLOSED;
			this.#socket.write(`${this.#status} ${this.#type}\r\n${await file.text()}`);
			this.#socket.close();
			
		} catch (err: any) {
			if (!errCallback) throw err;
			errCallback(err);
			return;
		}
	}
}