module.exports = {
	name: "ready",
	once: true,
	execute(client) {console.log(`honey-chan is now ready to operate on "${client.user.tag}"`)}
}
