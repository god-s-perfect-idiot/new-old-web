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
function removeJavaScript(html) {
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
        const cleanHtml = removeJavaScript(html);
        
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

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 