import { ConflictError } from '@repo/core/error';
import { DatabaseIdGenerator, dbClient, type TagEntity, tagTable, violatedUniqueConstraint } from '@repo/db';
import { asc, eq, inArray } from 'drizzle-orm';
import type { Tag, TagInput } from '#domain/model/tags.model.js';
import { TagErrors } from '#domain/tags/tags.error.js';
import { displayTagName, normalizeTagName } from '#domain/tags/tags.utils.js';

const EXTERNAL_ID_PREFIX = 't_';

export const TagsDbDatasource = {
  async findMany(): Promise<Tag[]> {
    const tags = await dbClient.select().from(tagTable).orderBy(asc(tagTable.normalizedName), asc(tagTable.name));
    return tags.map(toTag);
  },

  async findByIds(ids: string[]): Promise<TagEntity[]> {
    if (ids.length === 0) {
      return [];
    }

    return dbClient.select().from(tagTable).where(inArray(tagTable.id, ids));
  },

  async findOneById(id: string): Promise<Tag | null> {
    const [tag] = await dbClient.select().from(tagTable).where(eq(tagTable.id, id));
    return tag ? toTag(tag) : null;
  },

  async create(input: TagInput): Promise<Tag> {
    const name = displayTagName(input.name);
    const normalizedName = normalizeTagName(name);

    const [existing] = await dbClient.select().from(tagTable).where(eq(tagTable.normalizedName, normalizedName));
    if (existing) {
      throw new ConflictError(TagErrors.AlreadyExists);
    }

    try {
      const [tag] = await dbClient
        .insert(tagTable)
        .values({ id: DatabaseIdGenerator.generate(EXTERNAL_ID_PREFIX), name, normalizedName })
        .returning();

      return toTag(tag!);
    } catch (error) {
      if (violatedUniqueConstraint(error) === 'tag_normalized_name_unique') {
        throw new ConflictError(TagErrors.AlreadyExists);
      }

      throw error;
    }
  },

  async delete(id: string): Promise<Tag | null> {
    const [tag] = await dbClient.delete(tagTable).where(eq(tagTable.id, id)).returning();
    return tag ? toTag(tag) : null;
  },
};

function toTag(entity: TagEntity): Tag {
  return { id: entity.id, name: entity.name };
}
