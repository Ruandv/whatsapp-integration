import Gpt from '../gpt.wrapper';
import dotenv from 'dotenv';
dotenv.config();

describe('myFunction', () => {
  it('returns the correct value', async() => {
    var c = new Gpt();
  await Promise.all( ["If i tell you my name will you tell me yours?",
   "Hello my naam is ruan", 
   "are you always responding in afrikaans.",
    "can you login on your gmail account"].map(
      async (query) => {
      var res = await c.runCompletion(query)
        console.log(res);
        //expect(res).toBeTruthy();
    })).then(x=>{

    })
  });
});