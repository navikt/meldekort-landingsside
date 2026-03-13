import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  dataset: import.meta.env.SANITY_DATASET || 'production',
  projectId: 'rt6o382n',
  useCdn: true,
  token: import.meta.env.SANITY_TOKEN || '',
  apiVersion: '2022-03-07',
  perspective: 'published',
});
