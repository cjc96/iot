$(document).ready(function () {
    emailjs.init("user_c3lPUfhdnouJe31K7WAtF");
    var timeData = [],
        timeData2 = [],
        soundData = [],
        humidityData = [];
    var humiditydata = {
            labels: timeData,
            datasets: [{
                fill: false,
                label: 'Humidity',
                yAxisID: 'Humidity',
                borderColor: "rgba(24, 120, 240, 1)",
                pointBoarderColor: "rgba(24, 120, 240, 1)",
                backgroundColor: "rgba(24, 120, 240, 0.4)",
                pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
                pointHoverBorderColor: "rgba(24, 120, 240, 1)",
                data: humidityData
            }]
        },
        sounddata = {
            labels: timeData2,
            datasets: [{
                fill: false,
                label: 'Sound',
                yAxisID: 'Sound',
                borderColor: "rgba(24, 120, 240, 1)",
                pointBoarderColor: "rgba(24, 120, 240, 1)",
                backgroundColor: "rgba(24, 120, 240, 0.4)",
                pointHoverBackgroundColor: "rgba(24, 120, 240, 1)",
                pointHoverBorderColor: "rgba(24, 120, 240, 1)",
                data: soundData
            }]
        };
    var HumiditybasicOption = {
            title: {
                display: true,
                text: 'Humidity Real-time Data',
                fontSize: 36
            },
            scales: {
                yAxes: [{
                    id: 'Humidity',
                    type: 'linear',
                    scaleLabel: {
                        labelString: 'Humidity(%)',
                        display: true
                    },
                    position: 'left'
                }]
            }
        },
        SoundbasicOption = {
            title: {
                display: true,
                text: 'Sound Real-time Data',
                fontSize: 36
            },
            scales: {
                yAxes: [{
                    id: 'Sound',
                    type: 'linear',
                    scaleLabel: {
                        labelString: 'Sound(db)',
                        display: true
                    },
                    position: 'left'
                }]
            }
        }

    //Get the context of the canvas element we want to select
    var ctx = document.getElementById("myChart").getContext("2d");
    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: humiditydata,
        options: HumiditybasicOption
    });
    var ctx2 = document.getElementById('myChart2').getContext('2d');
    var myLineChart2 = new Chart(ctx2, {
        type: 'line',
        data: sounddata,
        options: SoundbasicOption
    });

    var sendAlert = () => {
        var template_params = {}
        var service_id = "default_service";
        var template_id = "template_yvYzWecb";
        emailjs.send(service_id, template_id, template_params);
    }

    var ws = new WebSocket('ws://' + location.host);
    ws.onopen = function () {
        console.log('Successfully connect WebSocket');
    }
    ws.onmessage = function (message) {
        console.log('receive message' + message.data);
        try {
            var obj = JSON.parse(message.data);
            if (obj.type == 'weather') {
                $('#weatherVal').html(obj.weather);
                $('#ipVal').html(obj.ip);
                $('#humidityVal').html(obj.humidity);
                $('#longitudeVal').html(obj.lon);
                $('#latitudeVal').html(obj.lat);
            } else if (obj.type == "alert") {
                sendAlert();
            } else if (obj.type == 'humidity') {
                timeData.push(obj.time);
                const maxLen = 50;
                var len = timeData.length;
                if (len > maxLen) {
                    timeData.shift();
                }
                humidityData.push(obj.humidity);
                if (humidityData.length > maxLen) {
                    humidityData.shift();
                }
                myLineChart.update();
            } else if (obj.type == 'sound') {
                timeData2.push(obj.time);
                const maxLen = 50;
                var len = timeData2.length;
                if (len > maxLen) {
                    timeData2.shift();
                }
                soundData.push(obj.sound);
                if (soundData.length > maxLen) {
                    soundData.shift();
                }
                myLineChart2.update();
            }
        } catch (err) {
            console.error(err);
        }
    }

    $('button').click(() => {
        $.get('/updateWeather');
    });
});