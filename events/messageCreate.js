prefix = "_answer"
announcements_channel = "908478150349033503"
answers_channel = "892404757430435914"

const revealPuzzle = require('../functions/reveal_puzzle.js')
const logHours = require('../functions/log_hours.js')

module.exports = {
	name: "messageCreate",
	once: false,
	async execute(discord_client, db, message) {
		if (message.channel.id == answers_channel && message.content.startsWith(`${prefix} `)) {
			let id = `${message.author.tag}: ${message.content}`
			console.log(`\nANSWER RECEIVED | ${id} | ${logHours()}`)

			const puzzles = db.collection("testCollection0")
			const tracking = await db.collection("track").find().toArray()
			let current_puzzle_id = tracking[0].count
			let current_puzzle = await puzzles.findOne({id: current_puzzle_id})
			let submitted_answer = message.content.slice(8).toLowerCase()
			
			if (submitted_answer == current_puzzle.answer) {
				console.log(`${message.author.tag} has solved puzzle ${current_puzzle_id + 1}!`)
				let currentDate = new Date()
				await puzzles.updateOne({id: current_puzzle_id}, {$set: {solver: message.author.tag, solved_date: currentDate}})
				await db.collection("track").updateOne({count: current_puzzle_id}, {$set: {count: current_puzzle_id + 1}})

				let a_channel = message.guild.channels.cache.find(channel => channel.id == announcements_channel)
				a_channel.send(`${message.author} managed to solve the puzzle!`)

				revealPuzzle(a_channel, db, current_puzzle_id + 1)
			} else {
				console.log(`${message.author.tag} was wrong`)
				message.react("❌")
			}

			console.log(`ANSWER TREATED | ${id} | ${logHours()}`)
		} else if (message.author.id == "793902871619043400" && message.content.startsWith("_start")) {
			revealPuzzle(message.guild.channels.cache.find(channel => channel.id == announcements_channel), db, 0)
		}
	}
}
