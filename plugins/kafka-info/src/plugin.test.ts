import { kafkaInfoPlugin } from './plugin';

describe('kafka-info', () => {
  it('should export plugin', () => {
    expect(kafkaInfoPlugin).toBeDefined();
  });
});
