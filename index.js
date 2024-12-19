import { SerialPort } from "serialport";
import inquirer from "inquirer";
import { SerialPortStream } from "@serialport/stream";
import { MockBinding } from "@serialport/binding-mock";
import { ReadlineParser } from "@serialport/parser-readline";
import mysql from "mysql";
import express from "express";
import 'dotenv/config'

MockBinding.createPort('/dev/ROBOT', { echo: true, record: true })
// const port = new SerialPortStream({ binding: MockBinding, path: '/dev/ROBOT', baudRate: 14400 })

function checkSensorParams({ Humidity = null, Temperature = null, Ec = null, Ph = null, Nitrogen = null, Phosporus = null, Kalium = null }) {
    if (!Humidity) {
        throw new Error("Humidity is missing from sensor");
    }
    if (!Temperature) {
        throw new Error("Temperature is missing from sensor");
    }
    if (!Ec) {
        throw new Error("Ec is missing from sensor");
    }
    if (!Ph) {
        throw new Error("Ph is missing from sensor");
    }
    if (!Nitrogen) {
        throw new Error("Nitrogen is missing from sensor");
    }
    if (!Phosporus) {
        throw new Error("Phosporus is missing from sensor");
    }
    if (!Kalium) {
        throw new Error("Kalium is missing from sensor");
    }

    return true
}


const createCurrentDate = () => {
    let date_ob = new Date();

    // current date
    // adjust 0 before single digit date
    let date = ("0" + date_ob.getDate()).slice(-2);

    // current month
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

    // current year
    let year = date_ob.getFullYear();

    // current hours
    let hours = ("0" + date_ob.getHours()).slice(-2);

    // current minutes
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);

    // current seconds
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);

    // prints date & time in YYYY-MM-DD HH:MM:SS format
    const myDate =
        year +
        "-" +
        month +
        "-" +
        date +
        " " +
        hours +
        ":" +
        minutes +
        ":" +
        seconds;

    return myDate
}

// const loraPort = new SerialPort({
//     binding: MockBinding,
//     path: '/dev/ROBOT',
//     baudRate: 115200
// })

// // const parser = loraPort.pipe(new ReadlineParser({ delimiter: '\n' }))
// // parser.on('data', console.log)
// loraPort.on('data', function (data) {
//     try {
//         let decodeData = new TextDecoder().decode(data)
//         const { lahanID, sensor } = JSON.parse(decodeData)

//         checkSensorParams(sensor)

//         const dataQuery = {
//             garden_id: lahanID,
//             samples: JSON.stringify(sensor),
//             created_at: createCurrentDate()
//         };

//         connection.query(
//             "INSERT INTO fix_stations SET ?",
//             dataQuery,
//             function (err, result) {
//                 if (err) throw err;
//                 console.log("Data inserted successfully.");
//                 // console.log('Result:', result);
//             }
//         );
//     } catch (error) {
//         console.error(error)
//     }
// })

// loraPort.on('open', () => {
//     loraPort.port.emitData(JSON.stringify({ "type": "sensor", "lahanID": 1, "sensor": { "Humidity": 13, "Temperature": 31.4, "Ec": 50, "Ph": 7, "Nitrogen": 3, "Phosporus": 5, "Kalium": 10 } }))
// })

// setInterval(() => {
//     loraPort.port.emitData(JSON.stringify({ "type": "sensor", "lahanID": 1, "sensor": { "Humidity": Math.random(), "Temperature": 31.4, "Ec": 50, "Ph": 7, "Nitrogen": 3, "Phosporus": 5, "Kalium": 10 } }))
// }, 5000);

const app = express();

// Create a connection to the MySQL database
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const portRegex = /Silicon_Labs_CP2102_USB_to_UART_Bridge/g;

SerialPort.list().then(function (ports) {
    // Open a serial port for each available port
    console.log(ports);
    const found = ports.find(port => port.pnpId?.match(portRegex) != null)
    console.log(found);

    if (!found) {
        console.log("Ports not found");

        return false
    }

    const port = new SerialPort({
        path: found.path,
        baudRate: 115200,
    });

    // port.open((err) => {
    //   let errMessage = null;
    //   if (err) {
    //     return console.log("Error opening port: ", err.message);
    //   }

    //   console.log("Port open");
    // });

    port.on('data', function (data) {
        try {
            let decodeData = new TextDecoder().decode(data)
            const { lahanID, sensor } = JSON.parse(decodeData)

            checkSensorParams(sensor)

            const dataQuery = {
                garden_id: lahanID,
                samples: JSON.stringify(sensor)
            };

            connection.query(
                "INSERT INTO fix_stations SET ?",
                dataQuery,
                function (err, result) {
                    if (err) throw err;
                    console.log("Data inserted successfully.");
                    // console.log('Result:', result);
                }
            );
        } catch (error) {
            console.error(error)
        }
    })
});

// Connect to the database
connection.connect(function (err) {
    if (err) throw err;
    console.log("Connected to MySQL database.");
});

//START LISTENING
app.listen(7979, function () {
    console.log("Server started on port 7979");
});