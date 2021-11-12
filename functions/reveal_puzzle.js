const logHours = require('../functions/log_hours.js')

module.exports = async function revealPuzzle(channel, db, puzzle_id) {
	const puzzles = db.collection("testCollection0")
	const current_puzzle = await puzzles.findOne({id: puzzle_id})
	const hints = current_puzzle.hints

	console.log(`\n(${logHours()}) Revealing puzzle ${puzzle_id + 1}!\n`)

	let exp_date = new Date()
	exp_date.setMinutes(exp_date.getMinutes() + current_puzzle.expire_in_minutes_after_reveal)
	let epoch_time = `<t:${String(exp_date.getTime()).substr(0, 10)}:R>`
	let message_time = timePhrasing(current_puzzle.expire_in_minutes_after_reveal)
	channel.send(`${current_puzzle.question}\nyou have ${message_time} (${epoch_time})\n\n${current_puzzle.image_url}`)

	let ms = current_puzzle.expire_in_minutes_after_reveal * 60000
	let reminder_times = [ms-(ms/2), ms-(ms/5)]

	reminder_times.forEach((time) => {
		let phrased_time = timePhrasing(time / 60000)
		console.log(`(${logHours()}) A reminder has been set to be sent in ${phrased_time}`)
		setTimeout(async function() {
			let updated_puzzle = await puzzles.findOne({id: puzzle_id})
			if (!updated_puzzle.solver) {
				channel.send(`${phrased_time} left`)
				console.log(`(${logHours()}) A reminder has been sent, ${phrased_time} left to solve puzzle ${puzzle_id + 1}`)
			} else {
				console.log(`\n(${logHours()}) No reminder has been sent for puzzle ${puzzle_id + 1}, as it has already been solved on ${updated_puzzle.solved_date}\n`)
			}
		}, time)
	})

	hints.forEach((hint) => {
		let hint_time_ms = hint.reveal_in_minutes_after_reveal * 60000
		let phrased_hint_time = timePhrasing(hint.reveal_in_minutes_after_reveal)
		console.log(`(${logHours()}) A hint has been set to be sent in ${phrased_hint_time}`)
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

	setTimeout(async function() {
		if (!updated_puzzle.solver) {
			console.log(`\n(${logHours()}) Puzzle ${puzzle_id + 1} has expired\n`)
		}
	}, ms)

	console.log(`\n(${logHours()}) Puzzle ${puzzle_id + 1} has been revealed, timers have been set\n`)
}

function timePhrasing(minutes) {
	minutes = Number(minutes.toFixed(1))
	if (minutes < 60) {return `${minutes} minute${minutes >= 2 ? "s" : ""}`}
	if (minutes % 60) {return `${minutes / 60} hours`}

	let new_hours = 0
	let new_minutes = minutes

	while (new_minutes >= 60) {
		new_hours += 1
		new_minutes -= 60
	}

	return `${new_hours} hour${new_hours >= 2 ? "s" : ""} and ${new_minutes} minute${new_minutes >= 2 ? "s" : ""}`
}
