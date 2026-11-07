import { TagsDbDatasource } from '#data/tags/tags.db.datasource.js';
import type { Tag } from '#domain/model/tags.model.js';

export const ListTagsUseCase = {
  async exec(): Promise<Tag[]> {
    return TagsDbDatasource.findMany();
  },
};
