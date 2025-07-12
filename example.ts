import bunicap from ".";

const capsule = new bunicap({
	tls: {
		key: Bun.file(`${__dirname}/localhost.key`),
		cert: Bun.file(`${__dirname}/localhost.crt`)
	}
});

capsule.path("/", (req, res) => {
	res.sendFile(`${__dirname}/assets/bunicap.gmi`);
});

capsule.listen("0.0.0.0", 1965, (capsule) => {
	console.log(capsule.hostname, capsule.port);
});