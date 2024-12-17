import { SerialPort } from "serialport";
import inquirer from "inquirer";

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

    loraPort.on('data', function (data) {
        try {
            console.log(data);
        } catch (error) {
            console.error(error)
        }
    })
}

pickSerialPort()