const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'self'", "blob:"],
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Function to remove JavaScript from HTML
function removeJavaScript(html, baseUrl) {
    const $ = cheerio.load(html);
    
    // Remove all script tags
    $('script').remove();
    
    // Remove onclick, onload, and other event handlers
    $('*').each(function() {
        const element = $(this);
        const attrs = element.attr();
        
        if (attrs) {
            Object.keys(attrs).forEach(attr => {
                if (attr.startsWith('on') || attr === 'javascript:') {
                    element.removeAttr(attr);
                }
            });
        }
    });
    
    // Remove javascript: URLs from href attributes
    $('a[href^="javascript:"]').removeAttr('href');
    
    // Remove javascript: URLs from src attributes
    $('img[src^="javascript:"]').removeAttr('src');
    
    // Remove any style attributes that contain javascript
    $('*').each(function() {
        const element = $(this);
        const style = element.attr('style');
        if (style && style.includes('javascript:')) {
            element.removeAttr('style');
        }
    });
    
    // Remove any data attributes that might contain JavaScript
    $('*').each(function() {
        const element = $(this);
        const attrs = element.attr();
        
        if (attrs) {
            Object.keys(attrs).forEach(attr => {
                if (attr.startsWith('data-') && attrs[attr] && attrs[attr].includes('javascript:')) {
                    element.removeAttr(attr);
                }
            });
        }
    });
    
    // Proxy external resources to avoid CORS issues
    $('link[rel="stylesheet"]').each(function() {
        const element = $(this);
        const href = element.attr('href');
        if (href && !href.startsWith('data:') && !href.startsWith('#')) {
            try {
                const absoluteUrl = new URL(href, baseUrl).href;
                const encodedUrl = encodeURIComponent(absoluteUrl);
                element.attr('href', `/proxy/${encodedUrl}`);
            } catch (e) {
                console.log('Failed to parse CSS URL:', href);
            }
        }
    });
    
    $('img[src]').each(function() {
        const element = $(this);
        const src = element.attr('src');
        if (src && !src.startsWith('data:') && !src.startsWith('#') && !src.startsWith('javascript:')) {
            try {
                const absoluteUrl = new URL(src, baseUrl).href;
                const encodedUrl = encodeURIComponent(absoluteUrl);
                element.attr('src', `/proxy/${encodedUrl}`);
            } catch (e) {
                console.log('Failed to parse image URL:', src);
            }
        }
    });
    
    // Modify links to work within our application
    $('a[href]').each(function() {
        const element = $(this);
        const href = element.attr('href');
        
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            try {
                // Resolve relative URLs to absolute URLs
                const absoluteUrl = new URL(href, baseUrl).href;
                // Only modify links that are external (same domain or different)
                const encodedUrl = encodeURIComponent(absoluteUrl);
                element.attr('href', `/view/${encodedUrl}`);
                element.attr('target', '_self'); // Open in same frame
            } catch (e) {
                // If URL parsing fails, keep original
                console.log('Failed to parse URL:', href);
            }
        }
    });
    
    // Add a meta tag to disable JavaScript in the iframe
    $('head').append('<meta http-equiv="Content-Security-Policy" content="script-src \'none\'; object-src \'none\';">');
    
    return $.html();
}

// Function to fetch and process a website
async function fetchWebsite(url) {
    try {
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        const html = response.data;
        const cleanHtml = removeJavaScript(html, url);
        
        return {
            success: true,
            html: cleanHtml,
            originalUrl: url
        };
    } catch (error) {
        console.error('Error fetching website:', error.message);
        return {
            success: false,
            error: error.message,
            originalUrl: url
        };
    }
}

// API endpoint to fetch and render a website
app.post('/api/render', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }
    
    const result = await fetchWebsite(url);
    res.json(result);
});

// Direct route to serve a cleaned website
app.get('/view/:encodedUrl', async (req, res) => {
    try {
        const encodedUrl = req.params.encodedUrl;
        const url = decodeURIComponent(encodedUrl);
        
        const result = await fetchWebsite(url);
        
        if (result.success) {
            res.setHeader('Content-Type', 'text/html');
            res.send(result.html);
        } else {
            res.status(400).send(`<h1>Error</h1><p>${result.error}</p>`);
        }
    } catch (error) {
        res.status(500).send(`<h1>Server Error</h1><p>${error.message}</p>`);
    }
});

// Proxy route to handle all external resources (CSS, images, etc.)
app.get('/proxy/:encodedUrl', async (req, res) => {
    try {
        const encodedUrl = req.params.encodedUrl;
        const url = decodeURIComponent(encodedUrl);
        
        const response = await axios.get(url, {
            timeout: 10000,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        // Set appropriate headers
        res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
        
        res.send(response.data);
    } catch (error) {
        console.error('Proxy error:', error.message);
        res.status(404).send('Resource not found');
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 