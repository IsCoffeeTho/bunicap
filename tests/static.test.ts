import { expect, test } from "bun:test";
import { endpoint } from "./mockserver.test";
import geminiFetch from "./basicClient";

test("Index Path", async () => {
	var request = await geminiFetch(`${endpoint}/`);
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(request.body.toString()).toBe("TEST SERVER");
});

test("Test Route", async () => {
	var request = await geminiFetch(`${endpoint}/test-route`);
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(request.body.toString()).toBe("Success for Test Route");
});

test("Alt Test Route", async () => {
	var request = await geminiFetch(`${endpoint}/another-test-route`);
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(request.body.toString()).toBe("Success for Test Route again");
});

test("Test File Route", async () => {
	var request = await geminiFetch(`${endpoint}/test-file`);
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(request.body.toString()).toBe("# Test\nThis is a test file");
});

test("Not Found", async () => {
	var request = await geminiFetch(`${endpoint}/not-a-handled-path`);
	expect(request.status).toBe(51);
	expect(request.successful).toBeFalse();
	if (request.successful)
		return;
	expect(request.error).toBe("Not Found");
});

test("redirection", async () => { 
	var request = await geminiFetch(`${endpoint}/redirect`);
	expect(request.status).toBeWithin(30,39);
	expect(request.successful).toBeFalse();
	if (request.successful)
		return;
	var request = await geminiFetch(`${endpoint}${request.error}`);
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(request.body.toString()).toBe("PASS");
});

test("async", async () => {
	var delta = Date.now();
	var request = await geminiFetch(`${endpoint}/async`);
	delta = Date.now() - delta;
	
	expect(request.status).toBeWithin(20,29);
	expect(request.successful).toBeTrue();
	if (!request.successful)
		return;
	expect(delta).toBeGreaterThanOrEqual(50);
});
