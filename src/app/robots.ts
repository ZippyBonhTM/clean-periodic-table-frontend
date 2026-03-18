import type { MetadataRoute } from 'next';

import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: buildAbsoluteAppUrl('/sitemap.xml'),
  };
}
