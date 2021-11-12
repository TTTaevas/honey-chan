require('dotenv').config()
const fs = require('fs')

const {Client, Intents} = require('discord.js');
const discord_client = new Client({intents: ["GUILDS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"]});
const token = process.env.DISCORD_BOT_TOKEN

const mongodb = require("mongodb").MongoClient
var mongo_client
var db

mongodb.connect(process.env.DATABASE_CONNECTION_STRING, {useUnifiedTopology: true}, function (e, client) {
	if (e) {console.error(e)}
	mongo_client = client
	db = mongo_client.db()
})

for (const file of fs.readdirSync('./events').filter(file => file.endsWith('.js'))) {
	const event = require(`./events/${file}`)
	event.once ? discord_client.once(event.name, (...args) => event.execute(discord_client, db, ...args)) : discord_client.on(event.name, (...args) => event.execute(discord_client, db, ...args))
}

discord_client.login(token)
