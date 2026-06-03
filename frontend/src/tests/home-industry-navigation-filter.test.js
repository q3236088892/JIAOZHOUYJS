import { describe, expect, it } from 'vitest'
import {
  filterTreeByTopNavSection,
  getVisibleHomeIndustryTopNav,
  HOME_INDUSTRY_TOP_NAV
} from '../utils/homeIndustryNavigation'

describe('home industry navigation section filtering', () => {
  it('includes the added investment section top navigation entries', () => {
    expect(HOME_INDUSTRY_TOP_NAV).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'industry-intro',
          label: '产业简介',
          to: '/homeIndustry/value_added?section=industry-intro'
        }),
        expect.objectContaining({
          key: 'investment-promo',
          label: '招商宣传',
          to: '/homeIndustry/value_added?section=investment-promo'
        }),
        expect.objectContaining({
          key: 'enterprise-cert',
          label: '企业办证',
          to: '/homeIndustry/value_added?section=enterprise-cert'
        })
      ])
    )
  })

  it('hides top navigation entries disabled by visibility settings', () => {
    const visible = getVisibleHomeIndustryTopNav(JSON.stringify({
      'investment-promo': false,
      policy: true
    }))

    expect(visible.map((item) => item.key)).not.toContain('investment-promo')
    expect(visible.map((item) => item.key)).toContain('industry-intro')
    expect(visible.map((item) => item.key)).toContain('policy')
  })

  it.each([
    ['industry-intro', '产业简介'],
    ['investment-promo', '招商宣传'],
    ['enterprise-cert', '企业办证流程']
  ])('filters new investment subsection %s to only %s', (sectionKey, expectedTitle) => {
    const tree = [
      { id: 1, title: '产业简介', node_type: 'branch', children: [] },
      { id: 2, title: '招商宣传', node_type: 'branch', children: [] },
      { id: 3, title: '企业办证流程', node_type: 'branch', children: [] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'value_added', sectionKey)

    expect(filtered.map((node) => node.title)).toEqual([expectedTitle])
  })


  it('filters new investment subsection inside the investment root only', () => {
    const tree = [
      {
        id: 1,
        title: '（一）招商入驻',
        node_type: 'branch',
        children: [
          { id: 11, title: '产业简介', node_type: 'branch', children: [{ id: 111, title: '简介正文', node_type: 'leaf', children: [] }] },
          { id: 12, title: '招商宣传', node_type: 'branch', children: [{ id: 121, title: '宣传资料', node_type: 'leaf', children: [] }] },
          { id: 13, title: '企业办证流程', node_type: 'branch', children: [{ id: 131, title: '营业执照申领', node_type: 'leaf', children: [] }] }
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
        title: '1.上游',
        node_type: 'branch',
        children: [
          { id: 11, title: '原辅料采购、仓储', node_type: 'branch', children: [] },
          { id: 12, title: '服务内容：精准招引上下游配套企业', node_type: 'leaf', children: [] }
        ]
      },
      { id: 2, title: '2.中游', node_type: 'branch', children: [{ id: 21, title: '生产制造', node_type: 'branch', children: [] }] },
      { id: 3, title: '3.下游', node_type: 'branch', children: [{ id: 31, title: '销售出海', node_type: 'branch', children: [] }] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'industry_chain', 'downstream')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('3.下游')
    expect(filtered[0].children[0].title).toBe('销售出海')
  })

  it('filters enterprise-support service entries to the selected service only', () => {
    const tree = [
      { id: 1, title: '1.财税服务', node_type: 'branch', children: [{ id: 11, title: '代理记账服务公司清单', node_type: 'branch', children: [] }] },
      { id: 2, title: '2.人力资源服务', node_type: 'branch', children: [{ id: 21, title: '人力资源服务公司清单', node_type: 'branch', children: [] }] },
      { id: 3, title: '3.项目施工服务', node_type: 'branch', children: [{ id: 31, title: '施工企业清单', node_type: 'branch', children: [] }] },
      { id: 4, title: '4.中介服务', node_type: 'branch', children: [{ id: 41, title: '中介服务机构', node_type: 'branch', children: [] }] }
    ]

    const filtered = filterTreeByTopNavSection(tree, 'enterprise_support', 'tax')

    expect(filtered).toHaveLength(1)
    expect(filtered[0].title).toBe('1.财税服务')
    expect(filtered[0].children[0].title).toBe('代理记账服务公司清单')
  })

  it.each([
    ['industry_chain', 'upstream', '1.上游'],
    ['industry_chain', 'midstream', '2.中游'],
    ['industry_chain', 'downstream', '3.下游'],
    ['enterprise_support', 'tax', '1.财税服务'],
    ['enterprise_support', 'human-resource', '2.人力资源服务'],
    ['enterprise_support', 'construction', '3.项目施工服务'],
    ['enterprise_support', 'agency', '4.中介服务'],
    ['value_added', 'investment', '（一）招商入驻'],
    ['value_added', 'project', '（二）项目服务'],
    ['value_added', 'policy', '（三）政策服务'],
    ['value_added', 'legal', '（四）法律服务'],
    ['value_added', 'talent', '（五）人才服务'],
    ['value_added', 'finance', '（六）金融服务'],
    ['value_added', 'assistance', '（七）帮办服务'],
    ['value_added', 'trade', '（八）国际贸易服务'],
    ['value_added', 'chain-extension', '（九）“一件事”延链拓面']
  ])('filters %s section %s to only %s', (moduleCode, sectionKey, expectedTitle) => {
    const tree = [
      { id: 1, title: '1.上游', node_type: 'branch', children: [{ id: 11, title: '服务内容：精准招引上下游配套企业', node_type: 'leaf', children: [] }] },
      { id: 2, title: '2.中游', node_type: 'branch', children: [] },
      { id: 3, title: '3.下游', node_type: 'branch', children: [] },
      { id: 4, title: '1.财税服务', node_type: 'branch', children: [] },
      { id: 5, title: '2.人力资源服务', node_type: 'branch', children: [] },
      { id: 6, title: '3.项目施工服务', node_type: 'branch', children: [] },
      { id: 7, title: '4.中介服务', node_type: 'branch', children: [] },
      { id: 8, title: '（一）招商入驻', node_type: 'branch', children: [] },
      { id: 9, title: '（二）项目服务', node_type: 'branch', children: [] },
      { id: 10, title: '（三）政策服务', node_type: 'branch', children: [] },
      { id: 11, title: '（四）法律服务', node_type: 'branch', children: [] },
      { id: 12, title: '（五）人才服务', node_type: 'branch', children: [] },
      { id: 13, title: '（六）金融服务', node_type: 'branch', children: [] },
      { id: 14, title: '（七）帮办服务', node_type: 'branch', children: [] },
      { id: 15, title: '（八）国际贸易服务', node_type: 'branch', children: [] },
      { id: 16, title: '（九）“一件事”延链拓面', node_type: 'branch', children: [] }
    ]

    const filtered = filterTreeByTopNavSection(tree, moduleCode, sectionKey)

    expect(filtered.map((node) => node.title)).toEqual([expectedTitle])
  })
})
