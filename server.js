require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');
// Basic Configuration
const port = process.env.PORT || 3000;


app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
	res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
	res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
	console.log(`Listening on port ${port}`);
});

const mongoString = `mongodb+srv://${process.env.DB_USERNAME}:${
	process.env.DB_PASSWORD
}@backendlessons.uoknb.mongodb.net/db1?retryWrites=true&w=majority`;

mongoose.connect(
	mongoString,
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

mongoose.connection.on('error', function(error) {
	console.log(error);
});
mongoose.connection.on('open', function() {
	console.log('Connected to MongoDB database.');
});
/* Create URL Model */
let urlSchema = new mongoose.Schema({
	original: { type: String, required: true },
	short: Number
});

let Url = mongoose.model('Url', urlSchema);

/* Getting the URL input parameter */
let bodyParser = require('body-parser');

let responseObject = {};

app.post(
	'/api/shorturl/new',
	bodyParser.urlencoded({ extended: false }),
	(request, response) => {
		let inputUrl = request.body['url'];

		let urlRegex = new RegExp(
			/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi
		);

		if (!inputUrl.match(urlRegex)) {
			response.json({ error: 'Invalid URL' });
			return;
		}
		responseObject['original_url'] = inputUrl;

		let inputShort = 1;
		Url.findOne({})
			.sort({ short: 'desc' })
			.exec((error, result) => {
				if (!error && result != undefined) {
					
					inputShort = result.short + 1;
				}
				if (!error) {
					Url.findOneAndUpdate(
						{ original: inputUrl },
						{ original: inputUrl, short: inputShort },
						{ new: true, upsert: true },
						(error, savedUrl) => {
							if (!error) {
								responseObject['short_url'] = savedUrl.short;
								response.json(responseObject);
							}
						}
					);
				}
			});
	}
);
app.get('/api/shorturl/:input', (request, response) => {
	let input = request.params.input;
	Url.findOne({ short: input }, (error, result) => {
		if (!error && result != undefined) {
			response.redirect(result.original);
		} else {
			response.json('URL Does Not Exist');
		}
	});
});
