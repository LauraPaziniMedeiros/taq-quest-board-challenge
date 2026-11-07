import { apiRequest } from '@core/http/http-client';
import type { Tag } from '@domain/model/tag.model';
import { tagSchema, tagsSchema } from './tag.schema';

export async function listTags(signal?: AbortSignal): Promise<Tag[]> {
  const response = await apiRequest<unknown>('/tags', { signal });
  return tagsSchema.parse(response);
}

export async function createTag(name: string): Promise<Tag> {
  const response = await apiRequest<unknown>('/tags', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
  return tagSchema.parse(response);
}

export async function deleteTag(id: string): Promise<Tag> {
  const response = await apiRequest<unknown>(`/tags/${id}`, { method: 'DELETE' });
  return tagSchema.parse(response);
}
