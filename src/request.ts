export enum geminiState {
	BEGIN,
	PROCESSING,
	CLOSED,
}

export interface geminiRequest {
	hostname: string;
	endpoint: string;
	params: {[variable: string]: string};
	search?: string;
	certificate?: import("tls").PeerCertificate;
	state: geminiState;
	sent: boolean
}

export function makeRequest(): geminiRequest {
	return {
		endpoint: "",
		hostname: "",
		params: {},
		state: geminiState.BEGIN,
		sent: false
	}
}