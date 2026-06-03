# Home Industry Front Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adjust the home industry public frontend so it follows the approved layout from the latest design draft while preserving the existing blue/white visual style.

**Architecture:** Keep the current public API and backend data model unchanged. Restructure `HomeIndustryHomePage.jsx` into grouped service sections, and refine `ModuleDetailPage.jsx` so existing tree data renders as left navigation plus right-side service/detail cards with current styling.

**Tech Stack:** React 18, React Router DOM 6, Vite 5, Vitest, Testing Library, existing `historic.css` stylesheet.

---

## File Structure

- Modify: `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`
  - Add data-driven grouped homepage sections.
  - Keep existing banner/settings logic.
  - Preserve module links and direct external link behavior when an entry has a URL.

- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`
  - Keep tree/content compatibility helpers.
  - Add semantic card classes for service details.
  - Pass module info into right-content rendering so industry-chain layout can receive a chain-specific class.

- Modify: `frontend/src/styles/historic.css`
  - Add homepage group styles that reuse existing colors, rounded cards, subtle shadows, and hover transitions.
  - Add detail service-card styles that refine layout without using the design draft's purple/gray palette or thick blue wireframe borders.
  - Extend responsive rules for the new classes.

- Create: `frontend/src/tests/home-industry-home-layout.test.jsx`
  - Verify homepage renders “家居产业链服务” and “利企配套服务”.
  - Verify service entries link to existing module routes.

- Create: `frontend/src/tests/module-detail-service-card.test.jsx`
  - Verify right-side detail content renders in the new service-card structure.
  - Verify link nodes still render as clickable anchors.

---

### Task 1: Add failing homepage layout test

**Files:**
- Create: `frontend/src/tests/home-industry-home-layout.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/tests/home-industry-home-layout.test.jsx` with:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeIndustryHomePage from '../pages/home-industry/HomeIndustryHomePage'

vi.mock('../api/homeIndustry', () => ({
  getCdPublicSettings: () => Promise.resolve({ data: { code: 200, data: { home_banner: '' } } }),
  getCdModules: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: [
          { id: 1, code: 'industry_chain', title: '产业链服务' },
          { id: 2, code: 'enterprise_support', title: '利企配套服务' },
          { id: 3, code: 'value_added', title: '招商入驻' }
        ]
      }
    })
}))

describe('HomeIndustryHomePage grouped layout', () => {
  it('renders industry chain and enterprise support service groups', async () => {
    render(
      <MemoryRouter>
        <HomeIndustryHomePage />
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { name: '家居产业链服务' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '利企配套服务' })).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /上游.*原辅料采购、仓储/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /中游.*生产制造/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /下游.*销售出海/ })).toHaveAttribute('href', '/homeIndustry/industry_chain')
    expect(screen.getByRole('link', { name: /财税服务/ })).toHaveAttribute('href', '/homeIndustry/enterprise_support')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd frontend
npm test -- home-industry-home-layout.test.jsx
```

Expected: FAIL because `HomeIndustryHomePage.jsx` currently renders one flat module card grid and does not render headings named `家居产业链服务` and `利企配套服务`.

- [ ] **Step 3: Commit the failing test**

```bash
git add frontend/src/tests/home-industry-home-layout.test.jsx
git commit -m "test: cover home industry grouped layout"
```

---

### Task 2: Implement grouped homepage structure

**Files:**
- Modify: `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`

- [ ] **Step 1: Add homepage constants and matching helpers**

In `HomeIndustryHomePage.jsx`, after `fallbackIcons`, add:

```jsx
const HOME_TITLE = '胶州市家居产业服务“一类事”'

const serviceGroups = [
  {
    key: 'industry-chain',
    title: '家居产业链服务',
    className: 'hd-home-service-group--chain',
    entries: [
      { key: 'upstream', label: '上游', description: '原辅料采购、仓储', moduleCodes: ['industry_chain'], titleKeywords: ['产业链', '上游', '原辅料', '仓储'] },
      { key: 'midstream', label: '中游', description: '生产制造', moduleCodes: ['industry_chain'], titleKeywords: ['产业链', '中游', '生产制造'] },
      { key: 'downstream', label: '下游', description: '销售出海', moduleCodes: ['industry_chain'], titleKeywords: ['产业链', '下游', '销售出海'] }
    ]
  },
  {
    key: 'enterprise-support',
    title: '利企配套服务',
    className: 'hd-home-service-group--support',
    entries: [
      { key: 'tax', label: '财税服务', moduleCodes: ['enterprise_support', 'tax_service'], titleKeywords: ['利企配套', '财税'] },
      { key: 'human-resource', label: '人力资源服务', moduleCodes: ['enterprise_support', 'hr_service', 'human_resource'], titleKeywords: ['利企配套', '人力', '人力资源'] },
      { key: 'construction', label: '项目施工服务', moduleCodes: ['enterprise_support', 'project_service', 'construction_service'], titleKeywords: ['利企配套', '项目施工', '施工'] },
      { key: 'agency', label: '中介服务', moduleCodes: ['enterprise_support', 'agency_service'], titleKeywords: ['利企配套', '中介'] }
    ]
  }
]

function textIncludesAny(value, keywords = []) {
  const text = String(value || '')
  return keywords.some((keyword) => text.includes(keyword))
}

function findEntryModule(entry, modules) {
  const byCode = modules.find((module) => entry.moduleCodes?.includes(module.code))
  if (byCode) return byCode
  return modules.find((module) => textIncludesAny(module.title, entry.titleKeywords))
}
```

- [ ] **Step 2: Add homepage entry components**

In `HomeIndustryHomePage.jsx`, before `export default function HomeIndustryHomePage()`, add:

```jsx
function HomeServiceEntry({ entry, module, index }) {
  const content = (
    <>
      <img
        className="hd-home-service-card__icon"
        src={module ? getModuleIcon(module, index) : fallbackIcons[index % fallbackIcons.length]}
        alt=""
        aria-hidden="true"
        onError={(event) => { event.currentTarget.style.visibility = 'hidden' }}
      />
      <span className="hd-home-service-card__text">
        <strong>{entry.label}</strong>
        {entry.description && <small>{entry.description}</small>}
      </span>
    </>
  )

  if (!module) {
    return (
      <li className="hd-home-service-item">
        <span className="hd-home-service-card hd-home-service-card--disabled" aria-disabled="true">
          {content}
        </span>
      </li>
    )
  }

  return (
    <li className="hd-home-service-item">
      <Link to={`/homeIndustry/${module.code}`} className="hd-home-service-card">
        {content}
      </Link>
    </li>
  )
}

function HomeServiceGroup({ group, modules }) {
  return (
    <section className={`hd-home-service-group ${group.className}`}>
      <h2 className="hd-home-service-title">{group.title}</h2>
      <ul className="hd-home-service-grid">
        {group.entries.map((entry, index) => (
          <HomeServiceEntry
            key={entry.key}
            entry={entry}
            module={findEntryModule(entry, modules)}
            index={index}
          />
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 3: Replace the homepage flat card grid render**

In `HomeIndustryHomePage.jsx`, replace lines 85-113 with:

```jsx
<div className="hd-container">
  <section className="hd-section hd-home-overview">
    <h2 className="hd-section-title">
      <img src={`${ICON_BASE}/title_deco_left.png`} alt="" aria-hidden="true" />
      选择您想了解和办理的服务
      <img src={`${ICON_BASE}/title_deco_right.png`} alt="" aria-hidden="true" />
    </h2>

    <div className="hd-home-service-board">
      {serviceGroups.map((group) => (
        <HomeServiceGroup key={group.key} group={group} modules={modules} />
      ))}
    </div>
  </section>
</div>
```

Also replace hard-coded visible text in this file:

```jsx
<li><Link to="/homeIndustry">首页</Link></li>
<HeroTitle title={HOME_TITLE} />
<div className="hd-footer__body">{HOME_TITLE}</div>
```

Keep the existing `modules.map` top navigation unchanged except for the home label.

- [ ] **Step 4: Run the homepage test**

Run:

```bash
cd frontend
npm test -- home-industry-home-layout.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit homepage implementation**

```bash
git add frontend/src/pages/home-industry/HomeIndustryHomePage.jsx
git commit -m "feat: group home industry service entries"
```

---

### Task 3: Add failing detail service-card test

**Files:**
- Create: `frontend/src/tests/module-detail-service-card.test.jsx`

- [ ] **Step 1: Write the failing test**

Create `frontend/src/tests/module-detail-service-card.test.jsx` with:

```jsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ModuleDetailPage from '../pages/home-industry/ModuleDetailPage'

vi.mock('../api/homeIndustry', () => ({
  getCdModules: () => Promise.resolve({ data: { code: 200, data: [{ id: 1, code: 'enterprise_support', title: '利企配套服务' }] } }),
  getCdModuleTree: () =>
    Promise.resolve({
      data: {
        code: 200,
        data: {
          module: { id: 1, code: 'enterprise_support', title: '利企配套服务' },
          tree: [
            {
              id: 1,
              title: '政策服务',
              node_type: 'branch',
              children: [
                {
                  id: 2,
                  title: '基本政务服务',
                  node_type: 'branch',
                  children: [
                    {
                      id: 3,
                      title: '企业注册登记住所预指导服务',
                      node_type: 'leaf',
                      content_type: 'info',
                      summary: '在正式提交注册申请前，提供注册地址材料合规性预指导。',
                      department: '胶州市行政审批服务局',
                      fields: [
                        { field_label: '服务地点', field_value: '胶州市政务服务中心' },
                        { field_label: '办公时间', field_value: '工作日上午9:00-12:00，下午1:30-5:00' },
                        { field_label: '咨询电话', field_value: '82209035' }
                      ],
                      children: []
                    },
                    {
                      id: 4,
                      title: '我要申报',
                      node_type: 'leaf',
                      content_type: 'link',
                      link_url: 'https://example.com/apply',
                      link_label: '我要申报',
                      children: []
                    }
                  ]
                }
              ]
            }
          ],
          stats: {}
        }
      }
    })
}))

describe('ModuleDetailPage service cards', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders info leaf content in a service-detail card and keeps link leaves clickable', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/enterprise_support']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('企业注册登记住所预指导服务')).toBeInTheDocument()
    expect(screen.getByText('在正式提交注册申请前，提供注册地址材料合规性预指导。')).toBeInTheDocument()
    expect(screen.getByText('胶州市政务服务中心')).toBeInTheDocument()
    expect(container.querySelector('.hd-service-detail-card')).not.toBeNull()

    const applyLink = screen.getByRole('link', { name: /我要申报/ })
    expect(applyLink).toHaveAttribute('href', 'https://example.com/apply')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
cd frontend
npm test -- module-detail-service-card.test.jsx
```

Expected: FAIL because `.hd-service-detail-card` does not exist yet.

- [ ] **Step 3: Commit the failing test**

```bash
git add frontend/src/tests/module-detail-service-card.test.jsx
git commit -m "test: cover module detail service cards"
```

---

### Task 4: Refine detail page card structure

**Files:**
- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`

- [ ] **Step 1: Normalize info field labels in one helper**

After `getNodeContent`, add:

```jsx
function getContentFields(content) {
  return (content.fields || [])
    .map((field) => ({
      label: field.field_label || field.label,
      value: field.field_value || field.value
    }))
    .filter((field) => field.label && field.value)
}
```

Update existing `LeafContent` info rendering so both `field_label/field_value` and `label/value` work:

```jsx
{content.content_type === 'info' && getContentFields(content).length > 0 && (
  <div className="hd-topic-info">
    {getContentFields(content).map((f, i) => (
      <div key={i} className="hd-topic-info-field">
        <span className="label">{f.label}</span>
        <span className="value">{f.value}</span>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 2: Add service-card class names to `TopicCard`**

In `TopicCard`, update article class names:

```jsx
<article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card hd-service-detail-card--link">
```

for link leaves, and:

```jsx
<article id={`node-${node.id}`} className="hd-topic-card hd-service-detail-card">
```

for non-link leaves and branch cards.

Keep existing content rendering and expand/collapse behavior unchanged.

- [ ] **Step 3: Pass module context to right content**

Change `RightContent` signature to:

```jsx
function RightContent({ tree, expanded, onToggle, moduleInfo }) {
  const isIndustryChain = moduleInfo?.code === 'industry_chain'
```

Change its root class to:

```jsx
<div className={`hd-right-content${isIndustryChain ? ' hd-right-content--chain' : ''}`}>
```

Change `ModuleDetailPage` render from:

```jsx
<RightContent tree={tree} expanded={expanded} onToggle={toggle} />
```

to:

```jsx
<RightContent tree={tree} expanded={expanded} onToggle={toggle} moduleInfo={moduleInfo} />
```

- [ ] **Step 4: Replace visible fallback labels with correct Chinese**

In `ModuleDetailPage.jsx`, replace only hard-coded fallback labels and aria labels:

```jsx
<li><Link to="/homeIndustry">首页</Link></li>
<h1>{moduleInfo?.title || '服务详情'}</h1>
<div className="hd-footer__body">胶州市家居产业服务“一类事”</div>
aria-label="回到顶部"
```

Do not change API data values returned from the backend.

- [ ] **Step 5: Run detail tests**

Run:

```bash
cd frontend
npm test -- module-detail-service-card.test.jsx module-detail-link.test.jsx module-detail-body-fallback.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Commit detail page implementation**

```bash
git add frontend/src/pages/home-industry/ModuleDetailPage.jsx
git commit -m "feat: refine home industry detail service cards"
```

---

### Task 5: Add styles while preserving existing visual language

**Files:**
- Modify: `frontend/src/styles/historic.css`

- [ ] **Step 1: Add homepage grouped layout styles**

Append after existing `.hd-card-link:hover .hd-card-link__icon` block:

```css
.hd-home-overview {
  padding-bottom: 20px;
}

.hd-home-service-board {
  width: 95%;
  margin: 24px auto 0;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hd-home-service-group {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(9, 114, 203, 0.12);
  border-radius: 18px;
  box-shadow: 0 8px 28px rgba(9, 114, 203, 0.08);
  padding: 24px;
}

.hd-home-service-title {
  margin: 0 0 18px;
  color: var(--hd-primary-dark);
  font-size: 22px;
  font-weight: 800;
  text-align: center;
  letter-spacing: 1px;
}

.hd-home-service-title::after {
  content: "";
  display: block;
  width: 72px;
  height: 3px;
  margin: 10px auto 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--hd-primary-dark), var(--hd-primary));
}

.hd-home-service-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.hd-home-service-group--support .hd-home-service-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.hd-home-service-card {
  min-height: 86px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 18px;
  background: linear-gradient(135deg, #fff 0%, #f6fbff 100%);
  border: 1px solid var(--hd-border);
  border-radius: var(--hd-card-radius);
  color: var(--hd-text-soft);
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
}

.hd-home-service-card:hover {
  color: var(--hd-text);
  border-color: var(--hd-primary);
  box-shadow: 0 6px 18px rgba(21, 132, 218, 0.22);
  transform: translateY(-2px);
}

.hd-home-service-card--disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.hd-home-service-card__icon {
  width: 38px;
  height: 38px;
  object-fit: contain;
  flex-shrink: 0;
}

.hd-home-service-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  line-height: 1.35;
}

.hd-home-service-card__text small {
  color: #6b7c8f;
  font-size: 13px;
  font-weight: 500;
}
```

- [ ] **Step 2: Add detail service-card styles**

Append after `.hd-topic-card` styles:

```css
.hd-service-detail-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
}

.hd-service-detail-card .hd-topic-title {
  border-radius: 16px;
}

.hd-service-detail-card .hd-topic-body {
  border-left-color: var(--hd-primary);
}

.hd-right-content--chain .hd-stage-section {
  border: 1px solid rgba(21, 132, 218, 0.12);
}
```

- [ ] **Step 3: Extend responsive rules**

Inside `@media (max-width: 1100px)`, add:

```css
  .hd-home-service-grid,
  .hd-home-service-group--support .hd-home-service-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
```

Inside `@media (max-width: 640px)`, add:

```css
  .hd-home-service-board {
    width: 100%;
  }
  .hd-home-service-group {
    padding: 18px;
  }
  .hd-home-service-grid,
  .hd-home-service-group--support .hd-home-service-grid {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
cd frontend
npm test -- home-industry-home-layout.test.jsx module-detail-service-card.test.jsx module-detail-link.test.jsx module-detail-body-fallback.test.jsx
```

Expected: PASS.

- [ ] **Step 5: Commit styles**

```bash
git add frontend/src/styles/historic.css
git commit -m "style: preserve original look for home industry layout"
```

---

### Task 6: Full verification and final review

**Files:**
- Review: `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`
- Review: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`
- Review: `frontend/src/styles/historic.css`
- Review: `frontend/src/tests/home-industry-home-layout.test.jsx`
- Review: `frontend/src/tests/module-detail-service-card.test.jsx`

- [ ] **Step 1: Run all frontend tests**

```bash
cd frontend
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Run frontend build**

```bash
cd frontend
npm run build
```

Expected: build succeeds. Vite chunk-size warnings are acceptable if the command exits with code 0.

- [ ] **Step 3: Inspect git status**

```bash
git status --short --branch
```

Expected: current branch is `feat/home-industry-front-display`; no unexpected untracked files except ignored local `.superpowers/` artifacts.

- [ ] **Step 4: Final commit if verification required small fixes**

If verification required fixes, commit them with:

```bash
git add frontend/src/pages/home-industry/HomeIndustryHomePage.jsx frontend/src/pages/home-industry/ModuleDetailPage.jsx frontend/src/styles/historic.css frontend/src/tests/home-industry-home-layout.test.jsx frontend/src/tests/module-detail-service-card.test.jsx
git commit -m "fix: verify home industry front display"
```

If no fixes are needed, do not create an empty commit.
