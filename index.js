import { SerialPort } from "serialport";
import inquirer from "inquirer";
import { SerialPortStream } from "@serialport/stream";
import { MockBinding } from "@serialport/binding-mock";

MockBinding.createPort('/dev/ROBOT', { echo: true, record: true })

let loraPort
let portsPath = []

const questions = [
    {
        type: 'input',
        name: 'path',
        message: "Pilih port diatas?",
    },
];

const listSerialPorts = async () => {
    const ports = await SerialPort.list()
    return ports.map((port, i) => {
        console.log(`${i}: ${port.path}`);
        return port.path
    })
}

const pickSerialPort = async () => {
    portsPath = await listSerialPorts()
    const answers = await inquirer.prompt(questions)

    const port = portsPath.find((p, i) => answers.path == i)

    if (!port) {
        console.log('Port tidak ditemukan');
        return false
    }

    loraPort = new SerialPort({
        path: port,
        baudRate: 115200
    })

    console.log(`Tersambung dengan port ${port}`);

    // loraPort = new SerialPortStream({
    //     binding: MockBinding,
    //     path: '/dev/ROBOT',
    //     baudRate: 115200
    // })

    // loraPort.on('open', () => {
    //     loraPort.port.emitData(JSON.stringify({"type":"sensor","lahanID":1,"sensor":{"Humidity":13,"Temperature":31.4,"Ec":50,"Ph":7,"Nitrogen":3,"Phosporus":5,"Kalium":10}}))
    // })

    loraPort.on('data', function (data) {
        try {
            let decodeData = new TextDecoder().decode(data)
            console.log(decodeData);
        } catch (error) {
            console.error(error)
        }
    })
}

pickSerialPort()