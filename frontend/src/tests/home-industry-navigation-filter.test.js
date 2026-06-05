import { describe, expect, it } from 'vitest'
import {
  filterTreeByTopNavSection,
  getVisibleHomeIndustryTopNav,
  HOME_INDUSTRY_TOP_NAV
} from '../utils/homeIndustryNavigation'

describe('home industry navigation section filtering', () => {
  it('uses the 2026.6.5 top navigation entries', () => {
    expect(HOME_INDUSTRY_TOP_NAV.map((item) => ({
      key: item.key,
      label: item.label,
      to: item.to
    }))).toEqual([
      { key: 'home', label: '首页', to: '/homeIndustry' },
      { key: 'industry-intro', label: '产业简介', to: '/homeIndustry/value_added?section=industry-intro' },
      { key: 'investment-promo', label: '招商宣传', to: '/homeIndustry/value_added?section=investment-promo' }
    ])
  })

  it('hides top navigation entries disabled by visibility settings', () => {
    const visible = getVisibleHomeIndustryTopNav(JSON.stringify({
      'investment-promo': false,
      policy: true
    }))

    expect(visible.map((item) => item.key)).toEqual(['home', 'industry-intro'])
  })

  it.each([
    ['industry-intro', '产业简介'],
    ['investment-promo', '招商宣传']
  ])('filters value_added subsection %s to only %s', (sectionKey, expectedTitle) => {
    const tree = [
      { id: 1, title: '产业简介', node_type: 'branch', children: [] },
      { id: 2, title: '招商宣传', node_type: 'branch', children: [] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'value_added', sectionKey)

    expect(filtered.map((node) => node.title)).toEqual([expectedTitle])
  })

  it('keeps legacy nested industry-intro matching for older value_added trees', () => {
    const tree = [
      {
        id: 1,
        title: '（一）招商入驻',
        node_type: 'branch',
        children: [
          { id: 11, title: '产业简介', node_type: 'branch', children: [{ id: 111, title: '简介正文', node_type: 'leaf', children: [] }] },
          { id: 12, title: '招商宣传', node_type: 'branch', children: [{ id: 121, title: '宣传资料', node_type: 'leaf', children: [] }] }
        ]
      },
      { id: 2, title: '（二）项目服务', node_type: 'branch', children: [{ id: 21, title: '项目立项', node_type: 'branch', children: [] }] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'value_added', 'industry-intro')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('（一）招商入驻')
    expect(filtered[0].children.map((node) => node.title)).toEqual(['产业简介'])
  })

  it('filters industry-chain entries to the selected stage only', () => {
    const tree = [
      {
        id: 1,
        title: '1.上游\n原辅料采购、仓储',
        node_type: 'branch',
        children: [
          { id: 11, title: '基本政务服务', node_type: 'branch', children: [] },
          { id: 12, title: '服务内容：精准招引上下游配套企业', node_type: 'leaf', children: [] }
        ]
      },
      { id: 2, title: '2.中游\n生产制造', node_type: 'branch', children: [{ id: 21, title: '生产制造', node_type: 'branch', children: [] }] },
      { id: 3, title: '3.下游\n销售出海', node_type: 'branch', children: [{ id: 31, title: '销售出海', node_type: 'branch', children: [] }] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'industry_chain', 'downstream')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('3.下游\n销售出海')
    expect(filtered[0].children[0].title).toBe('销售出海')
  })

  it('filters enterprise-support service entries to the selected 2026.6.5 category only', () => {
    const tree = [
      { id: 1, title: '政策服务', node_type: 'branch', children: [{ id: 11, title: '惠企政策查询', node_type: 'branch', children: [] }] },
      { id: 2, title: '法律服务', node_type: 'branch', children: [{ id: 21, title: '企业经营合规指导', node_type: 'branch', children: [] }] },
      { id: 3, title: '人才服务', node_type: 'branch', children: [{ id: 31, title: '人才安置', node_type: 'branch', children: [] }] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'enterprise_support', 'legal')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('法律服务')
    expect(filtered[0].children[0].title).toBe('企业经营合规指导')
  })

  it('keeps legacy value_added filters when enterprise-support reuses the same section keys', () => {
    const valueAddedTree = [
      { id: 1, title: '（三）政策服务', node_type: 'branch', children: [] },
      { id: 2, title: '（四）法律服务', node_type: 'branch', children: [] }
    ]
    const enterpriseSupportTree = [
      { id: 3, title: '政策服务', node_type: 'branch', children: [] },
      { id: 4, title: '法律服务', node_type: 'branch', children: [] }
    ]

    expect(filterTreeByTopNavSection(valueAddedTree, 'value_added', 'policy').map((node) => node.title)).toEqual(['（三）政策服务'])
    expect(filterTreeByTopNavSection(enterpriseSupportTree, 'enterprise_support', 'policy').map((node) => node.title)).toEqual(['政策服务'])
  })

  it.each([
    ['industry_chain', 'upstream', '1.上游\n原辅料采购、仓储'],
    ['industry_chain', 'midstream', '2.中游\n生产制造'],
    ['industry_chain', 'downstream', '3.下游\n销售出海'],
    ['enterprise_support', 'policy', '政策服务'],
    ['enterprise_support', 'legal', '法律服务'],
    ['enterprise_support', 'talent', '人才服务'],
    ['enterprise_support', 'finance', '金融服务'],
    ['enterprise_support', 'trade', '国际贸易服务'],
    ['enterprise_support', 'social-resource', '社会服务（企业）资源'],
    ['enterprise_support', 'assistance', '帮办服务'],
    ['enterprise_support', 'derivative', '衍生服务']
  ])('filters %s section %s to only %s', (moduleCode, sectionKey, expectedTitle) => {
    const tree = [
      { id: 1, title: '1.上游\n原辅料采购、仓储', node_type: 'branch', children: [{ id: 11, title: '服务内容：精准招引上下游配套企业', node_type: 'leaf', children: [] }] },
      { id: 2, title: '2.中游\n生产制造', node_type: 'branch', children: [] },
      { id: 3, title: '3.下游\n销售出海', node_type: 'branch', children: [] },
      { id: 4, title: '政策服务', node_type: 'branch', children: [] },
      { id: 5, title: '法律服务', node_type: 'branch', children: [] },
      { id: 6, title: '人才服务', node_type: 'branch', children: [] },
      { id: 7, title: '金融服务', node_type: 'branch', children: [] },
      { id: 8, title: '国际贸易服务', node_type: 'branch', children: [] },
      { id: 9, title: '社会服务（企业）资源', node_type: 'branch', children: [] },
      { id: 10, title: '帮办服务', node_type: 'branch', children: [] },
      { id: 11, title: '衍生服务', node_type: 'branch', children: [] }
    ]

    const filtered = filterTreeByTopNavSection(tree, moduleCode, sectionKey)

    expect(filtered.map((node) => node.title)).toEqual([expectedTitle])
  })
})
