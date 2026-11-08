import { technologyPublishersAdapters } from './sites/technology-publishers'
import { foodRecipesAdapters } from './sites/food-recipes'
import { healthAdapters } from './sites/health'
import { sportsAdapters } from './sites/sports'
import { travelNatureAdapters } from './sites/travel-nature'
import { artsCultureAdapters } from './sites/arts-culture'
import type { SiteAdapter } from './types'
import { platformDocsAdapters } from './sites/platform-docs'
import { frameworkDocsAdapters } from './sites/framework-docs'
import { languageDocsAdapters } from './sites/language-docs'
import { chinesePublishersAdapters } from './sites/chinese-publishers'
import { scienceEducationAdapters } from './sites/science-education'
import { communitiesAdapters } from './sites/communities'
import { internationalPublishersAdapters } from './sites/international-publishers'
import { referenceAdapters } from './sites/reference'

export const adapters: readonly SiteAdapter[] = [
  ...technologyPublishersAdapters,
  ...foodRecipesAdapters,
  ...healthAdapters,
  ...sportsAdapters,
  ...travelNatureAdapters,
  ...artsCultureAdapters,
  ...platformDocsAdapters,
  ...frameworkDocsAdapters,
  ...languageDocsAdapters,
  ...chinesePublishersAdapters,
  ...scienceEducationAdapters,
  ...communitiesAdapters,
  ...internationalPublishersAdapters,
  ...referenceAdapters
]

// Specific hosts and paths win over broad platform defaults. IDs stay independent of file layout.
export function selectAdapter(host: string, path = '/') {
  const hostname = host.toLowerCase().replace(/\.$/, '')
  return adapters
    .flatMap((adapter) => {
      if (
        adapter.path &&
        !new RegExp(
          adapter.path.source,
          adapter.path.flags.replace(/[gy]/g, '')
        ).test(path)
      )
        return []
      const hosts = adapter.hosts.filter(
        (domain) => hostname === domain || hostname.endsWith('.' + domain)
      )
      if (!hosts.length) return []
      return [{ adapter, specificity: Math.max(...hosts.map((h) => h.length)) }]
    })
    .sort(
      (a, b) =>
        (b.adapter.priority || 0) - (a.adapter.priority || 0) ||
        b.specificity - a.specificity ||
        Number(!!b.adapter.path) - Number(!!a.adapter.path)
    )[0]?.adapter
}
