# StyledPages PDF Generator

A Node.js solution for generating PDFs with exact visual fidelity from HTML/CSS pages using Puppeteer.

## Features

- ✅ **Exact Visual Fidelity**: PDFs look identical to browser preview
- ✅ **Embedded Fonts**: Google Fonts are properly embedded and rendered
- ✅ **Color Preservation**: All colors, backgrounds, and styling preserved
- ✅ **Print-Optimized CSS**: Special CSS rules for perfect PDF generation
- ✅ **Customizable Styling**: Support for custom fonts, colors, and layouts
- ✅ **Multiple Page Sizes**: Letter, A4, Legal, Tabloid support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate PDF from HTML File

```bash
# Generate PDF from the optimized HTML file
node generate-pdf.js index-optimized.html output.pdf

# Or use npm script
npm run generate-pdf
```

### 3. Generate PDF with Custom Content

```javascript
const StyledPagesPDFGenerator = require('./generate-pdf.js');

async function generateCustomPDF() {
    const generator = new StyledPagesPDFGenerator();
    
    try {
        await generator.init();
        
        // Generate PDF with custom content and styling
        await generator.generateStandalonePDF(
            `# My Document
            
            ## Introduction
            
            This is a **beautiful** document with *custom* styling.
            
            - First point
            - Second point
            - Third point`,
            'my-document.pdf',
            {
                titleFont: 'Playfair Display',
                headerFont: 'Montserrat',
                bodyFont: 'Inter',
                titleColor: '#2d3748',
                headerColor: '#4a5568',
                bodyColor: '#2d3748',
                accentColor: '#3182ce',
                titleSize: 36,
                headerSize: 28,
                bodySize: 16,
                textAlignment: 'left',
                lineSpacing: 1.6,
                pageSize: 'letter'
            }
        );
        
    } finally {
        await generator.close();
    }
}

generateCustomPDF();
```

## File Structure

```
StyledPages/
├── index.html                 # Original HTML file
├── index-optimized.html       # Optimized HTML with embedded styles
├── styles.css                 # CSS with print-specific rules
├── script.js                  # Original JavaScript
├── generate-pdf.js            # Puppeteer PDF generator
├── package.json               # Node.js dependencies
└── README.md                  # This file
```

## Key Features Explained

### 1. Print Color Adjustment

The CSS includes critical print-specific rules:

```css
* {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
}
```

This ensures all colors and backgrounds are preserved in the PDF.

### 2. Embedded Fonts

Google Fonts are properly loaded and embedded:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### 3. Print Media Queries

Special `@media print` rules ensure perfect PDF rendering:

```css
@media print {
    .pdf-preview {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background: white !important;
        box-shadow: none !important;
        border: none !important;
    }
}
```

## API Reference

### StyledPagesPDFGenerator

#### Methods

- `init()` - Initialize Puppeteer browser
- `generatePDF(htmlFilePath, outputPath, options)` - Generate PDF from HTML file
- `generatePDFFromContent(content, outputPath, options)` - Generate PDF from HTML content
- `generateStandalonePDF(content, outputPath, styling)` - Generate PDF with custom styling
- `close()` - Close browser instance

#### Options

```javascript
const options = {
    format: 'Letter',           // Page format
    printBackground: true,      // Print backgrounds (CRITICAL)
    margin: {
        top: '0in',
        right: '0in',
        bottom: '0in',
        left: '0in'
    },
    preferCSSPageSize: true,    // Use CSS page size
    displayHeaderFooter: false  // Hide header/footer
};
```

#### Styling Options

```javascript
const styling = {
    titleFont: 'Inter',         // Font for titles
    headerFont: 'Inter',        // Font for headers
    bodyFont: 'Inter',          // Font for body text
    titleColor: '#1e293b',      // Title color
    headerColor: '#1e293b',     // Header color
    bodyColor: '#1e293b',       // Body text color
    accentColor: '#3b82f6',     // Accent color
    titleSize: 32,              // Title font size (px)
    headerSize: 24,             // Header font size (px)
    bodySize: 14,               // Body font size (px)
    marginTop: 1,               // Top margin (inches)
    marginBottom: 1,            // Bottom margin (inches)
    marginLeft: 1,              // Left margin (inches)
    marginRight: 1,             // Right margin (inches)
    textAlignment: 'left',      // Text alignment
    lineSpacing: 1.5,           // Line height multiplier
    pageSize: 'letter'          // Page size (letter, a4, legal, tabloid)
};
```

## Troubleshooting

### Fonts Not Rendering

1. Ensure Google Fonts are properly loaded
2. Wait for fonts to load before generating PDF
3. Check network connectivity

### Colors Not Preserved

1. Verify `printBackground: true` is set
2. Check CSS includes `-webkit-print-color-adjust: exact`
3. Ensure `@media print` rules are properly defined

### Layout Issues

1. Check page dimensions match your requirements
2. Verify margins are set correctly
3. Ensure CSS variables are properly defined

## Browser Compatibility

- Chrome/Chromium (recommended)
- Edge
- Firefox (limited support)

## License

MIT License - feel free to use in your projects!
