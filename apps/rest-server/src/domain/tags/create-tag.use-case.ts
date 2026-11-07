import { TagsDbDatasource } from '#data/tags/tags.db.datasource.js';
import type { Tag, TagInput } from '#domain/model/tags.model.js';

export const CreateTagUseCase = {
  async exec(input: TagInput): Promise<Tag> {
    return TagsDbDatasource.create(input);
  },
};
