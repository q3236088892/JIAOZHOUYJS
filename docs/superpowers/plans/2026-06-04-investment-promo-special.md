# Investment Promo Special Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the confirmed “招商宣传” static special page for `/homeIndustry/value_added?section=investment-promo`, with the video at the top and two optimized poster sections below.

**Architecture:** Reuse the existing `ModuleDetailPage.jsx` special-section pathway. Add a dedicated static `InvestmentPromoSpecialContent` component parallel to `IndustryIntroSpecialContent`, keep backend data/interfaces unchanged, and place static media under `frontend/public/home-industry/investment-promo/`.

**Tech Stack:** React 18, Vite 5, Vitest + Testing Library, CSS in `frontend/src/styles/historic.css`, static assets in Vite public directory, Python Pillow for PNG-to-WebP conversion.

---

## File Structure

- Modify: `frontend/src/tests/module-detail-special-template.test.jsx`
  - Add a regression test for `section=investment-promo`.
- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`
  - Add static investment-promo asset constants, section data, and `InvestmentPromoSpecialContent`.
  - Route `sectionKey === 'investment-promo'` to the new component.
- Modify: `frontend/src/styles/historic.css`
  - Add investment-promo video and cover styles, while reusing existing poster styles.
- Create directory: `frontend/public/home-industry/investment-promo/`
  - `promo-video.mp4`
  - `supply-chain.webp`
  - `strong-chain.webp`

---

### Task 1: Add the failing investment-promo special page test

**Files:**
- Modify: `frontend/src/tests/module-detail-special-template.test.jsx`

- [ ] **Step 1: Add this test after the existing industry-intro test**

```jsx
  it('renders investment promo as a video-first poster page', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/homeIndustry/value_added?section=investment-promo']}>
        <Routes>
          <Route path="/homeIndustry/:moduleCode" element={<ModuleDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect((await screen.findAllByRole('heading', { name: '\u62db\u5546\u5ba3\u4f20' })).length).toBeGreaterThan(0)
    expect(container.querySelector('.hd-special-section-layout')).not.toBeNull()
    expect(container.querySelector('.hd-left-menu')).toBeNull()

    const anchorMenu = container.querySelector('.hd-special-anchor-menu')
    expect(anchorMenu).not.toBeNull()
    expect(anchorMenu).toHaveTextContent('\u5ba3\u4f20\u89c6\u9891')
    expect(anchorMenu).toHaveTextContent('\u5b8c\u5584\u4f9b\u5e94\u94fe')
    expect(anchorMenu).toHaveTextContent('\u505a\u5f3a\u4ea7\u4e1a\u94fe')

    const promoVideo = container.querySelector('.hd-special-promo-video')
    expect(promoVideo).not.toBeNull()
    expect(promoVideo).toHaveAttribute('src', '/home-industry/investment-promo/promo-video.mp4')
    expect(promoVideo).toHaveAttribute('controls')

    const posterImages = container.querySelectorAll('.hd-special-poster-image')
    expect(posterImages).toHaveLength(2)
    expect(posterImages[0]).toHaveAttribute('src', '/home-industry/investment-promo/supply-chain.webp')
    expect(posterImages[1]).toHaveAttribute('src', '/home-industry/investment-promo/strong-chain.webp')
    expect(container.querySelector('.hd-special-section-layout')).not.toHaveTextContent('\u62db\u5546\u5ba3\u4f20\u5185\u5bb9')
  })
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
cd frontend
npm test -- src/tests/module-detail-special-template.test.jsx --reporter verbose
```

Expected: the new test fails because `.hd-special-promo-video` does not exist and the page still uses the generic data-driven special template for `investment-promo`.

---

### Task 2: Add static investment-promo rendering logic

**Files:**
- Modify: `frontend/src/pages/home-industry/ModuleDetailPage.jsx`

- [ ] **Step 1: Add constants after `INDUSTRY_INTRO_STATIC_SECTIONS`**

```jsx
const INVESTMENT_PROMO_ASSET_BASE = '/home-industry/investment-promo'
const INVESTMENT_PROMO_STATIC_SECTIONS = [
  {
    id: 'video',
    type: 'video',
    title: '\u5ba3\u4f20\u89c6\u9891',
    src: `${INVESTMENT_PROMO_ASSET_BASE}/promo-video.mp4`
  },
  {
    id: 'supply-chain',
    type: 'image',
    title: '\u5b8c\u5584\u4f9b\u5e94\u94fe',
    images: [
      { src: `${INVESTMENT_PROMO_ASSET_BASE}/supply-chain.webp`, alt: '\u5b8c\u5584\u4f9b\u5e94\u94fe\u5c55\u677f' }
    ]
  },
  {
    id: 'strong-chain',
    type: 'image',
    title: '\u505a\u5f3a\u4ea7\u4e1a\u94fe',
    images: [
      { src: `${INVESTMENT_PROMO_ASSET_BASE}/strong-chain.webp`, alt: '\u505a\u5f3a\u4ea7\u4e1a\u94fe\u5c55\u677f' }
    ]
  }
]
```

- [ ] **Step 2: Add `InvestmentPromoSpecialContent` after `IndustryIntroSpecialContent`**

```jsx
function InvestmentPromoSpecialContent({ activeAnchor, onJumpAnchor }) {
  return (
    <div className="hd-special-section-layout hd-special-section-layout--industry-intro hd-special-section-layout--investment-promo">
      <aside className="hd-special-anchor-menu">
        <div className="hd-special-anchor-menu__inner">
          <div className="hd-special-anchor-cover hd-special-anchor-cover--promo">
            <div className="hd-special-anchor-cover__overlay">
              <span>{'\u62db\u5546\u5ba3\u4f20'}</span>
            </div>
          </div>
          {INVESTMENT_PROMO_STATIC_SECTIONS.map((section, index) => {
            const anchorKey = `investment-promo-${section.id}`
            const isActive = activeAnchor === anchorKey || (!activeAnchor && index === 0)
            return (
              <a
                key={anchorKey}
                href={`#${anchorKey}`}
                className={`hd-special-anchor-item${isActive ? ' is-active' : ''}`}
                onClick={(event) => onJumpAnchor(event, anchorKey)}
              >
                <span className="hd-left-item-dot" />
                <span>{section.title}</span>
              </a>
            )
          })}
        </div>
      </aside>

      <main className="hd-special-content hd-special-content--poster hd-special-content--investment-promo">
        <header className="hd-special-header">
          <span className="hd-special-header__eyebrow">{'\u4e13\u9898\u5c55\u793a'}</span>
          <h2>{'\u62db\u5546\u5ba3\u4f20'}</h2>
        </header>
        {INVESTMENT_PROMO_STATIC_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={`investment-promo-${section.id}`}
            className={`hd-special-content-section hd-special-poster-section${section.type === 'video' ? ' hd-special-video-section' : ''}`}
          >
            <h2>{section.title}</h2>
            {section.type === 'video' ? (
              <div className="hd-special-promo-video-wrap">
                <video
                  className="hd-special-promo-video"
                  src={section.src}
                  controls
                  preload="metadata"
                >
                  {'\u60a8\u7684\u6d4f\u89c8\u5668\u4e0d\u652f\u6301\u89c6\u9891\u64ad\u653e'}
                </video>
              </div>
            ) : (
              <div className="hd-special-poster-list">
                {section.images.map((image) => (
                  <img
                    key={image.src}
                    className="hd-special-poster-image"
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Route `investment-promo` to the new component**

Change `SpecialSectionContent` from:

```jsx
function SpecialSectionContent({ tree, activeAnchor, onJumpAnchor, sectionKey }) {
  if (sectionKey === 'industry-intro') {
    return <IndustryIntroSpecialContent activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} />
  }
```

To:

```jsx
function SpecialSectionContent({ tree, activeAnchor, onJumpAnchor, sectionKey }) {
  if (sectionKey === 'industry-intro') {
    return <IndustryIntroSpecialContent activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} />
  }
  if (sectionKey === 'investment-promo') {
    return <InvestmentPromoSpecialContent activeAnchor={activeAnchor} onJumpAnchor={onJumpAnchor} />
  }
```

- [ ] **Step 4: Run focused test and verify GREEN for rendering logic**

Run:

```bash
cd frontend
npm test -- src/tests/module-detail-special-template.test.jsx --reporter verbose
```

Expected: both tests in `module-detail-special-template.test.jsx` pass.

---

### Task 3: Add investment-promo styles

**Files:**
- Modify: `frontend/src/styles/historic.css`

- [ ] **Step 1: Add styles after `.hd-special-poster-image`**

```css
.hd-special-section-layout--investment-promo .hd-special-anchor-cover--promo {
  background: linear-gradient(135deg, #0968c5 0%, #16a4e6 100%);
}

.hd-special-section-layout--investment-promo .hd-special-anchor-cover--promo::before {
  content: "";
  position: absolute;
  inset: 18px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  border-radius: 10px;
}

.hd-special-content--investment-promo .hd-special-video-section {
  padding-bottom: 38px;
}

.hd-special-promo-video-wrap {
  width: 92%;
  margin: 0 auto;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(9, 114, 203, 0.14), rgba(54, 177, 232, 0.24));
  box-shadow: 0 10px 26px rgba(42, 86, 160, 0.14);
}

.hd-special-promo-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
  border: none;
  border-radius: 10px;
  background: #063b80;
  object-fit: contain;
}
```

- [ ] **Step 2: Add mobile adjustments inside the existing `@media (max-width: 1100px)` block**

Add this near the other special-section responsive rules:

```css
  .hd-special-promo-video-wrap {
    width: 94%;
    padding: 8px;
  }
```

- [ ] **Step 3: Run focused test after CSS change**

Run:

```bash
cd frontend
npm test -- src/tests/module-detail-special-template.test.jsx --reporter verbose
```

Expected: tests remain passing.

---

### Task 4: Prepare static media assets

**Files:**
- Create directory: `frontend/public/home-industry/investment-promo/`
- Create: `frontend/public/home-industry/investment-promo/promo-video.mp4`
- Create: `frontend/public/home-industry/investment-promo/supply-chain.webp`
- Create: `frontend/public/home-industry/investment-promo/strong-chain.webp`

- [ ] **Step 1: Create target directory and copy the video**

Run from repo root:

```powershell
New-Item -ItemType Directory -Force -Path 'frontend/public/home-industry/investment-promo' | Out-Null
Copy-Item -LiteralPath '2/家居产业宣传视频.mp4' -Destination 'frontend/public/home-industry/investment-promo/promo-video.mp4' -Force
```

- [ ] **Step 2: Convert the PNG posters to WebP using Python Pillow**

Run from repo root:

```powershell
$script = @"
from PIL import Image
from pathlib import Path

pairs = [
    (Path('2/图片 14.png'), Path('frontend/public/home-industry/investment-promo/supply-chain.webp')),
    (Path('2/图片 15.png'), Path('frontend/public/home-industry/investment-promo/strong-chain.webp')),
]

for source, target in pairs:
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image.save(target, 'WEBP', quality=82, method=6)
        print(f'{source} -> {target} {image.width}x{image.height}')
"@
Set-Content -Path '.tmp/convert-investment-promo-assets.py' -Value $script -Encoding UTF8
python '.tmp/convert-investment-promo-assets.py'
```

Expected output includes both conversions and reports `2667x1500` for each image.

- [ ] **Step 3: Verify target assets exist**

Run:

```powershell
Get-ChildItem -Path 'frontend/public/home-industry/investment-promo' | Select-Object Name, Length | Format-Table -AutoSize
```

Expected files:

```text
promo-video.mp4
supply-chain.webp
strong-chain.webp
```

---

### Task 5: Run full verification

**Files:**
- No code changes beyond prior tasks.

- [ ] **Step 1: Run frontend tests**

```bash
cd frontend
npm test
```

Expected: all frontend test files pass.

- [ ] **Step 2: Run frontend build**

```bash
cd frontend
npm run build
```

Expected: build exits with code 0. Existing Vite chunk-size warning is acceptable.

- [ ] **Step 3: Run backend tests**

```bash
cd backend
npm test
```

Expected: all backend test files pass.

- [ ] **Step 4: Check git status**

```bash
git status --short
```

Expected: changed files include only the planned frontend page/style/test files and new `frontend/public/home-industry/investment-promo/` assets, plus any pre-existing unrelated working-tree files already present before this plan.

---

### Task 6: Optional documentation sync check

**Files:**
- Maybe modify: `docs/PROJECT_CONTEXT.md`

- [ ] **Step 1: Decide whether project context needs an update**

This task changes static front-end rendering and public assets only. It does not change tech stack, commands, interfaces, backend schema, or data compatibility rules. `docs/PROJECT_CONTEXT.md` already documents that `industry-intro` and `investment-promo` use special templates. Therefore no context update is required unless the implementation introduces a new reusable asset convention beyond this plan.

- [ ] **Step 2: If no context update is needed, leave `docs/PROJECT_CONTEXT.md` unchanged**

No command is required for this step.
