import { buildCapy } from './capyShapes';
import { SKINS } from '../logic/hydration';

describe('capybara shapes', () => {
  it('is bigger and plumper when thriving than when frail', () => {
    const weak = buildCapy(SKINS[0], { vitality: 10, mood: 'parched' });
    const strong = buildCapy(SKINS[0], { vitality: 95, mood: 'happy' });
    expect(strong.scale).toBeGreaterThan(weak.scale);
    expect(strong.shapes.length).toBeGreaterThan(0);
  });
  it('draws gear only when worn', () => {
    const bare = buildCapy(SKINS[0], { vitality: 60, mood: 'happy' });
    const hat = buildCapy(SKINS[0], { vitality: 60, mood: 'happy', gear: ['sunhat'] });
    expect(hat.shapes.length).toBeGreaterThan(bare.shapes.length);
  });
});
