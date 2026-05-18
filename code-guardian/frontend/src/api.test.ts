import { describe, it, expect } from 'vitest';
import { api } from './api';

describe('api config map', () => {
  it('has rest start and poll endpoints', () => {
    expect(api.rest.start).toBeTypeOf('function');
    expect(api.rest.poll).toBeTypeOf('function');
  });

  it('has graphql start and poll endpoints', () => {
    expect(api.graphql.start).toBeTypeOf('function');
    expect(api.graphql.poll).toBeTypeOf('function');
  });
});
