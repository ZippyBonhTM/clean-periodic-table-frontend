# Article Storage and Media Architecture

## Status

Required — Media Storage Definition

This document defines the architecture used for storing, validating, serving, and managing media files, especially images used in articles.

Media handling is one of the highest-risk areas of the system because it affects:

* Security
* Cost
* Performance
* Storage growth
* Infrastructure stability

This document prevents unsafe or inefficient media handling.

---

# 1. Storage Philosophy

Media storage must be:

* Secure
* Scalable
* Cost-aware
* Isolated
* Predictable

Media must never be:

* Stored locally
* Stored inside containers
* Stored inside database blobs

Media must always be:

Stored in object storage.

---

# 2. Storage Architecture Overview

Media must be stored using:

Object Storage.

Examples of compatible storage:

* S3-compatible storage
* Cloud object storage
* Railway object storage
* External object storage provider

The backend must:

Never act as a file storage system.

---

# 3. Storage Directory Structure

Storage paths must be structured.

Never flat.

Recommended structure:

```
articles/
    {article_id}/
        images/
            {file_id}.jpg
```

Example:

```
articles/
    8a72-uuid/
        images/
            f193-uuid.jpg
```

This structure supports:

* Organization
* Cleanup
* Ownership tracking

---

# 4. File Naming Rules

File names must:

* Be generated automatically
* Be random
* Be unique

Never use:

User-provided file names.

Recommended format:

UUID + extension.

Example:

```
f193a1c2-uuid.jpg
```

This prevents:

* Naming collisions
* Enumeration attacks

---

# 5. Upload Architecture

Uploads must follow:

Signed URL model.

Backend must:

Never receive full file uploads directly.

---

## Upload Workflow

Step 1:

Client requests upload permission.

Endpoint:

POST /api/v1/uploads

---

Step 2:

Backend validates:

* Authentication
* Authorization
* Upload limits

---

Step 3:

Backend generates:

Signed upload URL.

Returns:

* upload_url
* public_file_url

---

Step 4:

Client uploads file:

Directly to storage.

Backend is bypassed.

---

Step 5:

Client confirms upload:

POST /api/v1/uploads/confirm

Backend records metadata.

---

# 6. File Validation Requirements

Every uploaded file must be validated.

Never trust:

File metadata from client.

---

## Required Validation

Validate:

* File size
* MIME type
* Extension
* Binary signature

Reject:

Invalid files.

---

## Allowed File Types

Allowed:

* image/jpeg
* image/png
* image/webp

Blocked:

* image/svg+xml
* application/pdf
* application/octet-stream
* video files
* executable files

SVG is dangerous and must be blocked in MVP.

---

## File Size Limits

Recommended:

Maximum file size:

5MB

Maximum image dimensions:

Defined by policy.

Large images increase:

* Cost
* Bandwidth
* Processing time

---

# 7. Image Optimization Strategy

Images must be optimized.

Unoptimized images increase cost.

---

## Required Optimizations

Apply:

* Resize large images
* Normalize format
* Remove metadata (EXIF)

Recommended formats:

* JPEG
* WebP

---

## Optimization Timing

Optimization must be:

Asynchronous.

Never block upload requests.

Use:

Worker system when available.

---

# 8. Public URL Strategy

Files must be accessible through:

Safe public URLs.

---

## URL Format

Public URL must follow:

Predictable pattern.

Example:

```
https://cdn.example.com/articles/{article_id}/images/{file_id}.jpg
```

---

## URL Exposure Rules

URLs must:

Be safe to expose publicly.

Never expose:

Internal storage identifiers.

---

# 9. Private Media Handling

Private articles must support private media.

---

## Private Media Rules

Private images must:

Require authentication.

Never expose:

Public URLs for private files.

---

## Access Strategy

Use:

Signed temporary URLs.

These URLs must:

Expire after short duration.

---

# 10. CDN Strategy

CDN usage is recommended.

Especially for:

Public images.

---

## CDN Benefits

CDN improves:

* Performance
* Latency
* Cost efficiency

Reduces:

Backend load.

---

## CDN Requirements

CDN must:

Cache public images.

Private images must:

Never be cached publicly.

---

# 11. Media Ownership Model

Media must belong to:

An article.

Never orphaned.

---

## Ownership Tracking

Metadata must store:

* file_id
* article_id
* author_id
* upload_time

This allows:

Cleanup.

---

# 12. Media Cleanup Strategy

Unused files must be removed.

Otherwise:

Storage grows uncontrollably.

---

## Cleanup Rules

Delete media when:

Article is deleted.

Or:

Image is removed from article.

Cleanup must be:

Scheduled.

---

# 13. Storage Cost Control

Storage cost must be monitored.

---

## Required Monitoring

Track:

* Total storage usage
* Monthly growth
* File count
* Upload rate

Unexpected growth indicates:

Abuse or leaks.

---

## Cost Reduction Strategy

Apply:

* Size limits
* Compression
* Cleanup policies

Without limits:

Storage cost grows indefinitely.

---

# 14. Security Rules

Media storage is a major attack vector.

Must be protected.

---

## Forbidden Behavior

Do not:

Fetch remote URLs
Proxy external images
Allow remote imports

These actions create:

SSRF vulnerabilities.

---

## Metadata Security

Never trust:

User-provided metadata.

Always validate:

Server-side.

---

# 15. Media Access Logging

Media access must be monitored.

---

## Logging Requirements

Log:

* Upload attempts
* Upload failures
* Access errors

Do not log:

Sensitive tokens.

---

# 16. Backup Strategy

Media must be backed up.

---

## Backup Requirements

Backup storage regularly.

Verify:

Recovery capability.

Backups must:

Be encrypted.

---

# 17. Media Performance Rules

Media must load quickly.

---

## Performance Requirements

Images must:

Be optimized.

Large images slow:

Page rendering.

---

## Lazy Loading Requirement

Frontend must:

Use lazy loading.

Prevents:

Unnecessary bandwidth usage.

---

# 18. Critical Mistakes That Must Never Happen

These mistakes are forbidden.

---

## Storage Mistakes

Do not:

Store files locally
Store files in database
Accept unrestricted uploads
Use predictable filenames

---

## Security Mistakes

Do not:

Allow SVG uploads
Allow executable uploads
Fetch remote URLs

---

## Cost Mistakes

Do not:

Allow unlimited uploads
Ignore storage growth
Store duplicate images

---

# 19. Media Testing Requirements

Media workflow must be tested.

---

## Required Tests

Test:

Upload flow
Validation failures
Private file access
Cleanup behavior
Optimization behavior

---

# 20. Media Design Philosophy

Media must be:

Safe
Efficient
Predictable
Maintainable

Not:

Unsafe
Unbounded
Ad-hoc

---

# End of Document
