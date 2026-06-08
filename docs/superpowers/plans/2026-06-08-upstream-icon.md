# Upstream Icon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace only the home page “上游” service card icon with a house-percent-hand line icon that matches the current card style.

**Architecture:** Add one static SVG asset under the existing public icon directory, then point only the `upstream` service entry to that asset. Keep all layout and CSS unchanged so the existing `.hd-home-service-card__icon` size and spacing continue to control presentation.

**Tech Stack:** React 18, Vite 5, Vitest, Testing Library, static SVG under `frontend/public`.

---

## File Structure

- Create: `frontend/public/historic/icons/upstream_home_percent.svg` — static line icon for the upstream card.
- Modify: `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx` — change only the `upstream` entry `icon` path.
- Modify: `frontend/src/tests/home-industry-home-layout.test.jsx` — add an assertion that the “上游” card image uses the new SVG path.

### Task 1: Lock the desired icon path with a failing test

**Files:**
- Modify: `frontend/src/tests/home-industry-home-layout.test.jsx`

- [ ] **Step 1: Write the failing test assertion**

In the existing test `uses different icons for each home service entry`, after building `iconSrcs`, add:

```jsx
    const upstreamCard = serviceBoardElement.querySelector('a[href="/homeIndustry/industry_chain?section=upstream"]')
    expect(upstreamCard.querySelector('.hd-home-service-card__icon')).toHaveAttribute('src', '/historic/icons/upstream_home_percent.svg')
```

The complete assertion block should become:

```jsx
    const iconSrcs = [...serviceBoardElement.querySelectorAll('.hd-home-service-card__icon')]
      .map((icon) => icon.getAttribute('src'))

    const upstreamCard = serviceBoardElement.querySelector('a[href="/homeIndustry/industry_chain?section=upstream"]')
    expect(upstreamCard.querySelector('.hd-home-service-card__icon')).toHaveAttribute('src', '/historic/icons/upstream_home_percent.svg')

    expect(iconSrcs).toHaveLength(11)
    expect(new Set(iconSrcs).size).toBe(11)
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd frontend
npm test -- src/tests/home-industry-home-layout.test.jsx
```

Expected: FAIL because the upstream icon still points to `/historic/icons/openRestaurant.png`, not `/historic/icons/upstream_home_percent.svg`.

### Task 2: Add the SVG asset and switch the upstream entry

**Files:**
- Create: `frontend/public/historic/icons/upstream_home_percent.svg`
- Modify: `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`

- [ ] **Step 1: Create the SVG icon**

Create `frontend/public/historic/icons/upstream_home_percent.svg` with:

```svg
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="上游利率房屋服务">
  <path d="M17 28.5H12.5L32 9.5L51.5 28.5H47V38.5" stroke="#2F7CF6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M19 28.5V43" stroke="#2F7CF6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="25" cy="27" r="5.5" stroke="#2F7CF6" stroke-width="5"/>
  <circle cx="39" cy="39" r="5.5" stroke="#2F7CF6" stroke-width="5"/>
  <path d="M41.5 21.5L22.5 45.5" stroke="#2F7CF6" stroke-width="5" stroke-linecap="round"/>
  <path d="M20 49L28.5 43.5C31.5 41.5 36 42 38.5 44.5L29.5 49.5H42C45 49.5 47.5 48.5 49.5 46L55 38.5C56.5 36.5 59.5 37.5 59 40L53.5 52C52.5 54.5 50.5 56 47.5 56.5L25.5 60L18 54" stroke="#2F7CF6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M18 54L11.5 61L4.5 53L12 45L20 49" stroke="#2F7CF6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Step 2: Point only upstream to the new icon**

In `frontend/src/pages/home-industry/HomeIndustryHomePage.jsx`, change only this entry:

```jsx
      { key: 'upstream', label: '上游', description: '原辅料采购、仓储', icon: `${ICON_BASE}/upstream_home_percent.svg`, moduleCodes: ['industry_chain'], section: 'upstream', titleKeywords: ['产业链', '上游', '原辅料', '仓储'] },
```

Do not change the `midstream`, `downstream`, `moduleIcons`, or `fallbackIcons` definitions.

- [ ] **Step 3: Run the focused test and verify GREEN**

Run:

```bash
cd frontend
npm test -- src/tests/home-industry-home-layout.test.jsx
```

Expected: PASS; the upstream icon assertion passes and the existing unique-icon assertion still passes.

### Task 3: Final verification

**Files:**
- Verify only; no expected source edits.

- [ ] **Step 1: Run the front-end build**

Run:

```bash
cd frontend
npm run build
```

Expected: PASS; Vite build completes without errors.

- [ ] **Step 2: Review changed files only**

Run:

```bash
git diff -- frontend/src/pages/home-industry/HomeIndustryHomePage.jsx frontend/src/tests/home-industry-home-layout.test.jsx frontend/public/historic/icons/upstream_home_percent.svg
```

Expected: diff contains only the new SVG, the upstream icon path change, and the upstream icon test assertion.

- [ ] **Step 3: Commit implementation files only**

Run:

```bash
git add frontend/public/historic/icons/upstream_home_percent.svg frontend/src/pages/home-industry/HomeIndustryHomePage.jsx frontend/src/tests/home-industry-home-layout.test.jsx
git commit -m "feat: update upstream service icon"
```

Expected: commit succeeds without staging unrelated pre-existing workspace changes.
