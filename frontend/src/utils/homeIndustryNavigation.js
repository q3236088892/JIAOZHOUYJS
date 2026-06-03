export const HOME_INDUSTRY_TOP_NAV = [
  { key: 'home', label: '首页', to: '/homeIndustry', icon: 'home' },
  { key: 'investment', label: '招商入驻', to: '/homeIndustry/value_added?section=investment', moduleCode: 'value_added', section: 'investment', icon: 'investment' },
  { key: 'project', label: '项目服务', to: '/homeIndustry/value_added?section=project', moduleCode: 'value_added', section: 'project', icon: 'project' },
  { key: 'policy', label: '政策服务', to: '/homeIndustry/value_added?section=policy', moduleCode: 'value_added', section: 'policy', icon: 'policy' },
  { key: 'legal', label: '法律服务', to: '/homeIndustry/value_added?section=legal', moduleCode: 'value_added', section: 'legal', icon: 'legal' },
  { key: 'talent', label: '人才服务', to: '/homeIndustry/value_added?section=talent', moduleCode: 'value_added', section: 'talent', icon: 'talent' },
  { key: 'finance', label: '金融服务', to: '/homeIndustry/value_added?section=finance', moduleCode: 'value_added', section: 'finance', icon: 'finance' },
  { key: 'assistance', label: '帮办服务', to: '/homeIndustry/value_added?section=assistance', moduleCode: 'value_added', section: 'assistance', icon: 'assistance' },
  { key: 'trade', label: '国际贸易服务', to: '/homeIndustry/value_added?section=trade', moduleCode: 'value_added', section: 'trade', icon: 'trade' },
  { key: 'chain-extension', label: '“一件事”延链拓面', to: '/homeIndustry/value_added?section=chain-extension', moduleCode: 'value_added', section: 'chain-extension', icon: 'chain' }
]

export const HOME_INDUSTRY_SECTION_FILTERS = {
  investment: { moduleCode: 'value_added', keywords: ['招商入驻', '招商', '入驻'] },
  project: { moduleCode: 'value_added', keywords: ['项目服务'] },
  policy: { moduleCode: 'value_added', keywords: ['政策服务'] },
  legal: { moduleCode: 'value_added', keywords: ['法律服务'] },
  talent: { moduleCode: 'value_added', keywords: ['人才服务'] },
  finance: { moduleCode: 'value_added', keywords: ['金融服务'] },
  assistance: { moduleCode: 'value_added', keywords: ['帮办服务'] },
  trade: { moduleCode: 'value_added', keywords: ['国际贸易服务'] },
  'chain-extension': { moduleCode: 'value_added', keywords: ['延链拓面', '一件事'] },
  upstream: { moduleCode: 'industry_chain', keywords: ['上游'] },
  midstream: { moduleCode: 'industry_chain', keywords: ['中游'] },
  downstream: { moduleCode: 'industry_chain', keywords: ['下游'] },
  tax: { moduleCode: 'enterprise_support', keywords: ['财税服务'] },
  'human-resource': { moduleCode: 'enterprise_support', keywords: ['人力资源服务'] },
  construction: { moduleCode: 'enterprise_support', keywords: ['项目施工服务'] },
  agency: { moduleCode: 'enterprise_support', keywords: ['中介服务'] }
}

function includesAny(value, keywords) {
  const text = String(value || '')
  return keywords.some((keyword) => text.includes(keyword))
}

export function filterTreeByTopNavSection(tree, moduleCode, sectionKey) {
  const section = HOME_INDUSTRY_SECTION_FILTERS[sectionKey]
  if (!section || section.moduleCode !== moduleCode) return tree

  const filtered = (tree || []).filter((node) => includesAny(node.title, section.keywords))
  return filtered.length > 0 ? filtered : tree
}
