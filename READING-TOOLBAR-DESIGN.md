# Reading Context Toolbar — Visual Mock Documentation

## Overview

A lightweight, calm toolbar that sits at the top of the reading content pane. This toolbar **complements** the existing text-selection popover by handling **context and state**, not actions.

---

## Visual Hierarchy

The toolbar is organized into three visual zones, left to right:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Mode Selector]        [Layer Toggles]        [Passive Indicators]     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Left Zone: Reading Mode Selector
**Purpose:** Indicate current reading context/mindset

**Visual Treatment:**
- Segmented control with 3 modes: Focus | Study | Review
- Subtle gray background (`bg-neutral-50`)
- Active mode has white background with soft shadow
- Inactive modes are muted gray text
- Small pill-style buttons with rounded corners
- No bright colors or accents

**Why this works:**
- Sets the reading "mode" without interrupting flow
- Visual only — does not trigger behavior in this mock
- Feels like a state indicator, not a command center

---

### Center Zone: Layer Visibility Toggles
**Purpose:** Show/hide passive visual layers in the reading area

**Visual Treatment:**
- Small icon + text labels: "Show: [Highlights] [Notes] [Unclear]"
- Eye icons (open = visible, closed/muted = hidden)
- Neutral gray when active, very light gray when off
- Hover adds subtle background
- No borders, no buttons — just clickable text regions

**Layers included:**
1. **Highlights** — Toggle visibility of all highlighted text
2. **Notes** — Toggle visibility of inline note markers
3. **Unclear** — Toggle visibility of "unclear" markers the user has added

**Why this works:**
- These are passive overlays, not actions
- User controls what they see while reading
- Does not duplicate "add highlight" or "create note" — those live in the popover
- Feels like a control panel for the reading surface itself

---

### Right Zone: Passive Reading Indicators
**Purpose:** Provide calm, informational feedback

**Visual Treatment:**
- Small pill badges with counts: "3 unclear" or "5 highlights"
- Very subtle background (off-white or no background)
- Muted text color
- Tabular numbers for consistency
- Non-interactive — purely informational

**Examples:**
- "3 unclear" — Tells you there are 3 sections you've marked as unclear
- "5 highlights in this chapter" — Context-aware count

**Why this works:**
- Gives gentle orientation without demanding attention
- Not clickable, not actionable — just feedback
- Helps user understand their progress and state

---

## Design Constraints Applied

### Low Visual Weight
- Thin borders (1px, `border-neutral-100`)
- Neutral gray palette only
- Small text (text-xs)
- Generous spacing between elements
- Backdrop blur for subtle layering without heaviness

### No Bright Accents
- No blue, purple, green primary colors
- No "primary" button styles
- No gradients or strong shadows
- White, grays, and soft shadows only

### Secondary to Content
- Toolbar height: ~40px (very compact)
- Does not draw the eye
- Fades into the background
- Supports reading; does not compete with it

---

## What This Toolbar Does NOT Include

❌ **Highlight button** — That's in the text-selection popover
❌ **Ask AI button** — That's in the text-selection popover
❌ **Add note button** — That's in the text-selection popover
❌ **Create flashcard button** — That's in the text-selection popover
❌ **Dropdown menus** — Too heavy, too interactive
❌ **Settings or preferences** — Belongs elsewhere
❌ **Search or navigation** — Different concern

---

## Relationship to Text Selection Popover

### The Popover = Actions on Selected Text
When the user **selects text**, a popover appears with:
- Highlight (with color picker)
- Ask AI
- Add note
- Create flashcard
- Explain

**These are immediate actions on the selection.**

### The Toolbar = Reading Context & State
The toolbar shows:
- What mode you're in (Focus/Study/Review)
- What layers are visible (Highlights/Notes/Unclear)
- Passive feedback (3 unclear, 5 highlights)

**These are global reading states, not selection-based actions.**

---

## Why This Division Works

1. **No duplication** — Toolbar and popover have completely separate concerns
2. **No confusion** — Actions live in popover, state lives in toolbar
3. **Calm experience** — Toolbar is always visible but never demands attention
4. **Reading flow** — You don't need to select text to understand your context

---

## Visual Affordances

### Mode Selector
- **Affordance:** Looks like a segmented control
- **Signal:** One mode is "active" (white background)
- **Expectation:** Clicking changes mode (in a real implementation)

### Layer Toggles
- **Affordance:** Icon + text, hover background appears
- **Signal:** Eye open = visible, eye closed = hidden
- **Expectation:** Clicking toggles layer visibility

### Passive Indicators
- **Affordance:** Static pill badges
- **Signal:** Just a number + label, no hover state
- **Expectation:** None — purely informational

---

## Typography & Spacing

- **Font size:** `text-xs` (11-12px) — small and calm
- **Font weight:** Medium for active elements, normal for muted
- **Line height:** Compact, single-line
- **Padding:** Generous around elements (2-3x the text height)
- **Gap between zones:** 4-6 spacing units

---

## Color Palette

| Element | Color | Purpose |
|---------|-------|---------|
| Toolbar background | `bg-white/80` with `backdrop-blur-sm` | Subtle layering |
| Border | `border-neutral-100` | Very light separation |
| Active mode | `bg-white text-neutral-900` | Clear but not loud |
| Inactive mode | `text-neutral-500` | Recedes into background |
| Layer toggle (on) | `text-neutral-600` | Visible but calm |
| Layer toggle (off) | `text-neutral-300` | Very muted |
| Indicators | `text-neutral-400` or `bg-neutral-50` | Pure information |

---

## Accessibility Notes (Visual Mock Only)

In a real implementation:
- Mode selector would be a radio group or tabs
- Layer toggles would be checkboxes with proper aria-labels
- Indicators would have descriptive text for screen readers
- Keyboard navigation would follow left-to-right tab order

---

## Summary

This toolbar is a **context bar**, not an **action bar**.

- It shows where you are (mode)
- It controls what you see (layers)
- It gives you feedback (indicators)
- It never interrupts your reading
- It never duplicates the text-selection popover

The result: a calm, informative reading environment where the toolbar supports you without demanding attention.
