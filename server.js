const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
const iotHubClient = require('./IoThub/iot-hub.js');
const request = require('request');
const API_KEY = '9efa6376d87af8e87bf4b70b2da2fa29';
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

let sendAlert = () => {
    let postData = {
        service_id: "default_service",
        template_id: "template_yvYzWecb",
        user_id: 'user_c3lPUfhdnouJe31K7WAtF',
        template_params: {},
        lib_version: '2.2.4'
    };
    request({
        url: 'https://api.emailjs.com/api/v1.0/email/send',
        method: 'POST',
        json: true,
        body: postData,
    }, (err, res) => {
        console.log("Alert send");
    });
}

let fetchWeather = (iotIP) => {
    return new Promise((resolve, reject) => {
        request.get(`https://ipapi.co/${iotIP}/latlong/`, (_, __, body) => {
            body = body.split(',');
            let lat = body[0],
                lon = body[1];
            request.get(`http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`, (_, __, body) => {
                body = JSON.parse(body);
                body.ip = iotIP;
                body.lon = lon;
                body.lat = lat;
                resolve(body);
            });
        });
    });
}

let updateWeather = () => {
    fetchWeather('68.96.88.58').then((weather) => {
        let cp = {
            type: 'weather',
            humidity: weather.main.humidity,
            weather: weather.weather[0].main,
            ip: weather.ip,
            lon: weather.lon,
            lat: weather.lat
        }
        wss.broadcast(JSON.stringify(cp));
    });
}

const server = http.createServer(app);
const wss = new WebSocket.Server({
    server
});

// Broadcast to all.
wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            try {
                console.log('sending data ' + data);
                client.send(data);
            } catch (e) {
                console.error(e);
            }
        }
    });
};

app.get('/updateWeather', (req, res) => {
    updateWeather();
    res.end();
});

app.get('/updateIP', (req, res) => {
    console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress);
    res.end();
});

app.use(function (req, res /*, next*/ ) {
    res.redirect('/');
});

let soundQueue = [];
let iotHubReader = new iotHubClient('HostName=uciiot.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey=gKduZxe+XZ6s8kyFitsiOUgCLZUEuKEJXd7OzoXQjBA=', 'pj');
iotHubReader.startReadMessage(function (superobj, date) {
    date = Date.now();
    try {
        let date = Date.now();
        obj = {
            type: 'humidity',
            humidity: superobj.humidity
        };
        wss.broadcast(JSON.stringify(Object.assign(obj, {
            time: moment.utc(date).format('hh:mm:ss')
        })));
    } catch (err) {
        console.log(err);
    }

    try {
        let date = Date.now();
        obj = {
            type: 'sound',
            sound: superobj.sound
        };
        wss.broadcast(JSON.stringify(Object.assign(obj, {
            time: moment.utc(date).format('hh:mm:ss')
        })));
        soundQueue.push(superobj.sound);
        if (soundQueue.length > 100) {
            soundQueue.shift()
        }
        let cnt = 0;
        for (let i = 1; i < soundQueue.length; i++) {
            if (soundQueue[i - 1] == 1 && soundQueue[i] == 0) {
                cnt += 1
            }
        }
        if (cnt > 10) {
            sendAlert();
            soundQueue = []
        }
    } catch (err) {
        console.log(err);
    }
});

let port = normalizePort(process.env.PORT || '3000');
server.listen(port, function listening() {
    console.log('Listening on %d', server.address().port);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    let port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}