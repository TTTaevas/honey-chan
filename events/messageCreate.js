prefix = "_answer"
announcements_channel = "909931933201481771"
answers_channel = "909932040256905286"

host_id = "202908462722711552"
programmer_id = "793902871619043400"

started = false
thinking_time = false

const revealPuzzle = require('../functions/reveal_puzzle.js')
const logHours = require('../functions/log_hours.js')

module.exports = {
	name: "messageCreate",
	once: false,
	async execute(discord_client, db, message) {

		// TREAT ANSWERS
		if (started && !thinking_time && message.channel.id == answers_channel && message.content.startsWith(`${prefix} `)) {
			let id = `${message.author.tag}: ${message.content}`
			console.log(`\nANSWER RECEIVED | ${id} | ${logHours()}`)

			const puzzles = db.collection("testCollection0")
			const tracking = await db.collection("track").find().toArray()
			let current_puzzle_id = tracking[0].count
			let current_puzzle = await puzzles.findOne({id: current_puzzle_id})
			let submitted_answer = message.content.slice(8).toLowerCase()
			
			if (submitted_answer == "penis") {message.react("🍆")}
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

		// START WITH THE PUZZLE REVEAL PERIOD
		} else if (!started && (message.author.id == host_id || message.author.id == programmer_id) && message.content.startsWith("_start")) {
			const tracking = await db.collection("track").find().toArray()
			let current_puzzle_id = tracking[0].count

			started = true
			console.log(`\n(${logHours()}) ${message.author.tag} has started the puzzle reveal period, with puzzle ${current_puzzle_id + 1}\n`)
			revealPuzzle(message.guild.channels.cache.find(channel => channel.id == announcements_channel), db, current_puzzle_id)

		// RESET TRACKING, REMOVE SOLVERS
		} else if (!started && (message.author.id == host_id || message.author.id == programmer_id) && message.content.startsWith("_reset")) {
			console.log(`\n(${logHours()}) ${message.author.tag} is resetting progress...`)
			const track_collection = await db.collection("track")
			const tracking = await track_collection.find().toArray()
			let track_object = tracking[0]._id
			await track_collection.updateOne({_id: track_object}, {$set: {count: 0}})

			const puzzles = db.collection("testCollection0")
			await puzzles.updateMany({}, {$set: {solver: ""}})
			console.log(`Progress has been reset\n`)
			message.reply("done resetting")
		
		// ADD PUZZLE
		} else if ((message.author.id == host_id || message.author.id == programmer_id) && message.content.startsWith("_add")) {
			const p_args = message.content.split(";")
			if (p_args.length < 6) {return message.reply(`Not enough arguments (\`${p_args.toString()}\`)`)}
			const puzzles = db.collection("testCollection0")
			let all_puzzles = await puzzles.find()
			let all_puzzles_arr = await all_puzzles.toArray()
			let new_puzzle_id = all_puzzles_arr.length

			let doc = {
				id: new_puzzle_id,
				question: p_args[1],
				answer: p_args[2],
				hints: [],
				expire_in_minutes_after_reveal: Number(p_args[3]),
				image_url: p_args[4] != "none" ? p_args[4] : "",
				solver: "",
				solved_date: new Date("1898-12-31T23:50:39.000+00:00"),
			}
			let p_image = p_args[4] != "none" ? p_args[4] : ""

			const hints = p_args[5].split("&")
			hints.forEach((hint) => {
				let actual_hint = hint.split("~")
				let hint_to_push = {
					text: actual_hint[0],
					reveal_in_minutes_after_reveal: Number(actual_hint[1])
				}
				doc.hints.push(hint_to_push)
			})

			const add_result = await puzzles.insertOne(doc)
			let string_message = `The following puzzle has been added:
question: ${doc.question}
answer: ${doc.answer}
expires in minutes: ${doc.expire_in_minutes_after_reveal}
url of the image: ${doc.image_url}
				`
			doc.hints.forEach((hint) => {
				string_message += `
hint: ${hint.text} (revealed after ${hint.reveal_in_minutes_after_reveal} minutes)`
			})
			message.reply(string_message)
			console.log(`(${logHours()}) A puzzle has been added with the _id ${add_result.insertedId}`, doc)
		}
	}
}
