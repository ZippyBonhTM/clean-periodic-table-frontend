# Article Editor Architecture

## Status

Required — Core Editor Definition

This document defines the architecture, behavior, rendering pipeline, and operational rules for the Article Editor.

The editor is one of the most sensitive parts of the system because it handles:

* User input
* Markdown content
* Image uploads
* Draft state
* Publishing workflow

If implemented incorrectly, it can introduce:

* Security vulnerabilities
* Data corruption
* Performance issues
* UX instability

This document prevents those failures.

---

# 1. Editor Philosophy

The editor must be:

* Predictable
* Stable
* Safe
* Recoverable
* Responsive

The editor must assume:

* User interruptions
* Network failures
* Partial saves
* Invalid input
* Large content

The editor must never assume:

User behavior is correct.

---

# 2. Core Editor Responsibilities

The editor must support:

* Markdown editing
* Live preview
* Image uploads
* Hashtag management
* Draft saving
* Publishing workflow
* Visibility selection

These are mandatory.

---

# 3. Editor Layout Model

The editor UI must include:

---

## Title Input

Required:

* Single-line input
* Max length enforcement
* Slug preview generation

Title must be:

Human readable.

---

## Markdown Editing Area

Required:

* Large editing area
* Scrollable
* Syntax-friendly

Must support:

* Headings
* Lists
* Links
* Images
* Code blocks

Must not support:

Raw HTML in MVP.

---

## Live Preview Panel

Required:

* Real-time rendering
* Sanitized rendering
* Safe rendering pipeline

Preview must:

Match final rendering behavior.

Never:

Render unsafe HTML.

---

## Metadata Panel

Must support:

* Visibility selection
* Hashtag entry
* Cover image selection
* Excerpt input

---

## Action Controls

Must include:

* Save Draft
* Publish
* Unpublish

Optional:

Preview Mode toggle.

---

# 4. Markdown Rendering Pipeline

Rendering must follow:

1 — Input Markdown
2 — Parse Markdown
3 — Convert to HTML
4 — Sanitize HTML
5 — Render Preview

This pipeline must be identical between:

Frontend preview
Backend rendering

Rendering inconsistencies cause:

Security risks.

---

# 5. Markdown Storage Model

The system must store:

Raw Markdown.

Not:

Rendered HTML only.

---

## Why Store Markdown

Markdown allows:

* Re-rendering later
* Theme changes
* Rendering updates
* Future format support

Rendered HTML may optionally be cached.

---

# 6. Image Upload Integration

Image upload must integrate directly into editor workflow.

---

## Upload Workflow

Required:

1 — User selects image
2 — Editor requests upload token
3 — Backend validates request
4 — Signed upload URL returned
5 — File uploaded directly
6 — Markdown updated with image URL

Backend must:

Never proxy file uploads.

---

## Image Placement

Images must be inserted as:

Markdown image links.

Example concept:

![alt-text](image-url)

Editor must automatically generate:

Safe URLs.

---

# 7. Draft Management Model

Drafts are required.

Users must be able to:

Save incomplete work.

---

## Draft Storage Rules

Drafts must:

Be stored in database.

Not:

Only in browser memory.

---

## Auto-Save Requirement

Auto-save must exist.

Recommended interval:

30–60 seconds.

Auto-save must:

Not overwrite published versions.

---

## Draft Recovery

If user session fails:

Draft must remain available.

Never:

Lose user content silently.

---

# 8. Publishing Workflow

Publishing must be controlled.

Never automatic.

---

## Publish Action

Publishing must:

Validate content.

Check:

* Title exists
* Markdown exists
* Visibility selected

If validation fails:

Block publishing.

---

## Publish Result

Publishing must:

Set:

status = published
published_at = current timestamp

Draft remains editable.

---

## Unpublish Action

Unpublishing must:

Set:

status = archived
or
status = draft

Never delete automatically.

---

# 9. Hashtag Entry System

Hashtags improve discovery.

---

## Hashtag Rules

Hashtags must:

* Be normalized
* Be lowercase
* Remove invalid characters

Maximum recommended:

10 hashtags per article.

Too many hashtags harm performance.

---

## Hashtag Input Behavior

Editor must support:

* Tag suggestions
* Duplicate prevention
* Manual entry

---

# 10. Visibility Selection

Visibility determines access.

---

## Allowed Values

public
private

---

## Visibility Behavior

Public articles:

Appear in feed.

Private articles:

Visible only to owner.

---

# 11. Slug Generation Model

Slug must be generated from:

Title.

---

## Slug Rules

Slug must:

* Be URL-safe
* Be unique
* Be normalized

If slug conflict occurs:

Append suffix.

---

## Slug Editing

Optional in MVP.

If enabled:

Must validate uniqueness.

---

# 12. Preview Performance Requirements

Preview must be:

Fast.

---

## Performance Rules

Preview rendering must:

Avoid blocking UI.

Large content must:

Render incrementally.

---

## Preview Failure Handling

If preview fails:

Editor must remain usable.

Never:

Crash UI.

---

# 13. Editor Error Handling

Errors must be:

Recoverable.

---

## Required Error Cases

Handle:

* Upload failure
* Save failure
* Network loss
* Rendering failure

Errors must:

Display clear messages.

Never silently fail.

---

# 14. Content Validation Rules

Before publishing:

Content must be validated.

---

## Required Validation

Check:

* Title length
* Markdown existence
* Image count limits
* Hashtag limits

---

## Optional Validation

Check:

* Minimum content length
* Markdown complexity

---

# 15. Editor State Management

Editor state must be:

Stable.

---

## Required States

Draft
Saving
Saved
Publishing
Published
Error

UI must reflect:

Current state.

---

# 16. Editor Performance Risks

Editor performance must remain stable.

---

## Dangerous Patterns

Do not:

Render entire document repeatedly
Trigger excessive re-renders
Block UI thread

---

## Required Optimizations

Use:

Debounced preview rendering.

---

# 17. Accessibility Requirements

Editor must support:

Accessible interaction.

---

## Accessibility Requirements

Support:

Keyboard navigation
Focus management
Screen reader compatibility

Accessibility improves:

Usability and reliability.

---

# 18. Critical Mistakes That Must Never Happen

These mistakes are forbidden.

---

## Editor Mistakes

Do not:

Store unsanitized content
Allow raw HTML injection
Upload files through backend proxy
Lose unsaved content
Block UI during rendering

---

## UX Mistakes

Do not:

Auto-publish drafts
Hide errors
Overwrite published content automatically

---

# 19. Testing Requirements

Editor must be tested.

---

## Required Tests

Test:

Draft saving
Publishing
Preview rendering
Upload workflow
Slug generation
Visibility switching

---

# 20. Editor Design Philosophy

The editor must be:

Reliable
Recoverable
Secure
Predictable

Not:

Fragile
Implicit
Unsafe

---

# End of Document
