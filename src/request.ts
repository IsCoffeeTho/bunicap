export enum geminiState {
	BEGIN,
	PROCESSING,
	CLOSED,
}

export interface geminiRequest {
	hostname: string,
	endpoint: string,
	params: {[variable: string]: string}
	input?: string,
	state: geminiState,
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