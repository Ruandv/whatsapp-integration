import Gpt from '../gpt.wrapper';
import dotenv from 'dotenv';
import index from '../index';
dotenv.config();

describe('gpt success', () => {
    beforeEach(() => {
    })

    it('returns the correct value', async () => {
        expect(index).toBeTruthy();
    });
});