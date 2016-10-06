const Discordie = require('discordie');
const client = new Discordie();

const config = require('./config');
const https = require('http');
const parseXML = require('xml2js').parseString;
const request = require('request');

var lastSearch;

function searchAPI(searchString, channel, callback) {
    var result = "";

    const requestData = {
        url: 'http://www.myanimelist.net/api/anime/search.xml?q=' + searchString,
        headers: {
            Authorization: 'Basic ' + new Buffer(config.mal_username + ':' + config.mal_password).toString('base64')
        }
    }

    request(requestData, function(err, response, body) {

        if (err) throw err;

        var data;

        parseXML(body, function(err, result) {
            if (err) throw err;

            data = result;
        });

        lastSearch = data ? data.anime : "No results found";

        if (data) {
            for (var i = 0; i < data.anime.entry.length; i++) {
                result += (i + 1) + ": " + data.anime.entry[i].title + "\n";
            }
        }
        
        callback(result === "" ? result : "No results found!", channel);
    });
}

function sendMessage(content, channel) {
    channel.sendMessage(content);
}

client.connect({ token: config.bot_token });

client.Dispatcher.on("MESSAGE_CREATE", function(event) {
    var message = event.message;

    if (message.content.substring(0,6) === "!anime") {
        searchAPI(message.content.substring(7), message.channel, sendMessage);
    }

    if (!isNaN(message.content)) {
        if (lastSearch != "No results found") {
            if (+message.content - 1 >= 0 && +message.content - 1 < lastSearch.entry.length) {
                var animeObject = lastSearch.entry[+message.content - 1];
                var messageString = "**Title: " + animeObject.title + "**\n\n**Description**: " + animeObject.synopsis.toString().replace(/<br \/>/g, "") + "\n\n**URL**: http://myanimelist.net/anime/" + animeObject.id;
                sendMessage(messageString, message.channel);
                lastSearch = null;
            }
        }
    }
});
