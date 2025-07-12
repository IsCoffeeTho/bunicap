import type { Socket } from "bun";
import type { geminiRequest } from "./request";

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

	#sent: boolean = false;
	get sent() { return this.#sent }

	constructor(socket: Socket<geminiRequest>, req: geminiRequest) {
		this.#socket = socket;
		this.#req = req;
	}

	/**
	 * Tells the client that a certificate is required to continue
	 * 
	 * [Gemini Protocol standard Status 60](https://geminiprotocol.net/docs/protocol-specification.gmi#status-60)
	*/
	requireCertificate() {
		this.#socket.write(`60\r\n`);
		/** @TODO Implement certificate requests */
	}

	/**
	 * Sets the status code of the response
	*/
	status(code: geminiStatus) {

		return this;
	}

	type(MIMEType: string) {
		this.#type = MIMEType;
		return this;
	}

	redirect(uri: string) {
		if (!(30 <= this.#status && this.#status < 40))
			this.#status = 30;
		this.#socket.write(`${this.#status} ${uri}\r\n`);
		this.#socket.close();
		this.#req.sent = true;
	}

	send(data: string | Buffer) {
		if (this.#req.sent)
			return;
		if (20 <= this.#status && this.#status < 30) {
			this.#socket.write(`${this.#status} ${this.#type}\r\n${data.toString()}`);
		} else {
			this.#socket.write(`${this.#status} ${data.toString()}\r\n`);
		}
		this.#socket.close();
		this.#req.sent = true;
	}

	async sendFile(filename: string, errCallback?: (err: Error) => {}) {
		if (!(20 <= this.#status && this.#status < 30))
			throw new Error("Cannot send file when status of response is not 20-29.");
		var file = Bun.file(filename);
		
		if (!(await file.exists())) {
			var err = new Error("File does not exist")
			if (!errCallback) throw err;
			errCallback(err);
			return;
		}
			
		this.#req.sent = true;
		this.#socket.write(`${this.#status} ${this.#type}\r\n${await file.text()}`);
		this.#socket.close();
	}
}