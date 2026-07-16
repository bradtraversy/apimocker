import { generatePosts } from '../../src/scripts/seed';

describe('Post seed data', () => {
  it('generates 100 unique titles with stable title_like match counts', () => {
    const posts = Array.from({ length: 10 }, (_, userIndex) =>
      generatePosts(userIndex + 1, userIndex)
    ).flat();
    const titles = posts.map(post => post.title);
    const subtitles = titles.map(title => title.split(': ')[1]);
    const countMatches = (term: string) =>
      titles.filter(title => title.toLowerCase().includes(term.toLowerCase()))
        .length;

    expect(posts).toHaveLength(100);
    expect(new Set(titles).size).toBe(100);
    expect(
      subtitles.every(
        subtitle =>
          subtitle !== undefined &&
          !/(web|cloud|security|design)/i.test(subtitle)
      )
    ).toBe(true);
    expect(countMatches('Web')).toBe(20);
    expect(countMatches('Cloud')).toBe(10);
    expect(countMatches('Security')).toBe(10);
    expect(countMatches('Design')).toBe(20);
  });
});
