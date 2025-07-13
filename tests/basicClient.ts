import type { BunFile } from "bun";

export type response = {	
	status: number,
} & ({
	successful: true,
	type: string,
	body: Buffer
} | {
	successful: false,
	error: string
});

export default function geminiFetch(capsule: string, certificate?: BunFile): Promise<response> {
	return new Promise<response>((res, rej) => {
		const uri = new URL(capsule);
		Bun.connect({
			hostname: uri.hostname,
			port: parseInt(uri.port == '' ? "1965" : uri.port),
			tls: (certificate ? {
				cert: certificate
			} : true),
			socket: {
				open(socket) {
					socket.write(`${uri.toString()}\r\n`);
				},
				data(socket, data) {
					socket.close();
					
					var response = data.toString();
					var responseLineIdx = response.indexOf("\r\n");
					
					if (responseLineIdx == -1)
						return rej(new Error("Server didn't respond as expected"));
					
					response = response.slice(0,responseLineIdx);
					data = data.subarray(responseLineIdx+2);
					
					var statusCode = parseInt(response.slice(0,2));
					var statusMessage = response.slice(3);
					
					var successful = (20 <= statusCode && statusCode < 30);
					
					if (successful)
						res({
							status: statusCode,
							successful,
							type: statusMessage,
							body: data,
						});
					else
						res({
							status: statusCode,
							successful,
							error: statusMessage
						});
				}
			}
		})
	})
}