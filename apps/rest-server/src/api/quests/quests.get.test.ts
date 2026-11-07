import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import type { Paginated } from '@repo/core/pagination';
import { clearDatabase, QuestTagsSeed, QuestsSeed, TagsSeed } from '@repo/db/test';
import { API_PREFIX } from '#api/rest.config.js';
import type { Quest } from '#domain/model/quests.model.js';
import { checkEmptyList, checkPage } from '#test/checkers/checker.test.js';
import { checkQuests } from '#test/checkers/quests.checker.test.js';
import { RequestMaker } from '#test/request-maker.test.js';

describe('GET /quests', () => {
  const endpoint = `${API_PREFIX}/quests`;

  let requestMaker: RequestMaker<Paginated<Quest>>;

  beforeEach(() => {
    requestMaker = new RequestMaker();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  it('should return an empty list when there are no quests', async () => {
    const response = await requestMaker.get({ endpoint });

    checkEmptyList(response.data);
  });

  it('should list quests ordered by newest first', async () => {
    const older = await QuestsSeed.insert({ createdAt: new Date('2026-01-01T00:00:00Z') });
    const newer = await QuestsSeed.insert({ createdAt: new Date('2026-01-02T00:00:00Z') });

    const response = await requestMaker.get({ endpoint });

    expect(response.data.count).toBe(2);
    checkQuests(response.data.nodes, [newer, older]);
  });

  it('should filter quests by status', async () => {
    const openQuest = await QuestsSeed.insert({ status: 'open' });
    await QuestsSeed.insert({ status: 'resolved' });

    const response = await requestMaker.get({ endpoint, query: { status: 'open' } });

    checkQuests(response.data.nodes, [openQuest]);
  });

  it('should paginate results using limit', async () => {
    await QuestsSeed.insertMany([{}, {}, {}]);

    const response = await requestMaker.get({ endpoint, query: { limit: 2 } });

    expect(response.data.nodes).toHaveLength(2);
    expect(response.data.count).toBe(3);
    checkPage(response.data.pageInfo, { limit: 2, hasNextPage: true });
  });

  it('should include each quest tags', async () => {
    const questDb = await QuestsSeed.insert();
    const tag = await TagsSeed.insert({ name: 'Urgente', normalizedName: 'urgente' });
    await QuestTagsSeed.attach(questDb, [tag]);

    const response = await requestMaker.get({ endpoint });

    checkQuests(response.data.nodes, [questDb], [[tag]]);
    expect(response.data.nodes[0]!.tags).toEqual([{ id: tag.id, name: 'Urgente' }]);
  });
});
