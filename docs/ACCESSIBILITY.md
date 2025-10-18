# Accessibility Checklist

CareLoop is committed to WCAG 2.2 Level AA compliance. This checklist ensures all features meet accessibility standards.

## General Requirements

### Perceivable

#### Text Alternatives
- [ ] All images have descriptive alt text
- [ ] Decorative images use `alt=""` or `aria-hidden="true"`
- [ ] Icons have accessible labels via `aria-label` or `sr-only` text
- [ ] Form inputs have associated labels

#### Multimedia
- [ ] Video/audio content has captions/transcripts (if applicable)
- [ ] Call recordings include transcripts

#### Adaptable
- [ ] Content structure uses semantic HTML (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`)
- [ ] Headings follow logical hierarchy (h1 → h2 → h3)
- [ ] Lists use `<ul>`, `<ol>`, `<dl>` appropriately
- [ ] Tables use `<thead>`, `<tbody>`, proper headers
- [ ] Forms use `<fieldset>` and `<legend>` for groups

#### Distinguishable
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text (18pt+)
- [ ] Color is not the only means of conveying information
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] No content flashes more than 3 times per second

### Operable

#### Keyboard Accessible
- [ ] All interactive elements are keyboard-accessible
- [ ] Tab order is logical and predictable
- [ ] Focus indicators are clearly visible
- [ ] No keyboard traps
- [ ] Skip navigation links provided
- [ ] Keyboard shortcuts don't conflict with assistive tech

#### Enough Time
- [ ] No time limits on form completion (or can be extended)
- [ ] Auto-updating content can be paused/stopped
- [ ] Session timeout warnings with extension option

#### Seizures and Physical Reactions
- [ ] No content flashes more than 3 times/second
- [ ] Motion can be disabled via `prefers-reduced-motion`

#### Navigable
- [ ] Page titles are descriptive
- [ ] Focus order is meaningful
- [ ] Link purpose is clear from text or context
- [ ] Multiple ways to find pages (search, navigation, sitemap)
- [ ] Current location is indicated (breadcrumbs, active nav)

#### Input Modalities
- [ ] Touch targets are at least 44×44px
- [ ] Gestures have keyboard alternatives
- [ ] Pointer cancellation supported (can cancel click)

### Understandable

#### Readable
- [ ] Page language declared (`<html lang="en">`)
- [ ] Language changes marked up (`lang` attribute)
- [ ] Unusual words/jargon explained or defined

#### Predictable
- [ ] Navigation is consistent across pages
- [ ] Components behave consistently
- [ ] Focus doesn't cause unexpected context changes
- [ ] Forms don't auto-submit on field completion

#### Input Assistance
- [ ] Form errors are clearly identified
- [ ] Labels and instructions provided for inputs
- [ ] Error suggestions provided when possible
- [ ] Errors can be corrected and reviewed before submission
- [ ] Confirmation for financial/legal/data transactions

### Robust

#### Compatible
- [ ] Valid HTML (no unclosed tags, duplicate IDs)
- [ ] ARIA used correctly (roles, states, properties)
- [ ] Status messages announced to screen readers
- [ ] Progressive enhancement (works without JavaScript)

## Component-Specific Checks

### Navigation
- [ ] `<nav>` landmark with `aria-label` for multiple navs
- [ ] Current page indicated with `aria-current="page"`
- [ ] Dropdown menus keyboard-navigable
- [ ] Mobile menu has accessible toggle button

### Buttons & Links
- [ ] Button vs. link used appropriately (action vs. navigation)
- [ ] Icon-only buttons have `aria-label`
- [ ] Disabled state announced (`aria-disabled`)
- [ ] Loading state announced (`aria-busy`)

### Forms
- [ ] Every input has a `<label>` or `aria-label`
- [ ] Required fields marked with `aria-required="true"`
- [ ] Error messages linked via `aria-describedby`
- [ ] Field format/constraints explained
- [ ] Autocomplete attributes used where appropriate

### Modals/Dialogs
- [ ] `role="dialog"` with `aria-labelledby` and `aria-describedby`
- [ ] Focus trapped within modal when open
- [ ] Focus returns to trigger on close
- [ ] ESC key closes modal
- [ ] Backdrop dismisses modal (optional but common)

### Calendar
- [ ] Calendar grid uses proper ARIA grid pattern
- [ ] Selected date announced
- [ ] Arrow keys navigate dates
- [ ] Month/year selection keyboard-accessible
- [ ] Events can be selected and activated via keyboard
- [ ] Drag operations have keyboard alternative

### Tables
- [ ] `<th>` elements with `scope="col"` or `scope="row"`
- [ ] Complex tables use `id`/`headers` association
- [ ] Sortable columns have `aria-sort` attribute
- [ ] Row selection uses `aria-selected`

### Notifications/Toasts
- [ ] Use `role="alert"` for urgent messages
- [ ] Use `role="status"` for non-critical updates
- [ ] Persistent notifications can be dismissed
- [ ] Auto-dismiss has sufficient time to read

### Loading States
- [ ] Loading spinners use `aria-live="polite"`
- [ ] Skeleton screens announce loading state
- [ ] Progress indicators use `role="progressbar"`

## Page-Specific Checks

### Home Page
- [ ] Hero section has proper heading hierarchy
- [ ] KPI cards have descriptive labels
- [ ] Live status strip updates announced
- [ ] Action items are keyboard-navigable
- [ ] Patient search has autocomplete/suggestions

### Calendar Page
- [ ] Time slots are keyboard-navigable
- [ ] Drag-drop has keyboard alternative
- [ ] Appointment details panel keyboard-accessible
- [ ] Filters can be operated with keyboard
- [ ] View switcher (Day/Week/Month) is accessible

### Patient Profile
- [ ] Sensitive data masking is consistent
- [ ] Tabs are keyboard-navigable with arrow keys
- [ ] Expandable sections use `aria-expanded`
- [ ] Financial data has currency formatting

## Testing Checklist

### Manual Testing
- [ ] Navigate entire site with keyboard only
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Zoom text to 200% and verify usability
- [ ] Test with high contrast mode enabled
- [ ] Verify all interactive elements have visible focus
- [ ] Test with reduced motion enabled

### Automated Testing
- [ ] Run axe DevTools scan (0 violations)
- [ ] Run Lighthouse accessibility audit (score ≥ 95)
- [ ] Validate HTML with W3C validator
- [ ] Check color contrast with Contrast Checker

### Screen Reader Testing Matrix
| Browser | Screen Reader | Status |
|---------|--------------|--------|
| Chrome  | NVDA         | [ ]    |
| Firefox | NVDA         | [ ]    |
| Safari  | VoiceOver    | [ ]    |
| Edge    | JAWS         | [ ]    |

## ARIA Patterns Used

### Live Regions
\`\`\`html
<!-- Status updates -->
<div role="status" aria-live="polite">
  Insurance verified for patient
</div>

<!-- Urgent alerts -->
<div role="alert" aria-live="assertive">
  Emergency appointment needed
</div>
\`\`\`

### Disclosure (Expandable Sections)
\`\`\`html
<button aria-expanded="false" aria-controls="details-panel">
  Show Details
</button>
<div id="details-panel" hidden>
  <!-- Content -->
</div>
\`\`\`

### Combobox (Search with Autocomplete)
\`\`\`html
<input
  role="combobox"
  aria-autocomplete="list"
  aria-controls="suggestions-list"
  aria-expanded="false"
/>
<ul id="suggestions-list" role="listbox">
  <!-- Options -->
</ul>
\`\`\`

### Tabs
\`\`\`html
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">
    Demographics
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">
    Clinical
  </button>
</div>
<div role="tabpanel" id="panel-1">
  <!-- Content -->
</div>
\`\`\`

## PHI & Privacy Considerations

- [ ] Sensitive data masked in screenshots/recordings
- [ ] Screen reader announces masked data appropriately
- [ ] Confirmation required before exposing masked data
- [ ] Audit log captures all "view sensitive" actions
- [ ] Role-based access enforced client-side and server-side

## Resources

- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd)

## Sign-Off

- [ ] Development team reviewed checklist
- [ ] Manual testing completed
- [ ] Automated testing passed
- [ ] Screen reader testing completed
- [ ] Accessibility audit approved
- [ ] Ready for production
