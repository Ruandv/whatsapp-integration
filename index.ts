import { Chat, Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import GptWrapper from './gpt.wrapper';
import dotenv from 'dotenv';
dotenv.config();

var https = require('follow-redirects').https;

const gpt = new GptWrapper();

const waClient = new Client({
    authStrategy: new LocalAuth({ clientId: "client-one" }),
    puppeteer: { headless: process.env.IS_HEADLESS?.toLowerCase() === "true" }
});

waClient.on('qr', (qr: any) => {
    qrcode.generate(qr, { small: true });
});

waClient.on('ready', async () => {
    console.log('Client is ready!');
    gpt.initialize(process.env.SCENE!)
});

waClient.initialize();

waClient.on('message', async (message: any) => {
    let chat: Chat = await message.getChat();
    if (chat.isGroup) {
        console.log("THIS IS A GROUP");
        gpt.runCompletion(message.body.trim()).then(result => {
            console.log(`${chat.id.user} : ${message.body}`);
            console.log("Response : " + result);
            console.log("'\r\n------------------------------------------------------")
        });
    }
    else {
        if (message.isStatus) {

        }
        else {
            if (message.body.toLocaleLowerCase().indexOf("loadshedding") > 0) {
                var x = await getLoadsheddingInfo();
                //message.reply(x)
            }
            else {
                gpt.runCompletion(message.body.trim()).then(result => {
                    console.log(`${chat.id.user} : ${message.body}`);
                    console.log("Response : " + result);
                    console.log("'\r\n------------------------------------------------------")
                    if (process.env.ALLOWED_RESPONSES!.split(",").indexOf(chat.id.user) >=0 ) {
                        //message.reply(result);
                        waClient.sendMessage("27834545355@c.us", result!)
                    }
                });
            }
        }
    }
});


export async function getLoadsheddingInfo(): Promise<string> {
    return new Promise((resolve, reject) => {
        var msg = '𝙏𝙝𝙞𝙨 𝙞𝙨 𝙩𝙝𝙚 𝙨𝙘𝙝𝙚𝙙𝙪𝙡𝙚 𝙛𝙤𝙧 𝘽𝙚𝙧𝙜𝙗𝙧𝙤𝙣(15)\r\n';
        var options = {
            'method': 'GET',
            'hostname': 'developer.sepush.co.za',
            'path': '/business/2.0/area?id=jhbcitypower2-15-bergbron&test=future',
            'headers': {
                'token': process.env.ESP_API_KEY
            },
            'maxRedirects': 20
        };

        const req = https.request(options, function (res: any) {
            var chunks: any = [];

            res.on("data", function (chunk: any) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                var bergbron = JSON.parse(body.toString())
                var busyWithDate = new Date();
                msg += `\r\n--- ${busyWithDate.toLocaleDateString()} ---`;
                bergbron.events.forEach((e: any) => {
                    var startTime = new Date(e.start);
                    var endTime = new Date(e.end);

                    if (startTime.getDate() !== busyWithDate.getDate()) {
                        msg += `\r\n--- ${startTime.toLocaleDateString()} ---`;
                        busyWithDate = startTime;
                    }
                    msg += '\r\n' + startTime.getHours().toString().padStart(2, "0") + ":" + startTime.getMinutes().toString().padStart(2, "0") + " - " + endTime.getHours().toString().padStart(2, "0") + ":" + endTime.getMinutes().toString().padStart(2, "0") + " - " + e.note
                });
                resolve(msg);
            });

            res.on("error", function (error: any) {
                reject(error);
            });
        });

        req.end();
    });
}

export default{};