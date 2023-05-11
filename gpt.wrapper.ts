import { ChatCompletionRequestMessage, Configuration, CreateChatCompletionRequest, CreateCompletionRequest, CreateCompletionRequestPrompt, CreateCompletionResponse, OpenAIApi } from "openai";
import https from 'https';

import fs from 'fs';
import { ChatCompletionRequestMessage_V2 } from "./models/ChatCompletionRequestMessage_V2";
import { getTokens } from "./tokenizer";
export default class GptWrapper {
    private _openai: OpenAIApi | undefined;
    private _scene: string | undefined;
    private _stopCharacters: string | undefined;
    initialize(scene: string, stopCharacters?: string) {
        const configuration: any = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._openai = new OpenAIApi(configuration);
        this._stopCharacters = stopCharacters ?? "###";
        this._scene = scene + this._stopCharacters;

        fs.stat('./history', async (err, stats) => {
            if (err) {
                fs.mkdir("./history", () => { })
            } else {
                if (stats.isDirectory()) {
                    console.log('Directory exists!');
                } else {
                    console.log('Not a directory!');
                }
            }
        });
        fs.stat('./downloads', async (err, stats) => {
            if (err) {
                fs.mkdir("./downloads", () => { })
            } else {
                if (stats.isDirectory()) {
                    console.log('Directory exists!');
                } else {
                    console.log('Not a directory!');
                }
            }
        });
    }

    runCompletion = async (message: string, userId: string) => {
        if (!this._scene || !this._openai) {
            throw ("Please call initialize before you call this method");
        }
        // load this users history...
        var historyFileName = "./history/completion_" + userId + ".json";
        if (!fs.existsSync(historyFileName)) {
            fs.writeFileSync(historyFileName, `[\"${process.env.SCENE}\"]`);
        }
        var myFile = fs.readFileSync(historyFileName, "utf-8");
        //parse it to json
        var jsMessages = JSON.parse(myFile)
        jsMessages.push(message + this._stopCharacters);
        try {
            var req = {
                model: "curie:ft-personal-2023-03-20-21-12-12",
                prompt: jsMessages,
                temperature: 0,
                stop: [this._stopCharacters],
                stream: false,
                max_tokens: 256
            } as CreateCompletionRequest;

            const completion = await this._openai.createCompletion(req);
            if (!completion.data.choices) {
            }
            else {
                debugger;
                jsMessages.push(completion.data.choices[completion.data.choices.length - 1].text!);
            }
            //save the file
            fs.writeFileSync(historyFileName, JSON.stringify(jsMessages, null, 4))
            return jsMessages[jsMessages.length - 1].replace(this._stopCharacters, "");
        } catch (e) {
            throw (e)
        }
    }

    runChat = async (message: string, userId: string) => {
        if (!this._scene || !this._openai) {
            throw ("Please call initialize before you call this method");
        }

        var msg: ChatCompletionRequestMessage_V2 = { role: "user", content: message + "\r", tokenSize: getTokens(message) };
        // load this users history...
        var historyFileName = "./history/chat_" + userId + ".json";
        if (!fs.existsSync(historyFileName)) {
            fs.writeFileSync(historyFileName, `[{\"role\":\"system\",\"content\":\"${process.env.SCENE}\",\"tokenSize\":\"${getTokens(process.env.SCENE!)}\"}]`);
        }
        var myFile = fs.readFileSync(historyFileName, "utf-8");
        //parse it to json
        var jsMessages: Array<ChatCompletionRequestMessage_V2> = new Array<ChatCompletionRequestMessage_V2>();
        jsMessages = JSON.parse(myFile.trim())

        jsMessages.push(msg);
        var jsMessages2: Array<ChatCompletionRequestMessage> = [];
        jsMessages.forEach((element: ChatCompletionRequestMessage) => {
            jsMessages2.push({ 'content': element.content,'role': element.role })
        });

        try {
            var req = {
                model: "gpt-3.5-turbo-0301",
                messages: jsMessages2,
                stream: false,
            } as unknown as CreateChatCompletionRequest;

            const completion = await this._openai.createChatCompletion(req);
            if (!completion.data.choices[0].message) {
            }
            else {
                msg = { ...completion.data.choices[0].message, tokenSize: getTokens(completion.data.choices[0].message.content) };
            }
            jsMessages.push(msg)
            //save the file
            fs.writeFileSync(historyFileName, JSON.stringify(jsMessages, null, 4))
            return msg.content;
        } catch (e) {
            throw (e)
        }
    }

    /* This is a custom call that first goes to an azure site and do some processing
    on the server before returning */
    callNode = async (message: string, userId: string): Promise<string> => {
        var data = JSON.stringify({ message, userId, 'prompt': message });

        const options = {
            hostname: 'gptintegration.azurewebsites.net',
            port: 443,
            path: '/api/gpt/chatComplete',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.APIKEY
            }
        };

        return new Promise<string>(async (resolve, reject) => {
            var req = await https.request(options, (res) => {
                console.log(`statusCode: ${res.statusCode}`);
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(responseData).message.message.content);
                });
            });

            req.write(data);
            req.end();
        });
    }
}