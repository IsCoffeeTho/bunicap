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
	 * [Gemini Protocol standard Status 60](https://geminiprotocol.net/docs/protocol-specification.gmi#status-60)
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
	*/
	requireInput(sensitive = false) {
		this.#socket.data.sent = true;
		this.#socket.data.state = geminiState.CLOSED;
		this.#socket.write(`${sensitive ? 11 : 10} Input Required\r\n`);
		this.#socket.close();
	}

	/**
	 * Sets the status code of the response
	*/
	status(code: geminiStatus) {
		const lowerLimit = 10;
		const upperLimit = 69;
		if (!(lowerLimit <= this.#status && this.#status <= upperLimit))
			throw new Error(`Gemini Status Codes must be within ${lowerLimit}-${upperLimit}`);
		this.#status = code;
		return this;
	}

	type(MIMEType: string) {
		this.#type = MIMEType;
		return this;
	}

	async redirect(uri: string)  {
		if (!(30 <= this.#status && this.#status < 40))
			this.#status = 30;
		this.#req.sent = true;
		this.#socket.write(`${this.#status} ${uri}\r\n`);
		this.#socket.close();
	}

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

	async sendFile(filename: string, errCallback?: (err: Error) => {}) {
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