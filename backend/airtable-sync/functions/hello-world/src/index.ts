// function-source/helloWorld.ts
/**
 * Responds to any HTTP request with a simple "Hello, World!" message.
 *
 * @param req HTTP request context.
 * @param res HTTP response context.
 */
const helloWorld = (req: any, res: any) => {
	console.log("Hello, World! Function was triggered.");
	res.status(200).send("Hello, World!!");
};

export { helloWorld };

