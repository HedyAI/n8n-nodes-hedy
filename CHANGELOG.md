# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-16

### Added
- Session Context resource with full CRUD operations:
  - Create Context: Create a new session context with title, content, and default flag
  - Get Context: Retrieve a specific session context by ID
  - Get Many Contexts: List all session contexts
  - Update Context: Modify title, content, or default status
  - Delete Context: Remove a session context
- `SessionContext` type definition for TypeScript support
- `ContextLimitExceeded` error code with user-friendly upgrade message for free tier users
- Multi-line text input for context content field (supports up to 20,000 characters)

### Changed
- This is the first release with write operations (create, update, delete) - all previous operations were read-only

## [1.1.1] - 2025-01-14

### Fixed
- Added pairedItem linking to all returnData items for proper workflow item tracking in n8n cloud
- Ensures n8n can correctly track data lineage through complex workflows

## [1.1.0] - 2025-01-09

### Added
- Topics resource with three operations:
  - Get Topic: Retrieve a specific topic by ID
  - Get Many Topics: List all available topics  
  - Get Topic Sessions: Get all sessions associated with a specific topic
- Client-side pagination for endpoints that don't support server-side limits:
  - `/topics` endpoint
  - `/todos` endpoint
  - `/topics/{id}/sessions` endpoint
  - `/sessions/{id}/todos` endpoint

### Fixed
- Webhook signature verification now handles missing signing secrets gracefully
- Improved error messages for webhook registration failures
- Signature verification defaults to disabled for easier testing
- HTTPS requirement relaxed for localhost webhook URLs
- Fixed confusing authentication test success/error message
- Limit parameter now works correctly for all resources (client-side when API doesn't support it)

### Changed
- Removed HTTP Request node option to avoid confusion (users should use dedicated Hedy nodes)
- Credential display name simplified from "Hedy API" to "Hedy"
- Added Hedy logo to both action and trigger nodes

## [1.0.0] - 2025-01-09

### Added
- Initial release of n8n-nodes-hedy
- Hedy Trigger node with webhook support for:
  - Session Created events
  - Session Ended events
  - Highlight Created events
  - Todo Exported events
- Hedy action node with operations for:
  - Get Session / Get Many Sessions
  - Get Highlight / Get Many Highlights
  - Get Many Todos / Get Todos by Session
- API key authentication
- Webhook signature verification for security
- Pagination support for list operations
- Zapier format compatibility option
- Comprehensive error handling
- Example workflows for common use cases
- Full TypeScript support
- Icon and branding

### Security
- HMAC SHA-256 webhook signature verification
- HTTPS-only webhook URLs required
- Secure credential storage using n8n's encryption

### Documentation
- Complete README with installation and usage instructions
- API data structure documentation
- Troubleshooting guide
- Example workflow templates

## [0.1.0] - 2025-01-08 (Pre-release)

### Added
- Project structure and configuration
- Basic node scaffolding
- TypeScript setup
- Development environment configuration

---

## Version Guidelines

### Version Numbering
- **Major (X.0.0)**: Breaking changes to node interface or API
- **Minor (0.X.0)**: New features, operations, or non-breaking enhancements
- **Patch (0.0.X)**: Bug fixes, documentation updates, dependency updates

### Upgrade Notes
When upgrading between major versions, please review the migration guide in the documentation.

[Unreleased]: https://github.com/HedyAI/n8n-nodes-hedy/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/HedyAI/n8n-nodes-hedy/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/HedyAI/n8n-nodes-hedy/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/HedyAI/n8n-nodes-hedy/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/HedyAI/n8n-nodes-hedy/releases/tag/v1.0.0
[0.1.0]: https://github.com/HedyAI/n8n-nodes-hedy/releases/tag/v0.1.0