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


capsule.path("/input", (req, res) => {
	if (!req.search)
		return res.requireInput();
	
	res.send(`# Search\n> ${req.search}`);
	
});

capsule.path("/cert", (req, res) => {
	if (!req.certificate)
		return res.requireCertificate();
	
	// more is to be understood about how one could authenticate with these
	res.send(`Welcome ${req.certificate.subject.CN}`);
});

capsule.path("/redirect", (req, res) => {
	res.redirect("/");
});

capsule.path("*", (req, res) => {
	res
		.status(geminiStatus.NotFound) // code 51
		.send("Not Found");
});

capsule.listen("0.0.0.0", 1965, (capsule) => {
	console.log(capsule.hostname, capsule.port);
});