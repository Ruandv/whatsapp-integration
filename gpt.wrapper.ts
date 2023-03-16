import { Configuration, CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from "openai";
export default class GptWrapper {
    private _openai: OpenAIApi;
    constructor() {

        const configuration: any = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._openai = new OpenAIApi(configuration);

    }

    runCompletion = async (message: string, context?: string) => {
        var req = {
            model: "text-davinci-003",
            prompt: context + "\r\n" + message,
            max_tokens: 500,
            stop: ["\n"],
            n: 1
        } as CreateCompletionRequest;

        const completion = await this._openai.createCompletion(req);
        completion.data.choices.forEach(r => {
            console.log(JSON.stringify(r));
        })
        return completion.data.choices[0].text;
    }
}