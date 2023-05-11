import { Chat, Client, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import ffmpeg from "fluent-ffmpeg"
import qrcode from 'qrcode-terminal';
import GptWrapper from './gpt.wrapper';
import dotenv from 'dotenv';
import cron from 'node-cron';
import fs from 'fs';
import nodeHtmlToImage = require("node-html-to-image");

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
    scheduleTimers();
});

waClient.initialize();

waClient.on("media_uploaded", async (message: Message) => {
    debugger;
    var mediaFile = await message.downloadMedia();
    switch ((await mediaFile).mimetype) {
        case "a":

        default:
            fs.writeFileSync(`./downloads/${message.id}.xyz`, mediaFile.data);
    }
    //
});

waClient.on('message', async (message: Message) => {
    let chat: Chat = await message.getChat();
    if (chat.isGroup) {
        if (message.body.toLocaleLowerCase().indexOf("loadshedding for bergbron") > 0) {
            gpt.runCompletion(message.body.trim(), chat.id.user).then(async result => {
                var res: any = JSON.parse(result.trim())
                var x = await getLoadsheddingInfo(res.area, res.blockId, res.nextSchedule);
            });
        }
    }
    else {
        if (message.isStatus) {

        }
        else {
            console.log(JSON.stringify(message, null, 4));
            if (message.type == 'location') {
                var loc = message.location;
                // get the best Loadshedding schedule for this location.

                waClient.sendMessage(chat.id.user + "@c.us", ("HI from  " + JSON.stringify(loc)).toString())
            }
            else if (message.body.toLocaleLowerCase().indexOf("loadshedding") > 0) {
                gpt.runCompletion(message.body.trim(), chat.id.user).then(async (result: string) => {
                    var res: any = JSON.parse(result.trim())
                    var x = await getLoadsheddingInfo(res.area, res.blockId, res.nextSchedule);
                    waClient.sendMessage(chat.id.user + "@c.us", x)
                });
            }
            if (message.type == 'ptt') {
                var mediaFile = await message.downloadMedia();
                var fileName = `./downloads/ptt_${message.id.id}_${(new Date()).toDateString()}.ogg`;
                fs.writeFile(
                    fileName,
                    mediaFile.data,
                    "base64",
                    function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
                //convert it to mp3 now
                // debugger;
                // const input = fs.createReadStream(fileName);
                // const output = "./downloads/temp.mp3";
                               
                // var resultFormatter = new ffmpeg.FfmpegCommand(input)
                // .inputFormat("ogg")
                // .toFormat("mp3")
                // .save(output)
                waClient.sendMessage(chat.id.user + "@c.us", "I will get back to you about this later...");


            }
            else {
                var res = "";
                if (process.env.APIKEY === "") {
                    res = await gpt.runChat(message.body.trim(), chat.id.user)
                }
                else {
                    // This is a server call
                    res = await gpt.callNode(message.body.trim(), chat.id.user);
                }

                if (process.env.ALLOWED_RESPONSES!.split(",").indexOf(chat.id.user) >= 0) {
                    waClient.sendMessage(chat.id.user + "@c.us", res)
                }
            }
        }
    }
});


export async function getLoadsheddingInfo(area: string, blockId: string, nextSchedule: boolean): Promise<string> {
    return new Promise((resolve, reject) => {
        var msg = `
        <style>
            .container {
                display: flex;
                flex-direction: column;
                width: 400px;
            }
    
            .suburbHeader {
                border-bottom: 1em;
            }
    
            .dateHeader {
                margin-top: 1em;
                font-weight: 700;
            }
    
            .Stages {
                display: inline-flex;
                width: 1em;
                height: 1em;
                border-radius: 50%;
            }
    
            .Stage-1 {
                background-color: yellow;
            }
    
            .Stage-2 {
                background-color: orange;
            }
    
            .Stage-3 {
                background-color: lightcoral;
            }
    
            .Stage-4 {
                background-color: red;
            }
    
            .Stage-5 {
                background-color: darkred;
            }
    
            .Stage-6 {
                background-color: black;
            }
        </style>
        <div class='container'>`
        msg += `<div class='suburbHeader'>This is the schedule for ${area.toUpperCase()}(${blockId})</div>`;
        var options = {
            'method': 'GET',
            'hostname': 'developer.sepush.co.za',
            'path': `/business/2.0/area?id=jhbcitypower2-${blockId}-${area}`,
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
                console.log(bergbron);
                var busyWithDate = new Date();
                msg += `<div class='dateHeader'>--- ${busyWithDate.toLocaleDateString()} ---</div>`;
                bergbron?.events?.forEach((e: any) => {
                    var startTime = new Date(e.start);
                    var endTime = new Date(e.end);

                    if (startTime.getDate() !== busyWithDate.getDate()) {
                        msg += `<div class='dateHeader'>--- ${startTime.toLocaleDateString()} ---</div>`;
                        busyWithDate = startTime;
                    }
                    msg += `<div class='record'><span class='Stages ${e.note.replace(' ', '-')}'></span> <span class='timeslot'>${startTime.getHours().toString().padStart(2, "0") + ":" + startTime.getMinutes().toString().padStart(2, "0")} - ${endTime.getHours().toString().padStart(2, "0") + ":" + endTime.getMinutes().toString().padStart(2, "0")}</span> <span class='stage'>${e.note}</span></div>`
                });
                msg += '</div>'
                resolve(msg);
            });

            res.on("error", function (error: any) {
                reject(error);
            });
        });

        req.end();
    });
}

export default {};

function scheduleTimers() {
    console.log("SCHEDULING TIMERS");
    // Schedule a task to run at 6am every morning
    cron.schedule('23 5 * * *', async () => {
        var area = "Bergbron";
        var block = '15';
        var x = await getLoadsheddingInfo(area, block, false);
        await nodeHtmlToImage({
            output: `./images/${area}_${block}.png`,
            html: x
        })
        // await fs.writeFile(`./images/${area}_${block}.html`, x);

        const media = MessageMedia.fromFilePath(`./images/${area}_${block}.png`);
        process.env.ALLOWED_RESPONSES?.split(",").map(clientId => {
            waClient.sendMessage(clientId + "@c.us", media);
            // waClient.sendMessage(clientId + "@c.us",x)
        })
    });


    // cron.schedule('*/30 * * * * *', async () => {
    //     // Your function code here
    //     console.log('This function will execute every 30 seconds.');
    //     gpt.runCompletion("What is the loadshedding like for Bergbron", process.env.ADMIN_NUMBER!).then(async (result: string) => {
    //         var res: any = JSON.parse(result.trim())
    //         var x = await getLoadsheddingInfo(res.area, res.blockId, res.nextSchedule);
    //         process.env.ALLOWED_RESPONSES?.split(",").map(clientId => {
    //             waClient.sendMessage(clientId + "@c.us", x)
    //         })
    //     });

    // });
}
