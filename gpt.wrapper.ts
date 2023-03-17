import { ChatCompletionRequestMessage, Configuration, CreateCompletionRequest, CreateCompletionResponse, OpenAIApi } from "openai";
export default class GptWrapper {
    private _openai: OpenAIApi | undefined;
    private _messages: string = "";

    initialize(scene: string) {
        const configuration: any = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });

        this._openai = new OpenAIApi(configuration);

        this._messages = scene + "[eol]";
    }


    runCompletion = async (message: string) => {
        if (!this._messages || !this._openai) {
            throw ("Please call initialize before you call this method");
        }

        this._messages += message + "[eol]";
        try {
            var req = {
                model: "text-davinci-003",
                prompt: this._messages,
                temperature: 0.9,
                stop: ["[eol]"],
                stream:false,
                best_of:10,
                max_tokens: 10,
                echo:false,
            } as CreateCompletionRequest;

            const completion = await this._openai.createCompletion(req);
            this._messages += completion.data.choices[0].text! + "[eol]"
            return completion.data.choices[0].text;
        } catch (e) {
            throw(e)
        }
    }
}