import { Elysia, status } from 'elysia';
import { ErrorsResponse } from '#api/common/common.payload.js';
import { CreateTagUseCase } from '#domain/tags/create-tag.use-case.js';
import { DeleteTagUseCase } from '#domain/tags/delete-tag.use-case.js';
import { ListTagsUseCase } from '#domain/tags/list-tags.use-case.js';
import { TagParams, TagRequest, TagResponse, TagsResponse } from './tags.payload.js';

export const TagsController = new Elysia({ name: 'TagsController', prefix: '/tags', tags: ['Tags'] })
  .model({ TagResponse, TagsResponse, ErrorsResponse })

  .get('', () => ListTagsUseCase.exec(), {
    detail: { description: 'List every tag in the catalog.' },
    response: { 200: 'TagsResponse' },
  })

  .post('', async ({ body }) => status(201, await CreateTagUseCase.exec(body)), {
    detail: { description: 'Create a tag in the catalog.' },
    body: TagRequest,
    response: { 201: 'TagResponse', 409: 'ErrorsResponse', 422: 'ErrorsResponse' },
  })

  .delete('/:id', ({ params }) => DeleteTagUseCase.exec(params.id), {
    detail: { description: 'Delete a tag from the catalog and remove it from every quest.' },
    params: TagParams,
    response: { 200: 'TagResponse', 404: 'ErrorsResponse', 422: 'ErrorsResponse' },
  });
