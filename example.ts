import bunicap from ".";

const app = new bunicap({
	tls: {
		key: Bun.file(`${__dirname}/localhost.key`),
		cert: Bun.file(`${__dirname}/localhost.crt`)
	}
}).path("/", (req, res) => {
	res.sendFile(`${__dirname}/assets/bunicap.gmi`);
})

app.listen("0.0.0.0", 1965, (app) => {
	console.log(app.hostname, app.port);
})