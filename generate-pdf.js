const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * StyledPages PDF Generator
 * Generates PDFs with exact visual fidelity using Puppeteer
 */
class StyledPagesPDFGenerator {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    /**
     * Initialize Puppeteer browser
     */
    async init() {
        console.log('🚀 Initializing Puppeteer browser...');
        
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        this.page = await this.browser.newPage();
        
        // Set viewport for consistent rendering
        await this.page.setViewport({
            width: 1200,
            height: 800,
            deviceScaleFactor: 2 // Higher DPI for better quality
        });

        console.log('✅ Browser initialized successfully');
    }

    /**
     * Generate PDF from HTML file
     * @param {string} htmlFilePath - Path to the HTML file
     * @param {string} outputPath - Output path for the PDF
     * @param {Object} options - PDF generation options
     */
    async generatePDF(htmlFilePath, outputPath, options = {}) {
        try {
            console.log(`📄 Loading HTML file: ${htmlFilePath}`);
            
            // Read HTML file
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            
            // Set content with proper base URL for fonts
            await this.page.setContent(htmlContent, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            // Wait for fonts to load
            console.log('⏳ Waiting for fonts to load...');
            await this.page.evaluate(() => {
                return document.fonts.ready;
            });

            // Additional wait for any dynamic content
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Get page dimensions from CSS variables
            const pageDimensions = await this.page.evaluate(() => {
                const preview = document.querySelector('.pdf-preview');
                if (!preview) return { width: '8.5in', height: '11in' };
                
                const computedStyle = window.getComputedStyle(preview);
                return {
                    width: computedStyle.getPropertyValue('--page-width') || '8.5in',
                    height: computedStyle.getPropertyValue('--page-height') || '11in'
                };
            });

            console.log('📐 Page dimensions:', pageDimensions);

            // Generate PDF with exact settings
            const pdfOptions = {
                path: outputPath,
                format: 'Letter', // Will be overridden by width/height
                width: pageDimensions.width,
                height: pageDimensions.height,
                printBackground: true, // CRITICAL: This ensures colors and backgrounds are printed
                margin: {
                    top: '0in',
                    right: '0in',
                    bottom: '0in',
                    left: '0in'
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                ...options
            };

            console.log('🎨 Generating PDF with options:', pdfOptions);

            // Generate the PDF
            const pdf = await this.page.pdf(pdfOptions);

            console.log(`✅ PDF generated successfully: ${outputPath}`);
            console.log(`📊 PDF size: ${(pdf.length / 1024).toFixed(2)} KB`);

            return pdf;

        } catch (error) {
            console.error('❌ Error generating PDF:', error);
            throw error;
        }
    }

    /**
     * Generate PDF with custom content
     * @param {string} content - HTML content to convert
     * @param {string} outputPath - Output path for the PDF
     * @param {Object} options - PDF generation options
     */
    async generatePDFFromContent(content, outputPath, options = {}) {
        try {
            console.log('📝 Generating PDF from content...');
            
            // Set content
            await this.page.setContent(content, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });

            // Wait for fonts to load
            await this.page.evaluate(() => {
                return document.fonts.ready;
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generate PDF
            const pdfOptions = {
                path: outputPath,
                format: 'Letter',
                printBackground: true,
                margin: {
                    top: '0in',
                    right: '0in',
                    bottom: '0in',
                    left: '0in'
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                ...options
            };

            const pdf = await this.page.pdf(pdfOptions);
            console.log(`✅ PDF generated successfully: ${outputPath}`);
            return pdf;

        } catch (error) {
            console.error('❌ Error generating PDF from content:', error);
            throw error;
        }
    }

    /**
     * Generate a standalone PDF with embedded content
     * @param {string} content - Markdown or HTML content
     * @param {string} outputPath - Output path for the PDF
     * @param {Object} styling - Styling options
     */
    async generateStandalonePDF(content, outputPath, styling = {}) {
        try {
            console.log('🎨 Generating standalone PDF...');

            // Create standalone HTML with embedded styles
            const standaloneHTML = this.createStandaloneHTML(content, styling);

            await this.generatePDFFromContent(standaloneHTML, outputPath);

        } catch (error) {
            console.error('❌ Error generating standalone PDF:', error);
            throw error;
        }
    }

    /**
     * Create standalone HTML with embedded styles and fonts
     * @param {string} content - Content to embed
     * @param {Object} styling - Styling options
     */
    createStandaloneHTML(content, styling = {}) {
        const {
            titleFont = 'Inter',
            headerFont = 'Inter',
            bodyFont = 'Inter',
            titleColor = '#1e293b',
            headerColor = '#1e293b',
            bodyColor = '#1e293b',
            accentColor = '#3b82f6',
            titleSize = 32,
            headerSize = 24,
            bodySize = 14,
            marginTop = 1,
            marginBottom = 1,
            marginLeft = 1,
            marginRight = 1,
            textAlignment = 'left',
            lineSpacing = 1.5,
            pageSize = 'letter'
        } = styling;

        const pageDimensions = {
            letter: { width: '8.5in', height: '11in' },
            a4: { width: '210mm', height: '297mm' },
            legal: { width: '8.5in', height: '14in' },
            tabloid: { width: '11in', height: '17in' }
        };

        const dimensions = pageDimensions[pageSize] || pageDimensions.letter;

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StyledPages Document</title>
    
    <!-- Embedded Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;600;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Georgia:wght@400;700&display=swap" rel="stylesheet">
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        @page {
            size: ${pageSize === 'a4' ? 'A4' : 'Letter'};
            margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in;
        }

        body {
            font-family: '${bodyFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: ${bodySize}px;
            line-height: ${lineSpacing};
            color: ${bodyColor};
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        .pdf-content {
            width: ${dimensions.width};
            min-height: ${dimensions.height};
            margin: 0 auto;
            padding: 0;
            background: white;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h1 {
            font-family: '${titleFont}', sans-serif;
            font-size: ${titleSize}px;
            color: ${titleColor};
            font-weight: 700;
            margin: 0 0 1.5rem 0;
            padding: 0 0 0.5rem 0;
            border-bottom: 3px solid ${accentColor};
            line-height: 1.2;
            text-align: ${textAlignment};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h2 {
            font-family: '${headerFont}', sans-serif;
            font-size: ${headerSize}px;
            color: ${headerColor};
            font-weight: 600;
            margin: 2rem 0 1rem 0;
            padding: 0;
            line-height: 1.3;
            text-align: ${textAlignment};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        h3 {
            font-family: '${headerFont}', sans-serif;
            font-size: ${headerSize * 0.8}px;
            color: ${headerColor};
            font-weight: 500;
            margin: 1.5rem 0 0.75rem 0;
            padding: 0;
            line-height: 1.4;
            text-align: ${textAlignment};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        p {
            font-family: '${bodyFont}', sans-serif;
            color: ${bodyColor};
            font-size: ${bodySize}px;
            line-height: ${lineSpacing};
            margin: 0 0 1rem 0;
            padding: 0;
            text-align: ${textAlignment};
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        ul, ol {
            font-family: '${bodyFont}', sans-serif;
            margin: 1rem 0;
            padding: 0 0 0 1.5rem;
            list-style: none;
            text-align: ${textAlignment};
        }

        li {
            color: ${bodyColor};
            font-size: ${bodySize}px;
            line-height: 1.6;
            margin: 0 0 0.5rem 0;
            padding: 0;
            position: relative;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        li::before {
            content: "•";
            color: ${accentColor};
            font-weight: bold;
            position: absolute;
            left: -1rem;
        }

        strong {
            font-weight: 600;
            color: ${titleColor};
        }

        em {
            font-style: italic;
            color: ${headerColor};
        }

        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white !important;
            }
        }
    </style>
</head>
<body>
    <div class="pdf-content">
        ${this.parseMarkdownToHTML(content)}
    </div>
</body>
</html>`;
    }

    /**
     * Parse markdown content to HTML
     * @param {string} content - Markdown content
     */
    parseMarkdownToHTML(content) {
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(2));
                html += `<h1>${headerText}</h1>`;
            } else if (line.startsWith('## ')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(3));
                html += `<h2>${headerText}</h2>`;
            } else if (line.startsWith('### ')) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(4));
                html += `<h3>${headerText}</h3>`;
            } else if (line.startsWith('- ')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const listText = this.processInlineFormatting(line.substring(2));
                html += `<li>${listText}</li>`;
            } else if (line.length > 0) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const paragraphText = this.processInlineFormatting(line);
                html += `<p>${paragraphText}</p>`;
            } else {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (html && !html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>')) {
                    html += '<br>';
                }
            }
        }
        
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }

    /**
     * Process inline formatting (bold, italic)
     * @param {string} text - Text to process
     */
    processInlineFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    /**
     * Close browser
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 Browser closed');
        }
    }
}

/**
 * Main function to generate PDF
 */
async function main() {
    const generator = new StyledPagesPDFGenerator();
    
    try {
        await generator.init();
        
        // Get command line arguments
        const args = process.argv.slice(2);
        const htmlFile = args[0] || 'index-optimized.html';
        const outputFile = args[1] || 'output.pdf';
        
        console.log(`📁 Input file: ${htmlFile}`);
        console.log(`📁 Output file: ${outputFile}`);
        
        // Check if input file exists
        if (!fs.existsSync(htmlFile)) {
            throw new Error(`Input file not found: ${htmlFile}`);
        }
        
        // Generate PDF
        await generator.generatePDF(htmlFile, outputFile);
        
        console.log('🎉 PDF generation completed successfully!');
        
    } catch (error) {
        console.error('💥 Error:', error.message);
        process.exit(1);
    } finally {
        await generator.close();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = StyledPagesPDFGenerator;
