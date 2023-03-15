import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { Configuration, OpenAIApi } from "openai";
import dotenv from 'dotenv';
dotenv.config();

var https = require('follow-redirects').https;
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "client-one" }),
    puppeteer: { headless: process.env.IS_HEADLESS?.toLowerCase()==="true" }
});

client.on('qr', (qr:any) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.initialize();

const configuration:any = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

client.on('message', async (message:any) => {
    // console.log('MESSAGE RECEIVED', message);
    let chat = await message.getChat();
    if (chat.isGroup) {
        console.log("THIS IS A GROUP");
    }
    else {
        if (message.isStatus) {

        }
        else {
            if (message.body.startsWith("#") || message.body.toLocaleLowerCase().startsWith("welcome")) {
                if (message.body.toLocaleLowerCase().indexOf("loadshedding") > 0 || message.body.toLocaleLowerCase().indexOf("bold") > 0) {
                    var x = await getLoadsheddingInfo();
                    message.reply(x)
                }
                else {
                    runCompletion(message.body.substring(1)).then(result => {
                        console.log("Response : " + result);
                        message.reply(result)
                    });
                }
            }
        }
    }
});

async function runCompletion(message:any) {
    const completion = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: message,
        max_tokens: 200,
    });
    return completion.data.choices[0].text;
}

async function getLoadsheddingInfo():Promise<string> {
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

        const req = https.request(options, function (res:any) {
            var chunks:any = [];

            res.on("data", function (chunk:any) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                var body = Buffer.concat(chunks);
                var bergbron = JSON.parse(body.toString())
                var busyWithDate = new Date();
                msg += `\r\n--- ${busyWithDate.toLocaleDateString()} ---`;
                bergbron.events.forEach((e:any) => {
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

            res.on("error", function (error:any) {
                reject(error);
            });
        });

        req.end();
    });
}