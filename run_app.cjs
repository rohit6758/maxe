const { execSync } = require('child_process');
const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
app.use(express.static('dist'));

const server = app.listen(3000, async () => {
  console.log('Server running on 3000');
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });

    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.toString());
    });

    console.log('Navigating to http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Check if error boundary rendered
    const text = await page.content();
    if (text.includes('Something went wrong')) {
      console.log('Error boundary is visible on screen.');
    }
    
    await browser.close();
  } catch(e) {
    console.error('Puppeteer error', e);
  } finally {
    server.close();
  }
});
