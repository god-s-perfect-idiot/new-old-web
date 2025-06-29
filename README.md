# 🌐 New Old Web

A web application that renders websites without JavaScript, allowing you to experience the web as it was meant to be - fast, simple, and accessible.

## Features

- **JavaScript Removal**: Automatically strips all JavaScript from websites
- **Server-Side Rendering**: Fetches and processes websites on the server
- **Modern UI**: Beautiful, responsive interface with gradient backgrounds
- **Example URLs**: Quick access to popular websites for testing
- **Error Handling**: Graceful error handling with user-friendly messages
- **Security**: Built with security best practices using Helmet.js

## What Gets Removed

- All `<script>` tags and their contents
- Event handlers (onclick, onload, onsubmit, etc.)
- JavaScript URLs in href and src attributes
- Any inline JavaScript code

## Installation

1. Navigate to the project directory:
   ```bash
   cd new-old-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and go to `http://localhost:3000`

## Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## How It Works

1. **User Input**: Enter a website URL in the input field
2. **Server Fetch**: The server fetches the website using Axios
3. **JavaScript Removal**: Cheerio parses the HTML and removes all JavaScript
4. **Rendering**: The cleaned HTML is displayed in an iframe
5. **Result**: You see the website without any JavaScript functionality

## API Endpoints

### POST /api/render
Renders a website without JavaScript.

**Request Body:**
```json
{
  "url": "example.com"
}
```

**Response:**
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "originalUrl": "https://example.com"
}
```

## Dependencies

- **Express**: Web server framework
- **Axios**: HTTP client for fetching websites
- **Cheerio**: Server-side jQuery for HTML parsing
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security middleware

## Use Cases

- **Performance Testing**: See how websites perform without JavaScript
- **Accessibility**: Experience websites with screen readers
- **Security**: Browse without potential JavaScript-based attacks
- **Learning**: Understand how websites work without modern JavaScript frameworks
- **Legacy Support**: Access websites that don't work with JavaScript disabled

## Browser Compatibility

This application works best in modern browsers that support:
- ES6+ JavaScript
- Fetch API
- Blob URLs
- CSS Grid and Flexbox

## Security Considerations

- The application uses Helmet.js for security headers
- CORS is enabled for cross-origin requests
- User input is validated before processing
- Timeout limits prevent hanging requests

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this project for any purpose. 