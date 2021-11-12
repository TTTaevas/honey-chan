module.exports = function logHours() {
	let currentDate = new Date()
	return `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`
}