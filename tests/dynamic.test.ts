import { endpoint } from "./mockserver.test";
import geminiFetch from "./basicClient";
import { expect, test } from "bun:test";

async function call(fn: string) {
	var cap = await geminiFetch(`${endpoint}/${fn}`);
	if (!cap.successful)
		throw new Error(cap.error);
	return cap.body.toString();
}

test("Dynamic Content", async () => {
	expect(await call("increment")).toBe("1");
	await call("increment")
	expect(await call("increment")).toBe("3");
	expect(await call("decrement")).toBe("2");
});

test("Parameters", async () => {
	expect(await call(`say/test`)).toBe("test");
	expect(await call(`say/example`)).toBe("example");
});

test("Certificates", async () => {
	console.warn("Certificate Tests are not implemented");
});