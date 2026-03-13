import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  dataset: 'production',
  projectId: 'rt6o382n',
  useCdn: true,
  token: '',
  apiVersion: '2022-03-07',
  perspective: 'published',
});
