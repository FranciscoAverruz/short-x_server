# Short-X
**Link Shortening API**

  <img src="/src/assets/images/readmePics/bannerReadme.png" alt="Banner readme" width="900"><br>


This API allows you to shorten URLs and retrieve detailed statistics for them. It also provides real-time updates via WebSocket functionality, making it easier to monitor changes to URLs and user statistics as they happen.

## Key Features

- **Link Shortening**: Easily shorten long URLs for easier sharing.
- **URL Statistics**: Retrieve detailed analytics for each shortened URL, including clicks, views, and other relevant metrics.
- **Real-Time Updates**: Receive live notifications about updates to URL and user statistics using WebSocket.

## WebSocket Functionality

The API supports WebSocket connections for real-time updates. Below are the details:

- **WebSocket Server URL**: `ws://localhost:3000`

### Available Events:
- `urlStatsUpdated`: Triggered when statistics for a specific shortened URL are updated.
- `userStatsUpdated`: Triggered when a user’s statistics (e.g., link interactions, activity) are updated.