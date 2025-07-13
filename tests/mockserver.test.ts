import { beforeAll, expect, mock, test } from "bun:test";
import bunicap from "..";

const mockhost = "127.0.0.1";
const mockport = Math.floor(Math.random() * 9999) + 1000;

const endpoint = `gemini://${mockhost}:${mockport}`;

var dynamicCounter = 0;

const middleware = new bunicap({});

const mockserver = new bunicap({
	tls: {
		key: Bun.file(`${__dirname}/../localhost.key`),
		cert: Bun.file(`${__dirname}/../localhost.crt`)
	}
})
	.use(middleware)
	.path("/", (req, res) => {
		res.send("TEST SERVER");
	})
	.path("/async", async (req, res) => {
		await new Promise((res, rej) => {
			setTimeout(res, 50);
		});
		res.send("Waited 50ms before responding");
	})
	.path("/test-route", (req, res) => {
		res.send("Success for Test Route");
	})
	.path("/another-test-route", (req, res) => {
		res.send("Success for Test Route again");
	})
	.path("/test-file", (req, res) => {
		res.sendFile(`${__dirname}/mockserver/test.gmi`, (err) => {
			res.status(51).send("ENOENT"); // ENOENT means Error NO ENTity
		});
	})
	.path("/missing-file", (req, res) => {
		res.sendFile(`${__dirname}/mockserver/doesnt-exist.gmi`, () => {
			res.status(51).send("ENOENT");
		});
	})
	.path("/increment", (req, res) => {
		res.send(`${++dynamicCounter}`);
	})
	.path("/decrement", (req, res) => {
		res.send(`${--dynamicCounter}`);
	})
	.path("/redirect", (req, res) => {
		res.redirect(`/redirected`);
	})
	.path("/redirected", (req, res) => {
		res.send("PASS");
	})
	.path("/say/:word", (req, res) => {
		res.send(`${req.params.word}`);
	})
	.path("*", (req, res) => {
		res.status(51).send("Not Found");
	});

beforeAll(async () => {
	Bun.spawnSync(["bun", "run", "encrypt"]);
	mockserver.listen(mockhost, mockport, () => {
		console.log("Server Hooked!");
	});
});

export { mockhost, mockport, mockserver, endpoint };
