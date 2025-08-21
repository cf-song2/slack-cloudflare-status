# Cloudflare Status Monitor for ICN (Seoul)

A Cloudflare Worker that monitors Cloudflare's status API for:
- ICN (Seoul) components status (every 6 hours)
- Unresolved incidents (every hour)

When issues are detected, notifications are sent to a configured Slack webhook.

## Features

- **Automated Monitoring**: Uses Cloudflare Workers' cron triggers to check status at regular intervals
- **ICN (Seoul) Focus**: Filters component status to focus only on ICN (Seoul) related components
- **Slack Integration**: Sends formatted notifications to Slack when issues are detected
- **Manual Triggers**: Provides HTTP endpoints to manually trigger status checks

## Setup Instructions

### 1. Configure Slack Webhook

1. Create a Slack app and enable Incoming Webhooks
2. Create a webhook URL for your desired Slack channel
3. Add the webhook URL as a secret to your Worker:

```bash
npx wrangler secret put SLACK_WEBHOOK_URL
```

When prompted, paste your Slack webhook URL.

### 2. Deploy the Worker

```bash
npm run deploy
```

## API Endpoints

- `/` - Status page showing that the monitor is running
- `/check/components` - Manually trigger an ICN components status check
- `/check/incidents` - Manually trigger an unresolved incidents check

## Project Structure

```
src/
├── api/
│   └── cloudflareStatus.js  # API client for Cloudflare Status API
├── config/
│   └── constants.js         # Configuration constants
├── notifications/
│   └── slack.js             # Slack notification functionality
└── index.js                 # Main worker entry point
```

## Customization

- To modify the scan intervals, update the cron expressions in `wrangler.jsonc` and `src/config/constants.js`
- To change the ICN keywords, edit the `ICN_KEYWORDS` array in `src/config/constants.js`
- To customize Slack notifications, modify the formatting functions in `src/notifications/slack.js`

## Local Development

```bash
npm run start
```

This starts a local development server at http://localhost:8787.
