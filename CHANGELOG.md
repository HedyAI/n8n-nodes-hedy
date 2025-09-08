# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/HedyAI/n8n-nodes-hedy/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/HedyAI/n8n-nodes-hedy/releases/tag/v1.0.0
[0.1.0]: https://github.com/HedyAI/n8n-nodes-hedy/releases/tag/v0.1.0