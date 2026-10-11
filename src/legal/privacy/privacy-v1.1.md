# Privacy Policy

**Version:** 1.1  
**Effective date:** October 1, 2026  
**Last updated:** October 1, 2026

## 1. Overview

This Privacy Policy explains how **Edu Trainer** and its family task-management features (the **"Service"**) collect, use, store, and disclose information.

The Service is designed around adult-managed households. A **PRIMARY** account is for an adult account owner. An adult owner may create **SECONDARY** accounts for children or other dependent household members.

This policy describes the current Service implementation. It does not mean that every feature described below is enabled for every user.

## 2. Information We Collect

### Adult account information

When an adult creates or uses a PRIMARY account, the Service may collect:

- email address and username;
- password, stored only as a one-way password hash;
- email-verification and password-reset information;
- locale and household settings;
- confirmation that the account owner is at least 18 years old;
- versions and timestamps of accepted Terms of Service and acknowledged/accepted Privacy Policy;
- household membership, role, invitations, and subscription/feature-entitlement information.

We do not use date of birth to verify adult age in the current implementation.

### Child and dependent account information

An adult household owner may create a SECONDARY account. Depending on what the adult provides, the Service may store:

- username and password hash;
- first name, last name, or display name;
- locale;
- emoji/avatar selection and profile color;
- household membership and role;
- assigned chores and routines;
- task status, completion history, and optional notes;
- stars, rewards, redemption history, and related activity;
- shared-list activity;
- English Coach conversations, feedback, and usage information when that feature is used.

The current child-profile model does **not** require a child email address, date of birth, home address, phone number, school, or uploaded profile photo.

### Household and user-created content

Users may create information such as:

- household name and settings;
- chores, routines, descriptions, schedules, and recurrence rules;
- task-completion and approval notes;
- rewards and reward notes;
- shared lists, sections, and list items;
- imported family-task templates;
- English Coach messages and feedback.

Free-text fields may contain personal information that users choose to enter. Users should avoid entering sensitive personal information that is not necessary for the Service.

### AI and audio information

If English Coach or Task Coach features are used, the Service may process:

- English Coach messages and conversation context;
- English-learning level and lesson mode;
- microphone audio submitted for transcription;
- text submitted for text-to-speech;
- task titles, descriptions, status, schedules, star values, and limited task-history context used to generate Task Coach guidance;
- model and token-usage metadata returned by the AI provider.

Task Coach prompts are designed not to require a child's name or email, but the task information sent to the AI provider may still relate to a child.

### Authentication and technical information

The Service may automatically process:

- user and tenant identifiers;
- authentication-token and refresh-session information;
- login and failed-login information;
- IP address for rate limiting and security;
- request, error, and operational timestamps;
- application and server logs containing resource identifiers and, in some flows, email addresses or error details.

The current implementation does not intentionally use advertising identifiers, browser fingerprinting, or third-party behavioral-advertising SDKs.

### Browser storage and cookies

The Service currently uses browser storage and cookies for functionality, including:

- an access token stored in browser `localStorage`;
- a secure, HttpOnly refresh-token cookie;
- a sidebar-state cookie;
- theme, favorites, recent-feature information, and feature preferences;
- English Coach and Task Coach preferences and session references.

## 3. How We Use Information

We use information to:

- create and authenticate accounts;
- verify email addresses and reset passwords;
- create and manage households and household roles;
- allow adults to create and manage child/dependent accounts;
- assign and track chores, routines, lists, stars, and rewards;
- provide English Coach and Task Coach functionality;
- localize the Service and schedule household activities;
- send verification, invitation, password-reset, and other service emails;
- maintain subscriptions or feature entitlements;
- prevent abuse, rate-limit requests, and protect account security;
- maintain required legal-consent records;
- operate, troubleshoot, and improve the Service.

We do not use the current Service to serve targeted advertising.

## 4. Children and Dependent Accounts

PRIMARY accounts are intended for adults age 18 or older.

An adult household owner may create a SECONDARY account only for a child or dependent for whom the adult is authorized to create and manage an account.

**The current Service does not yet implement a verifiable parental-consent system for children under 13. Therefore, children under 13 should not use the Service or have a SECONDARY login enabled until that consent mechanism is implemented.**

If we learn that personal information from a child under 13 has been collected without legally required parental consent, we will take reasonable steps to stop the collection and address deletion or other required action.

A parent or guardian should supervise a minor's use of the Service and should not provide more child information than is reasonably necessary.

## 5. How We Disclose Information

We disclose information only as needed to operate the Service, provide requested features, protect the Service, or comply with law.

### OpenAI

The Service uses OpenAI services for certain AI features.

Depending on the feature used, OpenAI may receive:

- English Coach text and conversation context;
- submitted audio for transcription;
- text for generated speech;
- child-related task context used by Task Coach.

Users should not submit unnecessary sensitive information to AI features.

### Email provider

The configured SMTP/email provider receives information needed to deliver email, such as:

- recipient email address;
- subject;
- verification or password-reset code;
- household invitation information;
- invitation or service links.

### Telegram

If Telegram Web App login or linking is used, Telegram provides signed identity information such as Telegram user ID, name, username, language, and related Telegram profile information.

### Hosting, database, and operational providers

Application information is stored in PostgreSQL and may be processed by infrastructure, database-hosting, server-hosting, backup, and operational-log providers used to run the Service.

The exact production providers, locations, backup periods, and operational-log retention may depend on the deployment environment.

## 6. Sale, Advertising, and Cross-Site Tracking

The current application does not contain a payment-data broker, advertising network, or third-party behavioral-analytics SDK, and we do not sell personal information or use it for cross-context behavioral advertising.

Because the current Service does not perform cross-site behavioral tracking, browser "Do Not Track" signals do not change how the Service operates.

Where applicable law requires recognition of another privacy preference signal, we will honor that requirement.

## 7. Data Retention

Retention depends on the type of information and the feature used.

Current automated retention behavior includes:

- English Coach sessions are automatically removed after the configured short retention period; the current implementation purges all such sessions approximately one day after creation;
- a user-deleted English Coach session may remain briefly in a restorable state before hard deletion;
- expired refresh sessions are cleaned up automatically;
- verification codes may be replaced or removed when consumed.

For most household, child-profile, task, reward, invitation, Telegram, legal-acceptance, and operational-log data, the current application does not yet implement a fixed time-based deletion period.

We retain such information only for purposes connected with operating the Service, maintaining security and legal records, resolving disputes, or satisfying legal obligations, and we intend to establish more specific retention periods as the Service matures.

Backups and copies maintained by infrastructure or service providers may remain for their applicable retention periods.

## 8. Access, Correction, and Deletion

Depending on the account and feature, users can currently:

- update certain child/dependent profile information;
- delete a child/dependent profile, subject to technical relationships with other stored data;
- update or delete certain chores, routines, rewards, lists, and messages;
- delete English Coach sessions and messages as supported by the feature;
- reset an adult password;
- log out and revoke authentication sessions.

The current Service does **not** yet provide a self-service PRIMARY-account deletion feature or a complete privacy-data export workflow.

Where applicable law provides rights to access, correct, or delete personal information, requests may be submitted using the privacy/support contact information published with the Service. Some information may be retained where required or permitted by law, for security, fraud prevention, dispute resolution, or maintenance of legal-consent records.

## 9. Security

The current Service uses security measures including:

- BCrypt password hashing;
- signed authentication tokens;
- secure HttpOnly refresh-token cookies;
- refresh-session rotation and revocation;
- role- and tenant-based authorization checks;
- rate limiting and failed-login protections;
- database constraints and tenant-scoped access controls;
- Telegram signature verification when Telegram login is used.

No method of transmission or storage is completely secure. This policy does not claim security measures that are not established by the Service's production environment, such as a specific encryption-at-rest or backup-security configuration.

## 10. International and Third-Party Processing

The Service and its providers may process information in locations different from the user's location. The exact production hosting and provider locations depend on the deployed environment.

Third-party providers operate under their own service terms and privacy practices.

## 11. Changes to This Policy

We may update this Privacy Policy when the Service, data practices, providers, or legal requirements change.

Each published version has a version number and effective date. When a change requires renewed acknowledgement or consent, the Service may require the applicable user to review the updated policy before continuing.

## 12. Contact

Questions, privacy requests, or concerns should be submitted using the support or privacy contact information published with the Service or by its operator.

If no privacy contact method is available in the deployed Service, the Service should not be treated as production-ready for collection of personal information.
