const logHours = require('../functions/log_hours.js')

module.exports = async function revealPuzzle(channel, db, puzzle_id) {
	const puzzles = db.collection("testCollection0")
	const current_puzzle = await puzzles.findOne({id: puzzle_id})
	if (current_puzzle == null) {
		started = false
		console.log("Looks like all the puzzles have been solved! Shutting down the bot in a few seconds...")
		setTimeout(function() {process.exit(1)}, 3000)
		return console.log("...")
	}
	const hints = current_puzzle.hints

	console.log(`\n(${logHours()}) Revealing puzzle ${puzzle_id + 1}!\n`)

	let exp_date = new Date()
	exp_date.setMinutes(exp_date.getMinutes() + current_puzzle.expire_in_minutes_after_reveal)
	let epoch_time = `<t:${String(exp_date.getTime()).substr(0, 10)}:f> | <t:${String(exp_date.getTime()).substr(0, 10)}:R>`
	let message_time = timePhrasing(current_puzzle.expire_in_minutes_after_reveal)

	let question_string = `${current_puzzle.question}\nyou have ${message_time} (${epoch_time})`
	if (current_puzzle.image_url) {question_string += `\n\n${current_puzzle.image_url}`}
	channel.send(question_string)

	let ms = current_puzzle.expire_in_minutes_after_reveal * 60000
	let reminder_times = [ms-(ms/2), ms-(ms/5)]

	reminder_times.forEach((time) => {
		let phrased_time = timePhrasing((ms / 60000) - (time / 60000))
		console.log(`(${logHours()}) A reminder has been set to be sent once ${phrased_time} are left`)
		setTimeout(async function() {
			let updated_puzzle = await puzzles.findOne({id: puzzle_id})
			if (!updated_puzzle.solver) {
				channel.send(`${phrased_time} left`)
				console.log(`(${logHours()}) A reminder has been sent for puzzle ${puzzle_id + 1} as the time remaining is ${phrased_time}`)
			} else {
				console.log(`\n(${logHours()}) No reminder has been sent for puzzle ${puzzle_id + 1}, as it has already been solved on ${updated_puzzle.solved_date}\n`)
			}
		}, time)
	})

	hints.forEach((hint) => {
		let hint_time_ms = hint.reveal_in_minutes_after_reveal * 60000
		let phrased_hint_time = timePhrasing((ms / 60000) - hint.reveal_in_minutes_after_reveal)
		console.log(`(${logHours()}) A hint has been set to be sent once ${phrased_hint_time} are left`)
		setTimeout(async function() {
			let updated_puzzle = await puzzles.findOne({id: puzzle_id})
			if (!updated_puzzle.solver) {
				channel.send(hint.text)
				console.log(`(${logHours()}) ${phrased_hint_time} left, a hint has been sent`)
			} else {
				console.log(`\n(${logHours()}) No hint has been sent for puzzle ${puzzle_id + 1}, as it has already been solved on ${updated_puzzle.solved_date}\n`)
			}
		}, hint_time_ms)
	})

	console.log(`(${logHours()}) Thinking time will begin in ${timePhrasing(ms / 60000)}`)
	setTimeout(async function() {
		let updated_puzzle = await puzzles.findOne({id: puzzle_id})
		if (!updated_puzzle.solver) {
			thinking_time = true
			channel.send(`puzzle has not been completed within the timer, you'll be able to give answers once again in 1 hour`)
			console.log(`\n(${logHours()}) Puzzle ${puzzle_id + 1}'s timer has expired, entering "thinking time" for 1 hour\n`)

			setTimeout(async function() {
				thinking_time = false
				channel.send(`you can give answers again, you need to solve the puzzle to proceed`)
				console.log(`\n(${logHours()}) Puzzle ${puzzle_id + 1}'s thinking time has expired, exiting "thinking time"`)
			}, 3600000)
		} else {
			console.log(`(${logHours()}) Puzzle ${puzzle_id + 1} will not enter thinking time as it has already been solved\n`)
		}
	}, ms)

	console.log(`\n(${logHours()}) Puzzle ${puzzle_id + 1} has been revealed, timers have been set\n`)
}

function timePhrasing(minutes) {
	minutes = Number(minutes)
	minutes = Number(minutes.toFixed(1))
	if (minutes < 60) {return `${minutes} minute${minutes >= 2 ? "s" : ""}`}
	if (!(minutes % 60)) {return `${minutes / 60} hours`}

	let new_hours = 0
	let new_minutes = minutes

	while (new_minutes >= 60) {
		new_hours += 1
		new_minutes -= 60
	}

	return `${new_hours} hour${new_hours >= 2 ? "s" : ""} and ${new_minutes} minute${new_minutes >= 2 ? "s" : ""}`
}
