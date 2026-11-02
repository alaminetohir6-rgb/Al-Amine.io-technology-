# Al-Amine.io Internal AI — starter foundation

**Brand:** Al-Amine.io  
**Heading/tagline:** TECHNOLOGY FOR ALL

This is a separate starter project for the private operations system. It is not the live Al-Amine.io website. Keep the existing website repository unchanged while this project is developed and tested.

## Included
- Express server and basic private owner dashboard
- SQLite storage for orders and activity
- Token-protected order intake endpoint
- Owner approval and payment-review endpoints
- Optional WhatsApp Cloud API notification adapter
- Meta webhook verification/signature checks
- Basic smoke tests

## Not included yet
- A connected AI model (the current AI adapter deliberately sends work to owner review)
- Live WhatsApp setup or verified WhatsApp business number
- AI telephone receptionist, inbound call answering, or call transfer
- Payment gateway, document-generation pipeline, production hosting, or integration with the public website

Do not advertise these unfinished capabilities as active services.

## Requirements
- Node.js 20 or newer
- A recent npm version

## Setup
1. Extract this folder.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env` and replace every example secret.
5. Run `npm test`.
6. Run `npm start`.
7. Open `http://localhost:3000`.

The starter owner login is configured using `OWNER_USERNAME` and `OWNER_PASSWORD` in `.env`. Change both before running, and never commit `.env`.

## API
- `POST /api/orders` — requires `Authorization: Bearer <INTERNAL_API_TOKEN>`
- `POST /api/owner/login` — owner login
- `POST /api/owner/logout` — logout
- `GET /api/owner/summary` — private summary
- `GET /api/owner/orders` — private order list
- `GET /api/owner/activity` — private activity
- `POST /api/owner/orders/:id/approve` — mark an order approved
- `POST /api/owner/orders/:id/payment-review` — record payment review

## WhatsApp
Set `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `OWNER_WHATSAPP_TO` in `.env` to enable owner notifications through the Meta WhatsApp Cloud API. This is an optional adapter, not a completed customer-facing WhatsApp integration.

## Security and production
This is a development foundation, not production-ready. Before public deployment, add a managed session store, CSRF protection, stronger account recovery and access controls, audit logging, backups, monitoring, rate-limit tuning, secret management, HTTPS, privacy/retention controls, and a security review. Never store payment-card details. Verify payment through a trusted provider before releasing paid deliverables.

## Telephone receptionist plan
The intended workflow can be added as a separate voice integration: AI answers inbound calls, explains services, collects order details, and—when a caller asks for the owner—checks owner availability and offers a live transfer. If the owner is unavailable, it records a callback request. This requires a telephony provider, a voice AI provider, an owner handoff endpoint/phone number, and explicit testing. None of this is active in this starter.
