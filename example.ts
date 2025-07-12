import bunicap from ".";
import { geminiStatus } from "./src/response";

const capsule = new bunicap({
	tls: {
		key: Bun.file(`${__dirname}/localhost.key`),
		cert: Bun.file(`${__dirname}/localhost.crt`)
	}
});

capsule.path("/", (req, res) => {
	res.sendFile(`${__dirname}/assets/bunicap.gmi`);
});

capsule.path("/redirect", (req, res) => {
	res.redirect("/");
});

capsule.path("*", (req, res) => {
	res
		.status(geminiStatus.NotFound) // code 51
		.send("Capsule Not Found");
});

capsule.listen("0.0.0.0", 1965, (capsule) => {
	console.log(capsule.hostname, capsule.port);
});