import Gpt from '../gpt.wrapper';
import dotenv from 'dotenv';
import GptWrapper from '../gpt.wrapper';
dotenv.config();

describe('gpt success', () => {
  var c:GptWrapper = new Gpt();;
  beforeEach(() => {
    c.initialize("");
  })
  
  it('returns the correct value', async () => {
    await Promise.all(["If i tell you my name will you tell me yours?",
      "Hello my naam is ruan",
      "are you always responding in afrikaans.",
      "can you login on your gmail account"].map(
        async (query) => {
          var res = await c.runCompletion(query)
          expect(res).toBeTruthy();
        })).then(x => {

        })
  });

  it('will fail on the call', async () => {
    var myC = (c as any);
    myC._openai.createCompletion = jest.fn(() => Promise.reject("NOT WORKING"));

    await Promise.all(["This will fail"].map(
      async (query) => {
        var res = await myC.runCompletion(query)
        expect(res).toBeTruthy();
      }))
      .then(x => { })
      .catch(e => {
        expect(e).toBe("NOT WORKING")
      })
  })
});

describe('gpt Fail', () => {
  var c = new Gpt();
  it('returns a message that says you have to initialize', async () => {
    await Promise.all([
      "can you login on your gmail account"].map(
        async (query) => {
          expect(await c.runCompletion(query)).toBeFalsy()
        })).then(x => {

        })
      .catch(err => {
        expect(err).toEqual("Please call initialize before you call this method");
      })
  });


});