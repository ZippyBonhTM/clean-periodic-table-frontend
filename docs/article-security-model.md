# Article Security Model

## Status

Required — Core Security Definition

This document defines the **mandatory security model** for the Article System.

All implementations must follow these rules.

Security is not optional.
Security is not postponed.
Security is part of the system design from the beginning.

This document focuses on:

* Content security
* Upload security
* Access control
* SSRF prevention
* XSS prevention
* Abuse prevention
* Data protection

---

# 1. Security Philosophy

The system must be:

* Secure by default
* Defensive by design
* Minimal in trust assumptions
* Resistant to misuse

The system must assume:

**User input is always untrusted.**

Always.

No exceptions.

---

# 2. Core Threat Model

This system must assume attackers may attempt:

* XSS injection
* SSRF attacks
* File upload abuse
* Markdown injection
* Access bypass
* Content scraping
* Rate abuse
* Private content exposure
* Enumeration attacks

Security design must consider these threats as **expected behavior**, not edge cases.

---

# 3. Markdown Security Model

Markdown content is **dangerous by default**.

Markdown must be:

**Sanitized before rendering**

Never render raw Markdown directly into HTML without sanitization.

---

## Allowed Markdown Elements

The following elements are allowed:

* Headings
* Paragraphs
* Lists
* Links
* Images
* Quotes
* Code blocks
* Bold
* Italic

---

## Forbidden Markdown Features

The following must be blocked:

* Raw HTML
* script tags
* iframe tags
* object tags
* embed tags
* inline JavaScript
* event attributes
* style injection
* unknown HTML attributes

Raw HTML support is **forbidden in MVP**.

---

## Required Markdown Pipeline

Markdown rendering must follow:

1 — Parse Markdown
2 — Convert to HTML
3 — Sanitize HTML
4 — Store or render

Never:

Render unsanitized content.

---

## XSS Prevention Rules

The renderer must:

* Escape all unsafe content
* Remove dangerous tags
* Strip unsafe attributes
* Block inline JavaScript

Never allow:

* onClick
* onLoad
* style injection
* javascript: URLs

---

# 4. Image Upload Security

Image uploads are a major attack surface.

All uploads must be treated as hostile until validated.

---

## Required Upload Flow

Uploads must use:

**Signed Upload URLs**

Workflow:

1 — Client requests upload token
2 — Backend validates permissions
3 — Backend generates signed upload URL
4 — Client uploads file directly
5 — Backend records metadata

Backend must not directly handle large file uploads.

---

## Allowed File Types

Only allow:

* PNG
* JPEG
* WebP

Block:

* SVG
* GIF (optional — recommended block in MVP)
* PDF
* Any executable content

SVG is dangerous due to embedded script risks.

Block SVG unless fully sanitized.

---

## File Validation Requirements

Every file must be validated for:

* MIME type
* File extension
* File size
* Binary signature

Never trust:

File extension alone.

---

## File Size Limits

Recommended limits:

* Max file size: 5MB
* Max resolution: defined per project policy

Large files increase:

* Cost
* Attack surface
* Processing time

---

## File Naming Rules

Files must:

* Use generated random filenames
* Never use user-provided names
* Avoid predictable naming

Example:

uuid + extension

---

# 5. SSRF Prevention Model

SSRF (Server Side Request Forgery) is a critical risk.

This system must be SSRF-resistant by design.

---

## Forbidden Behavior

The system must never:

* Fetch user-provided URLs
* Download remote files
* Proxy arbitrary URLs
* Resolve unknown hostnames

These actions are prohibited.

---

## Remote Import Policy

Remote content import is:

**Not allowed in MVP**

If added later, it must be:

* Isolated in worker
* IP restricted
* DNS restricted
* Timeout limited
* Size limited

Never implement remote import in main API.

---

# 6. Access Control Model

Authorization must always be server-side.

Never trust client logic.

---

## Visibility Rules

Article visibility:

public
private

Public articles:

* Accessible by anyone

Private articles:

* Accessible only to owner
* Must be verified server-side

---

## Authorization Checks

Every read must verify:

* Authentication
* Ownership
* Visibility rules

Never allow:

Direct ID access without verification.

---

## ID Strategy

Article IDs must be:

Non-sequential.

Use:

UUID.

Never use:

Auto-increment IDs for public access resources.

Sequential IDs enable enumeration attacks.

---

# 7. Authentication Requirements

Authentication must support:

* Secure sessions
  or
* Token-based authentication

Sessions must:

* Expire
* Be revocable

Tokens must:

* Have expiration
* Be signed
* Be validated on each request

---

# 8. Rate Limiting

Rate limiting is mandatory.

Without it, abuse becomes trivial.

---

## Required Rate Limits

Apply limits to:

* Article creation
* Article editing
* Upload requests
* Feed requests
* Search requests
* Login attempts

---

## Abuse Prevention Targets

Rate limiting protects against:

* DoS
* Spam
* Enumeration
* Resource exhaustion

---

# 9. Private Content Protection

Private content is a high-risk area.

---

## Required Protections

Private articles must:

* Require authentication
* Require authorization
* Never be cached publicly

Never expose:

Private URLs to public caches.

---

## Cache Safety

Public content may be cached.

Private content must not be cached in:

* Public CDN
* Shared edge cache

---

# 10. Data Exposure Risks

Sensitive data must never leak.

---

## Forbidden Data Exposure

Never expose:

* Internal file paths
* Storage bucket structure
* Internal service URLs
* System configuration

---

## Error Handling Rules

Errors must:

Return generic messages.

Never return:

Stack traces
Internal debugging details

---

# 11. Logging Security

Logs must not leak sensitive information.

---

## Logging Must Not Include:

* Passwords
* Tokens
* Private content
* Raw uploaded data

---

## Logging Should Include:

* Request metadata
* Error identifiers
* Operation outcomes

---

# 12. Security Testing Requirements

Security must be tested regularly.

---

## Required Tests

Test:

* Markdown injection
* XSS injection
* Upload abuse
* Rate abuse
* Access bypass
* Authorization failures

Security testing must be part of development workflow.

---

# 13. Dependency Security

Dependencies must be controlled.

---

## Required Rules

Before adding dependencies:

* Validate necessity
* Check maintenance status
* Review security history

Avoid:

Unmaintained packages.

---

## Updates

Dependencies must be:

Regularly updated.

Security patches must be applied quickly.

---

# 14. Backup and Recovery Security

Data loss is a security risk.

---

## Required Backup Strategy

Database must:

* Be backed up regularly
* Support recovery

Backups must:

* Be encrypted
* Be stored securely

---

# 15. Critical Mistakes That Must Never Happen

These mistakes are forbidden.

---

## Dangerous Security Mistakes

Do not:

* Render raw HTML
* Fetch external URLs
* Trust client-side validation
* Accept unrestricted uploads
* Skip authorization checks
* Use sequential IDs
* Log sensitive data

These mistakes can compromise the system.

---

# 16. Security Responsibility Rules

Security is everyone's responsibility.

Not just backend.

Not just infrastructure.

Every developer must:

* Validate inputs
* Respect access rules
* Follow upload restrictions
* Respect rate limits

---

# 17. Security Review Requirement

Every major change must include:

Security impact analysis.

Before merging changes, verify:

* No new attack surface introduced
* No validation bypass created
* No new public exposure created

---

# 18. Security Incident Response

If a vulnerability is discovered:

1 — Stop affected feature
2 — Investigate scope
3 — Patch vulnerability
4 — Validate fix
5 — Restore operation

Never ignore security alerts.

---

# 19. Security Design Philosophy

Security must be:

Proactive
Layered
Minimal
Defensive

Not:

Reactive
Optional
Delayed

---

# End of Document
