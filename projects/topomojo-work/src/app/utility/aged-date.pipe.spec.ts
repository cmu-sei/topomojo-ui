import { AgedDatePipe } from './aged-date.pipe';

describe('AgedDatePipe', () => {
  it('create an instance', () => {
    const pipe = new AgedDatePipe();
    expect(pipe).toBeTruthy();
  });
});
