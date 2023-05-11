import { ChatCompletionRequestMessage } from "openai";

export interface ChatCompletionRequestMessage_V2 extends ChatCompletionRequestMessage {
    tokenSize: number
}