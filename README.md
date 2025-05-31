# SJC Case Database - Static Site

This is a static version of the SJC Case Database that can be hosted on GitHub Pages.

## Files Structure

- `index.html` - Main search interface
- `case.html` - Individual case detail page
- `assets/css/style.css` - Stylesheet
- `assets/js/app.js` - JavaScript functionality
- `data/cases.json` - Main database export
- `data/cases/` - Individual case files

## Hosting on GitHub Pages

1. Create a new repository on GitHub
2. Upload all files from this directory
3. Go to Settings → Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Your site will be available at `https://yourusername.github.io/repositoryname`

## Features

- Full-text search across all case fields
- Advanced filtering by presbytery, type, disposition, year, and tags
- Tag-based filtering with visual chips
- Responsive design for mobile devices
- Individual case detail pages
- No server required - pure client-side JavaScript

## Data Updates

To update the database:
1. Run the Flask application locally
2. Use the extraction script to add new cases
3. Run the converter script again to regenerate static files
4. Replace the files in your GitHub repository

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
