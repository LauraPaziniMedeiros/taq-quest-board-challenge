import { NotFoundError } from '@repo/core/error';
import { TagsDbDatasource } from '#data/tags/tags.db.datasource.js';
import type { Tag } from '#domain/model/tags.model.js';
import { TagErrors } from './tags.error.js';

export const DeleteTagUseCase = {
  async exec(id: string): Promise<Tag> {
    const deleted = await TagsDbDatasource.delete(id);

    if (!deleted) {
      throw new NotFoundError(TagErrors.NotFound);
    }

    return deleted;
  },
};
