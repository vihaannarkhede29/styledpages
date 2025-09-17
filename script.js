// StyledPages - Content to PDF Converter
class StyledPages {
    constructor() {
        this.currentTheme = 'professional';
        this.titleFont = 'Inter';
        this.headerFont = 'Inter';
        this.bodyFont = 'Inter';
        this.titleColor = '#1e293b';
        this.headerColor = '#1e293b';
        this.bodyColor = '#1e293b';
        this.accentColor = '#3b82f6';
        this.titleSize = 32;
        this.headerSize = 24;
        this.bodySize = 14;
        this.marginTop = 1;
        this.marginBottom = 1;
        this.marginLeft = 1;
        this.marginRight = 1;
        console.log('Initial margins:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        this.textAlignment = 'left';
        this.titleAlignment = 'left';
        this.headerAlignment = 'left';
        this.bodyAlignment = 'left';
        
        // Detection patterns
        this.detectionPatterns = {
            title: "contains '–' or '—', starts with capital, length 5-100",
            header: "starts with number., short descriptive text, length 5-100",
            subheader: "short descriptive, no numbers, length 5-80",
            list: "starts with -, •, *, or indented"
        };
        this.lineSpacing = 1.5;
        this.pageSize = 'letter';
        this.sectionPageBreak = true;
        this.subsectionPageBreak = true;
        this.showPageNumbers = true;
        this.inputMode = 'markdown'; // 'plain' or 'markdown'
        this.geminiApiKey = 'AIzaSyDlYQ4Qi9OyazHxWm8WTdWV3bw6or09ry8';
        this.init();
    }

    async init() {
        this.bindEvents();
        this.applyThemePreset('professional');
        this.updateInputPlaceholder();
        this.syncInputModeRadio();
        this.testMarginFunctionality();
        
        // Automatically load demo content with custom styling
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            // Set custom font and colors for demo
            this.titleFont = 'Inter';
            this.headerFont = 'Inter';
            this.bodyFont = 'Inter';
            this.titleColor = '#1e293b';
            this.headerColor = '#1e293b';
            this.bodyColor = '#1e293b';
            this.accentColor = '#3b82f6';
            
            // Load demo content automatically
            await this.loadDemoContent();
            console.log('Demo content loaded automatically with custom styling');
        }
        
        // Delay preview update to ensure DOM is ready
        setTimeout(async () => {
            this.updatePreview();
            this.updateInputStats();
        }, 100);
    }
    
    testMarginFunctionality() {
        console.log('Testing margin functionality...');
        console.log('Current margins:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        console.log('Preview element:', document.getElementById('pdfPreview'));
    }
    
    createDraggableMarginLines() {
        const preview = document.getElementById('pdfPreview');
        if (!preview) return;
        
        // Remove existing margin lines
        const existingLines = preview.querySelectorAll('.margin-line');
        existingLines.forEach(line => line.remove());
        
        // Create draggable margin lines
        const topLine = document.createElement('div');
        topLine.className = 'margin-line top';
        topLine.setAttribute('data-side', 'top');
        
        const bottomLine = document.createElement('div');
        bottomLine.className = 'margin-line bottom';
        bottomLine.setAttribute('data-side', 'bottom');
        
        const leftLine = document.createElement('div');
        leftLine.className = 'margin-line left';
        leftLine.setAttribute('data-side', 'left');
        
        const rightLine = document.createElement('div');
        rightLine.className = 'margin-line right';
        rightLine.setAttribute('data-side', 'right');
        
        preview.appendChild(topLine);
        preview.appendChild(bottomLine);
        preview.appendChild(leftLine);
        preview.appendChild(rightLine);
        
        // Add drag functionality
        this.addDragFunctionality(topLine, 'top');
        this.addDragFunctionality(bottomLine, 'bottom');
        this.addDragFunctionality(leftLine, 'left');
        this.addDragFunctionality(rightLine, 'right');
    }
    
    addDragFunctionality(line, side) {
        let isDragging = false;
        let startY = 0;
        let startX = 0;
        let startMargin = 0;
        
        const handleMouseDown = (e) => {
            isDragging = true;
            line.classList.add('dragging');
            startY = e.clientY;
            startX = e.clientX;
            
            if (side === 'top') startMargin = this.marginTop;
            else if (side === 'bottom') startMargin = this.marginBottom;
            else if (side === 'left') startMargin = this.marginLeft;
            else if (side === 'right') startMargin = this.marginRight;
            
            e.preventDefault();
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const preview = document.getElementById('pdfPreview');
            const rect = preview.getBoundingClientRect();
            const scaleX = rect.width / (8.5 * 96); // Convert inches to pixels
            const scaleY = rect.height / (11 * 96);
            
            let deltaY = 0;
            let deltaX = 0;
            
            if (side === 'top' || side === 'bottom') {
                deltaY = (e.clientY - startY) / scaleY;
            } else {
                deltaX = (e.clientX - startX) / scaleX;
            }
            
            let newMargin = 0;
            if (side === 'top') {
                newMargin = Math.max(0, Math.min(2, startMargin + deltaY));
                this.marginTop = newMargin;
            } else if (side === 'bottom') {
                newMargin = Math.max(0, Math.min(2, startMargin - deltaY));
                this.marginBottom = newMargin;
            } else if (side === 'left') {
                newMargin = Math.max(0, Math.min(2, startMargin + deltaX));
                this.marginLeft = newMargin;
            } else if (side === 'right') {
                newMargin = Math.max(0, Math.min(2, startMargin - deltaX));
                this.marginRight = newMargin;
            }
            
            // Update input fields
            const topInput = document.getElementById('marginTop');
            const bottomInput = document.getElementById('marginBottom');
            const leftInput = document.getElementById('marginLeft');
            const rightInput = document.getElementById('marginRight');
            
            if (topInput) topInput.value = this.marginTop.toFixed(1);
            if (bottomInput) bottomInput.value = this.marginBottom.toFixed(1);
            if (leftInput) leftInput.value = this.marginLeft.toFixed(1);
            if (rightInput) rightInput.value = this.marginRight.toFixed(1);
            
            this.updatePreview();
        };
        
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                line.classList.remove('dragging');
            }
        };
        
        line.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        // Touch support
        line.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleMouseDown(e.touches[0]);
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMouseMove(e.touches[0]);
        });
        
        document.addEventListener('touchend', handleMouseUp);
    }

    bindEvents() {
        const contentInput = document.getElementById('contentInput');
        const themeSelect = document.getElementById('theme');
        const titleFontSelect = document.getElementById('titleFont');
        const headerFontSelect = document.getElementById('headerFont');
        const bodyFontSelect = document.getElementById('bodyFont');
        const titleColorSelect = document.getElementById('titleColor');
        const headerColorSelect = document.getElementById('headerColor');
        const bodyColorSelect = document.getElementById('bodyColor');
        const accentColorSelect = document.getElementById('accentColor');
        const titleSizeSelect = document.getElementById('titleSize');
        const headerSizeSelect = document.getElementById('headerSize');
        const bodySizeSelect = document.getElementById('bodySize');
        const pageSizeSelect = document.getElementById('pageSize');
        const marginTopInput = document.getElementById('marginTop');
        const marginBottomInput = document.getElementById('marginBottom');
        const marginLeftInput = document.getElementById('marginLeft');
        const marginRightInput = document.getElementById('marginRight');
        const marginPresetSelect = document.getElementById('marginPreset');
        const lineSpacingSelect = document.getElementById('lineSpacing');
        const alignmentRadios = document.querySelectorAll('input[name="textAlignment"]');
        const alignmentPresetSelect = document.getElementById('alignmentPreset');
        const titlePatternsInput = document.getElementById('titlePatterns');
        const headerPatternsInput = document.getElementById('headerPatterns');
        const subheaderPatternsInput = document.getElementById('subheaderPatterns');
        const listPatternsInput = document.getElementById('listPatterns');
        const applyPatternsBtn = document.getElementById('applyPatterns');
        const resetPatternsBtn = document.getElementById('resetPatterns');
        const learnFromContentBtn = document.getElementById('learnFromContent');
        const sectionPageBreakCheck = document.getElementById('sectionPageBreak');
        const subsectionPageBreakCheck = document.getElementById('subsectionPageBreak');
        const showPageNumbersCheck = document.getElementById('showPageNumbers');
        const loadDemoBtn = document.getElementById('loadDemo');
        const exportPdfBtn = document.getElementById('exportPdf');
        const refreshBtn = document.getElementById('refreshPreview');
        const clearContentBtn = document.getElementById('clearContent');
        const inputModeRadios = document.querySelectorAll('input[name="inputMode"]');

        contentInput.addEventListener('input', async () => {
            console.log('Content input changed, updating preview...');
            this.updatePreview();
            this.updateInputStats();
        });
        themeSelect.addEventListener('change', async (e) => {
            this.currentTheme = e.target.value;
            this.applyThemePreset(this.currentTheme);
            this.updatePreview();
        });
        titleFontSelect.addEventListener('change', async (e) => {
            this.titleFont = e.target.value;
            this.updatePreview();
        });
        headerFontSelect.addEventListener('change', async (e) => {
            this.headerFont = e.target.value;
            this.updatePreview();
        });
        bodyFontSelect.addEventListener('change', async (e) => {
            this.bodyFont = e.target.value;
            this.updatePreview();
        });
        titleColorSelect.addEventListener('change', async (e) => {
            this.titleColor = e.target.value;
            this.updatePreview();
        });
        headerColorSelect.addEventListener('change', async (e) => {
            this.headerColor = e.target.value;
            this.updatePreview();
        });
        bodyColorSelect.addEventListener('change', async (e) => {
            this.bodyColor = e.target.value;
            this.updatePreview();
        });
        accentColorSelect.addEventListener('change', async (e) => {
            this.accentColor = e.target.value;
            this.updatePreview();
        });
        titleSizeSelect.addEventListener('input', async (e) => {
            this.titleSize = parseInt(e.target.value);
            document.getElementById('titleSizeValue').textContent = this.titleSize + 'px';
            this.updatePreview();
        });
        headerSizeSelect.addEventListener('input', async (e) => {
            this.headerSize = parseInt(e.target.value);
            document.getElementById('headerSizeValue').textContent = this.headerSize + 'px';
            this.updatePreview();
        });
        bodySizeSelect.addEventListener('input', async (e) => {
            this.bodySize = parseInt(e.target.value);
            document.getElementById('bodySizeValue').textContent = this.bodySize + 'px';
            this.updatePreview();
        });
        if (pageSizeSelect) {
            pageSizeSelect.addEventListener('change', async (e) => {
                this.pageSize = e.target.value;
                console.log('Page size changed to:', this.pageSize);
                this.updatePreview();
            });
        } else {
            console.error('Page size select element not found');
        }
        // Individual margin controls
        if (marginTopInput) {
            marginTopInput.addEventListener('input', async (e) => {
                this.marginTop = parseFloat(e.target.value) || 0;
                console.log('Margin top changed to:', this.marginTop);
                this.updatePreview();
            });
        }
        
        if (marginBottomInput) {
            marginBottomInput.addEventListener('input', async (e) => {
                this.marginBottom = parseFloat(e.target.value) || 0;
                console.log('Margin bottom changed to:', this.marginBottom);
                this.updatePreview();
            });
        }
        
        if (marginLeftInput) {
            marginLeftInput.addEventListener('input', async (e) => {
                this.marginLeft = parseFloat(e.target.value) || 0;
                console.log('Margin left changed to:', this.marginLeft);
                this.updatePreview();
            });
        }
        
        if (marginRightInput) {
            marginRightInput.addEventListener('input', async (e) => {
                this.marginRight = parseFloat(e.target.value) || 0;
                console.log('Margin right changed to:', this.marginRight);
                this.updatePreview();
            });
        }
        
        // Margin preset selector
        if (marginPresetSelect) {
            marginPresetSelect.addEventListener('change', async (e) => {
                const presetValue = parseFloat(e.target.value);
                this.marginTop = presetValue;
                this.marginBottom = presetValue;
                this.marginLeft = presetValue;
                this.marginRight = presetValue;
                
                // Update input fields
                if (marginTopInput) marginTopInput.value = presetValue;
                if (marginBottomInput) marginBottomInput.value = presetValue;
                if (marginLeftInput) marginLeftInput.value = presetValue;
                if (marginRightInput) marginRightInput.value = presetValue;
                
                console.log('Margin preset changed to:', presetValue, 'for all sides');
                this.updatePreview();
            });
        }
        if (lineSpacingSelect) {
            lineSpacingSelect.addEventListener('change', async (e) => {
                this.lineSpacing = parseFloat(e.target.value);
                console.log('Line spacing changed to:', this.lineSpacing);
                this.updatePreview();
            });
        } else {
            console.error('Line spacing select element not found');
        }
        
        // Text alignment controls
        alignmentRadios.forEach(radio => {
            radio.addEventListener('change', async (e) => {
                this.textAlignment = e.target.value;
                this.titleAlignment = e.target.value;
                this.headerAlignment = e.target.value;
                this.bodyAlignment = e.target.value;
                console.log('Text alignment changed to:', this.textAlignment);
                this.updatePreview();
            });
        });
        
        if (alignmentPresetSelect) {
            alignmentPresetSelect.addEventListener('change', async (e) => {
                const preset = e.target.value;
                if (preset === 'left') {
                    this.textAlignment = 'left';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'left';
                } else if (preset === 'center') {
                    this.textAlignment = 'center';
                    this.titleAlignment = 'center';
                    this.headerAlignment = 'center';
                    this.bodyAlignment = 'center';
                } else if (preset === 'justify') {
                    this.textAlignment = 'justify';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'justify';
                } else if (preset === 'mixed') {
                    this.textAlignment = 'left';
                    this.titleAlignment = 'left';
                    this.headerAlignment = 'left';
                    this.bodyAlignment = 'justify';
                }
                
                // Update radio buttons
                const selectedRadio = document.querySelector(`input[name="textAlignment"][value="${this.textAlignment}"]`);
                if (selectedRadio) selectedRadio.checked = true;
                
                console.log('Alignment preset changed to:', preset, { text: this.textAlignment, title: this.titleAlignment, header: this.headerAlignment, body: this.bodyAlignment });
                this.updatePreview();
            });
        }
        
        // Detection pattern controls
        if (applyPatternsBtn) {
            applyPatternsBtn.addEventListener('click', async () => {
                this.applyDetectionPatterns();
            });
        }
        
        if (resetPatternsBtn) {
            resetPatternsBtn.addEventListener('click', async () => {
                this.resetDetectionPatterns();
            });
        }
        
        if (learnFromContentBtn) {
            learnFromContentBtn.addEventListener('click', async () => {
                this.learnFromCurrentContent();
            });
        }
        sectionPageBreakCheck.addEventListener('change', async (e) => {
            this.sectionPageBreak = e.target.checked;
            this.updatePreview();
        });
        subsectionPageBreakCheck.addEventListener('change', async (e) => {
            this.subsectionPageBreak = e.target.checked;
            this.updatePreview();
        });
        showPageNumbersCheck.addEventListener('change', async (e) => {
            this.showPageNumbers = e.target.checked;
            this.updatePreview();
        });
        loadDemoBtn.addEventListener('click', () => this.loadDemoContent());
        exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        refreshBtn.addEventListener('click', async () => {
            console.log('Refresh button clicked');
            this.updatePreview();
        });

        // Theme preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const theme = e.target.dataset.theme;
                this.applyThemePreset(theme);
                this.updatePreview();
            });
        });

        // Input mode
        clearContentBtn.addEventListener('click', () => this.clearContent());
        
        inputModeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                // Prevent switching to plain text mode (disabled)
                if (e.target.value === 'plain') {
                    e.preventDefault();
                    return;
                }
                this.inputMode = e.target.value;
                this.updateInputPlaceholder();
                this.syncInputModeRadio();
            });
        });

        // Scroll to top functionality
        const scrollToTopBtn = document.getElementById('scrollToTop');
        if (scrollToTopBtn) {
            scrollToTopBtn.addEventListener('click', () => {
                document.querySelector('.main-content').scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        }
    }

    async loadDemoContent() {
        const demoContent = `# StyledPages Demo Document

Welcome to **StyledPages** — where your plain text transforms into a polished, professional PDF instantly. This demo document shows off headings, lists, quotes, and formatting so you can see what's possible. Feel free to edit this content and watch the preview update in real time!

---

## ✨ Features at a Glance
- **Instant Formatting**: Headings, lists, quotes, and styles are auto-applied.
- **Professional Look**: Clean layouts and modern typography.
- **Effortless Export**: Generate a ready-to-share PDF with a single click.

---

## 📖 Example Use Cases

### 1. Reports
StyledPages is perfect for writing quick reports. For example:  

**Monthly Report – September 2025**  
- Revenue increased by 12%  
- User base grew to 15,000+  
- Released 3 new product updates  

---

### 2. Notes & Documentation
Take plain notes and instantly turn them into clean docs. Example:

> "Simplicity is the ultimate sophistication."  
> – Leonardo da Vinci  

---

### 3. Guides & Articles
Here's a short guide written right here in the editor:

#### How to Stay Productive
1. Start your day with a clear plan.  
2. Use time-blocking to avoid distractions.  
3. Review progress at the end of the day.  

---

## 🛠 Formatting Examples

### Text Styles
- Bold: **This is bold text**  
- Italic: *This is italic text*  
- Code: \`inline code\`  

### Lists
- Bullet list item one  
- Bullet list item two  
- Bullet list item three  

1. Numbered list item one  
2. Numbered list item two  
3. Numbered list item three  

### Links
[Visit StyledPages](https://styledpages.example.com)

---

## 🎯 Final Thoughts
StyledPages makes it easy to go from idea → text → polished PDF in minutes.  
Try editing this document now — change headings, add your own content, and see how StyledPages transforms it instantly.

Happy writing! 🚀`;

        document.getElementById('contentInput').value = demoContent;
        await this.updatePreview();
    }

    async updatePreview() {
        const content = document.getElementById('contentInput').value;
        const preview = document.getElementById('pdfPreview');
        
        console.log('=== UPDATE PREVIEW DEBUG ===');
        console.log('Content input value:', content);
        console.log('Content length:', content.length);
        console.log('Input mode:', this.inputMode);
        console.log('Is content formatted:', this.isContentFormatted());
        console.log('Preview element:', preview);
        
        // Add visual feedback that preview is updating
        preview.style.opacity = '0.7';
        preview.style.transform = 'scale(0.98)';
        
        if (!content.trim()) {
            preview.innerHTML = '<div class="preview-placeholder"><p>Enter content above to see the live preview</p></div>';
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
            return;
        }

        let formattedContent;
        
        // Always use markdown parsing (plain text mode disabled)
            console.log('Using markdown parsing...');
            formattedContent = this.parseContentWithPageBreaks(content);
        
        console.log('Formatted content:', formattedContent);
        
        // Fallback if parsing fails
        if (!formattedContent || formattedContent.trim() === '') {
            console.log('Using fallback parsing...');
            formattedContent = this.parseContent(content);
        }
        
        preview.innerHTML = formattedContent;
        preview.className = `pdf-preview theme-${this.currentTheme} page-size-${this.pageSize}`;
        
        // Apply all formatting variables
        preview.style.setProperty('--title-font', this.titleFont);
        preview.style.setProperty('--header-font', this.headerFont);
        preview.style.setProperty('--body-font', this.bodyFont);
        preview.style.setProperty('--title-color', this.titleColor);
        preview.style.setProperty('--header-color', this.headerColor);
        preview.style.setProperty('--body-color', this.bodyColor);
        preview.style.setProperty('--accent-color', this.accentColor);
        preview.style.setProperty('--title-size', this.titleSize + 'px');
        preview.style.setProperty('--header-size', this.headerSize + 'px');
        preview.style.setProperty('--body-size', this.bodySize + 'px');
        preview.style.setProperty('--margin-top', this.marginTop + 'in');
        preview.style.setProperty('--margin-bottom', this.marginBottom + 'in');
        preview.style.setProperty('--margin-left', this.marginLeft + 'in');
        preview.style.setProperty('--margin-right', this.marginRight + 'in');
        console.log('Setting margins to:', { top: this.marginTop, bottom: this.marginBottom, left: this.marginLeft, right: this.marginRight });
        
        // Apply text alignment
        preview.style.setProperty('--text-alignment', this.textAlignment);
        preview.style.setProperty('--title-alignment', this.titleAlignment);
        preview.style.setProperty('--header-alignment', this.headerAlignment);
        preview.style.setProperty('--body-alignment', this.bodyAlignment);
        console.log('Setting text alignment:', { text: this.textAlignment, title: this.titleAlignment, header: this.headerAlignment, body: this.bodyAlignment });
        preview.style.setProperty('--line-spacing', this.lineSpacing);
        
        // Apply page size dimensions
        const pageDimensions = this.getPageDimensions();
        preview.style.setProperty('--page-width', pageDimensions.width);
        preview.style.setProperty('--page-height', pageDimensions.height);
        console.log('Setting page dimensions:', pageDimensions);
        
        // Create draggable margin lines
        this.createDraggableMarginLines();
        
        // Restore full opacity and scale
        setTimeout(() => {
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
        }, 100);
    }

    parseContent(content) {
        // Split content into lines for better processing
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ')) {
                // Main header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(2));
                html += `<h1>${headerText}</h1>`;
            } else if (line.startsWith('## ')) {
                // Subheader
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(3));
                html += `<h2>${headerText}</h2>`;
            } else if (line.startsWith('### ')) {
                // Small header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(4));
                html += `<h3>${headerText}</h3>`;
            } else if (line.startsWith('- ')) {
                // List item
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const listText = this.processInlineFormatting(line.substring(2));
                html += `<li>${listText}</li>`;
            } else if (line.length > 0) {
                // Regular paragraph
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const paragraphText = this.processInlineFormatting(line);
                html += `<p>${paragraphText}</p>`;
            } else {
                // Empty line
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                // Add spacing for empty lines
                if (html && !html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>')) {
                    html += '<br>';
                }
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }

    processInlineFormatting(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
    }

    parseContentWithPageBreaks(content) {
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        let lastWasHeader = false;
        let lineCount = 0;
        let firstH2Found = false; // Track if we've seen the first H2
        const maxLinesPerPage = 30; // Approximate lines per page
        
        // Add initial page break to ensure content starts on a new page
        html += '<div class="page-break initial-page"></div>';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('# ')) {
                // Main header - check user preference for page breaks
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Add page break before H1 headers if user has enabled it
                if (html.length > 0 && this.sectionPageBreak) {
                    html += '<div class="page-break section-break"></div>';
                    lineCount = 0;
                }
                
                const headerText = this.processInlineFormatting(line.substring(2));
                html += `<h1>${headerText}</h1>`;
                lastWasHeader = true;
                lineCount += 3; // Headers take more space
            } else if (line.startsWith('## ')) {
                // Subheader - check user preference for page breaks
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                
                // Add page break before H2 headers if user has enabled it
                // BUT skip page break for the very first H2 (let it flow with H1)
                if (html.length > 0 && this.subsectionPageBreak && firstH2Found) {
                    html += '<div class="page-break subsection-break"></div>';
                    lineCount = 0;
                }
                
                // Mark that we've found the first H2
                firstH2Found = true;
                
                const headerText = this.processInlineFormatting(line.substring(3));
                html += `<h2>${headerText}</h2>`;
                lastWasHeader = true;
                lineCount += 2; // Subheaders take moderate space
            } else if (line.startsWith('### ')) {
                // Small header
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const headerText = this.processInlineFormatting(line.substring(4));
                html += `<h3>${headerText}</h3>`;
                lastWasHeader = true;
                lineCount += 2;
            } else if (line.startsWith('- ')) {
                // List item
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const listText = this.processInlineFormatting(line.substring(2));
                html += `<li>${listText}</li>`;
                lastWasHeader = false;
                lineCount += 1;
            } else if (line.length > 0) {
                // Regular paragraph
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                const paragraphText = this.processInlineFormatting(line);
                html += `<p>${paragraphText}</p>`;
                lastWasHeader = false;
                lineCount += 1;
            } else {
                // Empty line
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                if (html && !html.endsWith('</p>') && !html.endsWith('</h1>') && !html.endsWith('</h2>') && !html.endsWith('</h3>')) {
                    html += '<br>';
                }
                lastWasHeader = false;
                lineCount += 0.5; // Empty lines take minimal space
            }
            
            // Add page break if we've exceeded the maximum lines per page
            if (lineCount >= maxLinesPerPage) {
                html += '<div class="page-break"></div>';
                lineCount = 0;
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += '</ul>';
        }
        
        return html;
    }

    getPageDimensions() {
        const dimensions = {
            letter: { width: '8.5in', height: '11in' },
            a4: { width: '210mm', height: '297mm' },
            legal: { width: '8.5in', height: '14in' },
            tabloid: { width: '11in', height: '17in' }
        };
        return dimensions[this.pageSize] || dimensions.letter;
    }

    getPageSizeForPrint(pageSize) {
        const pageSizes = {
            letter: 'Letter',
            a4: 'A4',
            legal: 'Legal',
            tabloid: 'Tabloid'
        };
        return pageSizes[pageSize] || 'Letter';
    }


    applyThemePreset(theme) {
        const presets = {
            professional: {
                titleColor: '#1e293b',
                headerColor: '#1e293b',
                bodyColor: '#1e293b',
                accentColor: '#3b82f6'
            },
            creative: {
                titleColor: '#1e40af',
                headerColor: '#3b82f6',
                bodyColor: '#475569',
                accentColor: '#60a5fa'
            },
            minimal: {
                titleColor: '#1e40af',
                headerColor: '#3b82f6',
                bodyColor: '#475569',
                accentColor: '#60a5fa'
            },
            academic: {
                titleColor: '#1f2937',
                headerColor: '#4b5563',
                bodyColor: '#1f2937',
                accentColor: '#3b82f6'
            }
        };

        const preset = presets[theme];
        if (preset) {
            this.titleColor = preset.titleColor;
            this.headerColor = preset.headerColor;
            this.bodyColor = preset.bodyColor;
            this.accentColor = preset.accentColor;

            // Update color pickers
            document.getElementById('titleColor').value = this.titleColor;
            document.getElementById('headerColor').value = this.headerColor;
            document.getElementById('bodyColor').value = this.bodyColor;
            document.getElementById('accentColor').value = this.accentColor;

            // Update active preset button
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        }
    }


    async exportToPDF() {
        const exportBtn = document.getElementById('exportPdf');
        const originalText = exportBtn.textContent;
        
        // Show loading state
        exportBtn.innerHTML = '<span class="loading"></span> Generating PDF...';
        exportBtn.disabled = true;
        
        try {
            // Check if there's content to export
            const content = document.getElementById('contentInput').value;
            if (!content.trim()) {
                throw new Error('No content to export');
            }
            
            // Get the preview content
            const preview = document.getElementById('pdfPreview');
            if (!preview) {
                throw new Error('Preview element not found');
            }
            
            // Create a new window for printing
            const printWindow = window.open('', '_blank');
            
            // Set the window size based on the selected page size
            const pageDimensions = this.getPageDimensions();
            const width = pageDimensions.width === '210mm' ? '794px' : '816px'; // Convert to pixels
            const height = pageDimensions.height === '297mm' ? '1123px' : 
                          pageDimensions.height === '14in' ? '1344px' :
                          pageDimensions.height === '17in' ? '1632px' : '1056px';
            
            printWindow.resizeTo(parseInt(width) + 100, parseInt(height) + 200); // Add some padding
            
            // Get the current page size and margins
            const pageSize = this.pageSize;
            const marginTop = this.marginTop;
            const marginBottom = this.marginBottom;
            const marginLeft = this.marginLeft;
            const marginRight = this.marginRight;
            
            // Create the HTML content for printing
            const printHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>StyledPages Document</title>
    <style>
        @page {
            size: ${this.getPageSizeForPrint(pageSize)};
            margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in;
        }
        
        body {
            margin: 0;
            padding: 0;
            font-family: ${this.bodyFont}, sans-serif;
            font-size: ${this.bodySize}px;
            line-height: ${this.lineSpacing};
            color: ${this.bodyColor};
            background: white;
        }
        
        .pdf-content {
            width: 100%;
            max-width: none;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        /* Ensure content adapts to page size */
        @media print {
            body {
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
            }
            
            .pdf-content {
                width: 100%;
                height: 100%;
            }
        }
        
        h1 {
            font-family: ${this.titleFont}, sans-serif;
            font-size: ${this.titleSize}px;
            color: ${this.titleColor};
            font-weight: bold;
            margin: 0 0 0.5em 0;
            text-align: ${this.titleAlignment};
            border-bottom: 2px solid ${this.accentColor};
            padding-bottom: 0.2em;
        }
        
        h2 {
            font-family: ${this.headerFont}, sans-serif;
            font-size: ${this.headerSize}px;
            color: ${this.headerColor};
            font-weight: bold;
            margin: 1.5em 0 0.5em 0;
            text-align: ${this.headerAlignment};
        }
        
        h3 {
            font-family: ${this.headerFont}, sans-serif;
            font-size: ${this.headerSize - 4}px;
            color: ${this.headerColor};
            font-weight: bold;
            margin: 1.2em 0 0.3em 0;
            text-align: ${this.headerAlignment};
        }
        
        p {
            margin: 0 0 1em 0;
            text-align: ${this.bodyAlignment};
        }
        
        ul, ol {
            margin: 0 0 1em 0;
            padding-left: 1.5em;
        }
        
        li {
            margin: 0.3em 0;
        }
        
        strong {
            font-weight: bold;
        }
        
        em {
            font-style: italic;
        }
        
        hr {
            border: none;
            border-top: 1px solid ${this.accentColor};
            margin: 2em 0;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="pdf-content">
        ${preview.innerHTML}
    </div>
</body>
</html>`;
            
            // Write the content to the new window
            printWindow.document.write(printHTML);
            printWindow.document.close();
            
            // Wait for the content to load, then trigger print
            printWindow.onload = () => {
                setTimeout(() => {
                    // Add CSS to hint that this should be saved as PDF
                    const pdfHintCSS = `
                        <style>
                            @media print {
                                /* Hint to browsers that this should be saved as PDF */
                                body::before {
                                    content: "PDF_DOCUMENT";
                                    display: none;
                                }
                            }
                        </style>
                    `;
                    
                    // Add a script that tries to auto-select PDF destination
                    const autoSelectScript = `
                        <script>
                            // Function to try to auto-select "Save as PDF"
                            function tryAutoSelectPDF() {
                                // Wait for print dialog to be ready
                                setTimeout(() => {
                                    // Try different approaches based on browser
                                    if (window.chrome) {
                                        // Chrome-specific approach
                                        const printPreview = document.querySelector('print-preview-app');
                                        if (printPreview) {
                                            const destinationSelect = printPreview.querySelector('select[aria-label*="Destination"], select[aria-label*="destination"]');
                                            if (destinationSelect) {
                                                // Look for PDF option
                                                for (let option of destinationSelect.options) {
                                                    if (option.textContent.toLowerCase().includes('pdf') || 
                                                        option.value.toLowerCase().includes('pdf')) {
                                                        destinationSelect.value = option.value;
                                                        destinationSelect.dispatchEvent(new Event('change', { bubbles: true }));
                                                        break;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }, 300);
                            }
                            
                            // Try to auto-select PDF when print dialog opens
                            window.addEventListener('beforeprint', tryAutoSelectPDF);
                            
                            // Also try after a delay
                            setTimeout(tryAutoSelectPDF, 500);
                        </script>
                    `;
                    
                    // Add the CSS and script to the print window
                    printWindow.document.head.insertAdjacentHTML('beforeend', pdfHintCSS);
                    printWindow.document.head.insertAdjacentHTML('beforeend', autoSelectScript);
                    
                    // Trigger print
                    printWindow.print();
                    printWindow.close();
            
            // Show success state
                    exportBtn.innerHTML = '✓ PDF Downloaded!';
            exportBtn.classList.add('success');
            
            setTimeout(() => {
                exportBtn.textContent = originalText;
                exportBtn.classList.remove('success');
                exportBtn.disabled = false;
            }, 2000);
                }, 500);
            };
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            console.error('Error details:', error.message, error.stack);
            exportBtn.innerHTML = `Error: ${error.message}`;
            exportBtn.disabled = false;
            
            setTimeout(() => {
                exportBtn.textContent = originalText;
            }, 3000);
        }
    }

    processTextFormatting(text) {
        // Process text formatting for PDF
        // Note: jsPDF has limited formatting support, so we'll handle basic cases
        return text
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers for now
            .replace(/\*(.*?)\*/g, '$1'); // Remove italic markers for now
    }
    
    processTextWithFormatting(doc, text, x, y, options = {}) {
        // Process text with basic formatting support
        const lines = text.split('\n');
        let currentY = y;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Handle bold text (simple approach)
            if (line.includes('**')) {
                const parts = line.split(/(\*\*.*?\*\*)/g);
                let currentX = x;
                
                for (let j = 0; j < parts.length; j++) {
                    const part = parts[j];
                    if (part.startsWith('**') && part.endsWith('**')) {
                        // Bold text
                        const boldText = part.slice(2, -2);
                        doc.setFont(this.bodyFont, 'bold');
                        doc.text(boldText, currentX, currentY, options);
                        currentX += doc.getTextWidth(boldText);
                    } else if (part.trim()) {
                        // Regular text
                        doc.setFont(this.bodyFont, 'normal');
                        doc.text(part, currentX, currentY, options);
                        currentX += doc.getTextWidth(part);
                    }
                }
            } else {
                // Regular text
                doc.setFont(this.bodyFont, 'normal');
                doc.text(line, x, currentY, options);
            }
            
            currentY += 0.15; // Line height
        }
        
        return currentY;
    }

    addPageNumber(doc, pageNumber, pageWidth, marginTop, marginRight) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(pageNumber.toString(), pageWidth - marginRight - 0.1, marginTop - 0.1);
        console.log('Added page number:', pageNumber, 'at position:', pageWidth - marginRight - 0.1, marginTop - 0.1);
    }

    async processWithAI() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput) {
            console.error('Content input element not found');
            return;
        }
        
        const content = contentInput.value.trim();
        if (!content) {
            alert('Please enter some content to process with AI.');
            return;
        }

        this.showAIStatus(true);
        
        try {
            console.log('Processing content with AI...');
            const processedContent = await this.callGeminiAPI(content);
            if (processedContent && processedContent.trim()) {
                console.log('AI processing successful, updating content...');
                contentInput.value = processedContent;
                // Switch to markdown mode after AI processing
                this.inputMode = 'markdown';
                this.updateInputPlaceholder();
                await this.updatePreview();
            } else {
                throw new Error('AI returned empty content');
            }
        } catch (error) {
            console.error('AI processing failed:', error);
            // Show a more helpful error message
            const errorMessage = error.message.includes('API request failed') 
                ? 'AI service is temporarily unavailable. The content will be processed using the built-in parser instead.'
                : 'AI processing failed. The content will be processed using the built-in parser instead.';
            
            alert(errorMessage);
            
            // Fallback to plain text parsing
            console.log('Falling back to plain text parsing...');
            await this.updatePreview();
        } finally {
            this.showAIStatus(false);
        }
    }

    async callGeminiAPI(content) {
        // Check if API key is available
        if (!this.geminiApiKey || this.geminiApiKey === '') {
            throw new Error('API key not configured');
        }

        const prompt = `You are a professional document formatter. Convert this plain text into properly structured markdown.

CRITICAL RULES:
1. **MAIN TITLE**: Use # for the most important heading (usually the first line or one with "–" or "—")
2. **SECTION HEADERS**: Use ## for major sections like "Key Features", "How It Works", "Why Choose", etc.
3. **SUBSECTION HEADERS**: Use ### for smaller sections like "Time-Saving", "Professional Results", etc.
4. **LISTS**: Use - for bullet points, 1. 2. 3. for numbered lists
5. **EMPHASIS**: Use **bold** for important terms, *italic* for subtle emphasis
6. **PRESERVE**: Keep all original content, only add markdown formatting

DETECTION PATTERNS:
- Lines that are short, prominent, and standalone = headers
- Lines starting with numbers followed by periods = section headers (##)
- Lines that are descriptive but shorter = subsection headers (###)
- Lines with bullet points or dashes = list items
- Lines that are longer and descriptive = paragraphs

Example:
Input: "Key Features
Automatic Formatting: Detects headers
Professional Templates: Multiple themes"

Output: "## Key Features
- **Automatic Formatting**: Detects headers
- **Professional Templates**: Multiple themes"

Now format this content:
${content}

Return only the formatted markdown:`;

        try {
            console.log('Sending request to Gemini API...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            console.log('API response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API response data:', data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
                console.error('Invalid API response format:', data);
                throw new Error('Invalid API response format');
            }
            
            const result = data.candidates[0].content.parts[0].text;
            console.log('AI processing result:', result);
            return result;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error(`AI processing failed: ${error.message}`);
        }
    }

    showAIStatus(show) {
        const statusElement = document.getElementById('aiStatus');
        if (statusElement) {
            if (show) {
                statusElement.style.display = 'block';
            } else {
                statusElement.style.display = 'none';
            }
        }
    }

    async clearContent() {
        const contentInput = document.getElementById('contentInput');
        if (contentInput) {
            contentInput.value = '';
            this.updatePreview();
            this.updateInputStats();
        }
    }

    updateInputStats() {
        const contentInput = document.getElementById('contentInput');
        const charCountEl = document.getElementById('charCount');
        const wordCountEl = document.getElementById('wordCount');
        
        if (!contentInput || !charCountEl || !wordCountEl) return;
        
        const content = contentInput.value;
        const charCount = content.length;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        
        charCountEl.textContent = `${charCount.toLocaleString()} characters`;
        wordCountEl.textContent = `${wordCount.toLocaleString()} words`;
        
        // Update progress bar based on content length
        this.updateProgressBar(charCount);
    }

    updateProgressBar(charCount) {
        const progressBar = document.getElementById('headerProgress');
        if (!progressBar) return;
        
        // Calculate progress based on content length (max at 2000 characters)
        const maxChars = 2000;
        const progress = Math.min((charCount / maxChars) * 100, 100);
        progressBar.style.width = `${progress}%`;
    }

    syncInputModeRadio() {
        // Sync the radio button state with the current input mode
        const plainRadio = document.querySelector('input[name="inputMode"][value="plain"]');
        const markdownRadio = document.querySelector('input[name="inputMode"][value="markdown"]');
        
        if (plainRadio && markdownRadio) {
            if (this.inputMode === 'plain') {
                plainRadio.checked = true;
                markdownRadio.checked = false;
            } else {
                plainRadio.checked = false;
                markdownRadio.checked = true;
            }
        }
    }

    updateInputPlaceholder() {
        const textarea = document.getElementById('contentInput');
        if (!textarea) return;
        
        if (this.inputMode === 'plain') {
            textarea.placeholder = `Enter your content here... AI will automatically detect headers, subheaders, and formatting:

StyledPages – Full Project Description

1. Project Overview

StyledPages is a revolutionary web platform designed to automatically transform plain text into beautifully formatted, professional PDFs.

2. The Problem

Despite the proliferation of digital content, professionals face several challenges:

Time-Consuming Manual Formatting
Creating visually appealing PDFs requires careful attention to fonts, spacing, headers, and lists.

Lack of Design Skills
Many educators, coaches, and small business owners have valuable content but lack design expertise.

3. The Solution

StyledPages offers a fully automated, all-in-one PDF creation platform:

Automatic Content Detection
The platform scans the user's text and identifies structural elements like titles, headers, subheaders, lists, and paragraphs.

Predefined Professional Templates
Users can choose from multiple templates: Minimalist, Creative, Academic, and Modern.

Instant PDF Export
Generate and download formatted PDFs in seconds.

This is how your content will look when transformed into a beautiful PDF with AI-powered formatting.`;
        } else {
            textarea.placeholder = `Enter your content here using markdown formatting:

# Main Header
## Subheader
### Smaller Header

- Bullet point 1
- Bullet point 2
  - Nested point

**Bold text** and *italic text*

Regular paragraph text goes here. The system will automatically detect the structure and apply professional styling.

## Another Section

This is how your content will look when transformed into a beautiful PDF.`;
        }
    }

    isContentFormatted() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput) return false;
        
        const content = contentInput.value;
        // Check if content has markdown formatting
        return content.includes('#') || content.includes('**') || content.includes('*') || content.includes('- ');
    }

    parsePlainText(content) {
        // Enhanced plain text parsing with better structure detection
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        let inNumberedList = false;
        let listType = 'ul';
        let titleFound = false; // Track if we've found the main title
        let lineCount = 0;
        const maxLinesPerPage = 30; // Approximate lines per page
        
        console.log('Parsing plain text with', lines.length, 'lines');
        console.log('Content:', content);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            console.log(`Line ${i}: "${line}"`);
            
            if (line.length === 0) {
                // Empty line - close any open lists
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += '<br>';
                lineCount += 0.5;
            } else if (this.isNumberedListItem(line)) {
                // Numbered list item (1., 2., etc.)
                if (!inNumberedList || listType !== 'ol') {
                    if (inList) {
                        html += `</${listType}>`;
                    }
                    html += '<ol>';
                    inList = true;
                    inNumberedList = true;
                    listType = 'ol';
                }
                const listText = this.extractNumberedListText(line);
                html += `<li>${this.processInlineFormatting(listText)}</li>`;
                lineCount += 1;
            } else if (this.isBulletListItem(line)) {
                // Bullet list item (-, •, *, etc.)
                console.log('Detected bullet list item:', line);
                if (!inList || listType !== 'ul') {
                    if (inList) {
                        html += `</${listType}>`;
                    }
                    html += '<ul>';
                    inList = true;
                    inNumberedList = false;
                    listType = 'ul';
                }
                const listText = this.extractBulletListText(line);
                html += `<li>${this.processInlineFormatting(listText)}</li>`;
                lineCount += 1;
            } else if (!titleFound && this.isMainTitle(line)) {
                // Main title (ONLY the first title found)
                console.log('Detected main title:', line);
                console.log('isMainTitle check:', this.isMainTitle(line));
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += `<h1>${this.processInlineFormatting(line)}</h1>`;
                titleFound = true;
                lineCount += 3;
            } else if (this.isSectionHeader(line)) {
                // Section header (numbered sections like "1. Project Overview")
                console.log('Detected section header:', line);
                console.log('isSectionHeader check:', this.isSectionHeader(line));
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                
                // Add page break before section if enabled and we have content
                if (this.sectionPageBreak && lineCount > 0) {
                    html += '<div class="page-break section-break"></div>';
                    lineCount = 0;
                }
                
                html += `<h2>${this.processInlineFormatting(line)}</h2>`;
                lineCount += 2;
            } else if (this.isSubsectionHeader(line)) {
                // Subsection header (shorter, often descriptive)
                console.log('Detected subsection header:', line);
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                
                // Add page break before subsection if enabled and we have content
                if (this.subsectionPageBreak && lineCount > 0) {
                    html += '<div class="page-break subsection-break"></div>';
                    lineCount = 0;
                }
                
                html += `<h3>${this.processInlineFormatting(line)}</h3>`;
                lineCount += 2;
            } else {
                // Regular paragraph
                if (inList) {
                    html += `</${listType}>`;
                    inList = false;
                    inNumberedList = false;
                }
                html += `<p>${this.processInlineFormatting(line)}</p>`;
                lineCount += 1;
            }
            
            // Add page break if we've exceeded the maximum lines per page
            if (lineCount >= maxLinesPerPage) {
                html += '<div class="page-break"></div>';
                lineCount = 0;
            }
        }
        
        // Close any remaining list
        if (inList) {
            html += `</${listType}>`;
        }
        
        return html;
    }

    isNumberedListItem(line) {
        // Check if line starts with a number followed by a period
        // But exclude section headers (which are longer and more descriptive)
        return /^\d+\.\s/.test(line) && 
               !this.isSectionHeader(line) && // Not a section header
               (line.length > 20 || line.includes(':') || line.endsWith('.'));
    }

    isBulletListItem(line) {
        // Check if line starts with bullet points or is indented
        return /^[-•*]\s/.test(line) || 
               /^\s+[-•*]\s/.test(line) ||
               (line.startsWith('  ') && line.length > 10 && !line.includes(':'));
    }

    extractNumberedListText(line) {
        // Extract text after "1. " pattern
        return line.replace(/^\d+\.\s/, '');
    }

    extractBulletListText(line) {
        // Extract text after bullet point or indentation
        return line.replace(/^[-•*]\s/, '').replace(/^\s+/, '');
    }

    isMainTitle(line) {
        // Check if line is likely a main title
        // Usually first line, contains "–" or "—", or is very prominent
        return (line.length < 100 && 
                line.length > 5 && 
                (line.includes('–') || line.includes('—') || 
                 line.split(' ').length <= 10) &&
                line[0] === line[0].toUpperCase() &&
                !line.includes('.') && 
                !line.includes(',') &&
                !line.startsWith(' ') &&
                !line.startsWith('\t') &&
                !line.includes(':') &&
                !line.startsWith('1.') &&
                !line.startsWith('2.') &&
                !line.startsWith('3.') &&
                !line.startsWith('4.') &&
                !line.startsWith('5.'));
    }

    isSectionHeader(line) {
        // Check if line is a section header - can be numbered or just prominent text
        const isNumbered = /^\d+\.\s[A-Z]/.test(line);
        const isProminent = line.length > 5 && 
                           line.length < 100 && 
                           line[0] === line[0].toUpperCase() &&
                           !line.includes('.') && 
                           !line.includes(',') &&
                           !line.includes(':') &&
                           !line.includes('•') &&
                           !line.includes('-') &&
                           !line.includes('*') &&
                           !line.startsWith(' ') &&
                           !line.startsWith('\t') &&
                           line.split(' ').length >= 2 &&
                           !line.includes('–') && 
                           !line.includes('—');
        
        return isNumbered || isProminent;
    }

    isSubsectionHeader(line) {
        // Check if line is a subsection header (shorter, descriptive)
        return line.length < 80 && 
               line.length > 5 && 
               line[0] === line[0].toUpperCase() &&
               !line.includes('.') && 
               !line.includes(',') &&
               !/^\d+\.\s/.test(line) &&
               line.split(' ').length <= 8 &&
               !line.includes('–') && 
               !line.includes('—') &&
               !line.startsWith(' ') &&
               !line.startsWith('\t') &&
               !line.includes('•') &&
               !line.includes('-') &&
               !line.includes('*');
    }

    // Legacy methods for backward compatibility
    isLikelyTitle(line) {
        return this.isMainTitle(line);
    }

    isLikelyHeader(line) {
        return this.isSubsectionHeader(line);
    }
    
    // Detection pattern management
    async applyDetectionPatterns() {
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) this.detectionPatterns.title = titlePatterns.value;
        if (headerPatterns) this.detectionPatterns.header = headerPatterns.value;
        if (subheaderPatterns) this.detectionPatterns.subheader = subheaderPatterns.value;
        if (listPatterns) this.detectionPatterns.list = listPatterns.value;
        
        console.log('Applied detection patterns:', this.detectionPatterns);
        await this.updatePreview();
    }
    
    async resetDetectionPatterns() {
        this.detectionPatterns = {
            title: "contains '–' or '—', starts with capital, length 5-100",
            header: "starts with number., short descriptive text, length 5-100",
            subheader: "short descriptive, no numbers, length 5-80",
            list: "starts with -, •, *, or indented"
        };
        
        // Update input fields
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) titlePatterns.value = this.detectionPatterns.title;
        if (headerPatterns) headerPatterns.value = this.detectionPatterns.header;
        if (subheaderPatterns) subheaderPatterns.value = this.detectionPatterns.subheader;
        if (listPatterns) listPatterns.value = this.detectionPatterns.list;
        
        console.log('Reset detection patterns to default');
        await this.updatePreview();
    }
    
    async learnFromCurrentContent() {
        const contentInput = document.getElementById('contentInput');
        if (!contentInput || !contentInput.value.trim()) {
            alert('Please add some content first to learn from.');
            return;
        }
        
        const content = contentInput.value;
        const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // Analyze patterns in the content
        const analysis = this.analyzeContentPatterns(lines);
        
        // Update detection patterns based on analysis
        this.detectionPatterns = {
            title: analysis.titlePattern,
            header: analysis.headerPattern,
            subheader: analysis.subheaderPattern,
            list: analysis.listPattern
        };
        
        // Update input fields
        const titlePatterns = document.getElementById('titlePatterns');
        const headerPatterns = document.getElementById('headerPatterns');
        const subheaderPatterns = document.getElementById('subheaderPatterns');
        const listPatterns = document.getElementById('listPatterns');
        
        if (titlePatterns) titlePatterns.value = this.detectionPatterns.title;
        if (headerPatterns) headerPatterns.value = this.detectionPatterns.header;
        if (subheaderPatterns) subheaderPatterns.value = this.detectionPatterns.subheader;
        if (listPatterns) listPatterns.value = this.detectionPatterns.list;
        
        console.log('Learned patterns from content:', this.detectionPatterns);
        await this.updatePreview();
    }
    
    analyzeContentPatterns(lines) {
        const titles = [];
        const headers = [];
        const subheaders = [];
        const lists = [];
        
        lines.forEach(line => {
            if (line.includes('–') || line.includes('—') || (line.length < 100 && line.length > 10 && line[0] === line[0].toUpperCase())) {
                titles.push(line);
            } else if (/^\d+\.\s/.test(line) || (line.length < 100 && line[0] === line[0].toUpperCase() && line.split(' ').length <= 8)) {
                headers.push(line);
            } else if (line.length < 80 && line[0] === line[0].toUpperCase() && line.split(' ').length <= 6) {
                subheaders.push(line);
            } else if (/^[-•*]\s/.test(line) || line.startsWith('  ')) {
                lists.push(line);
            }
        });
        
        return {
            titlePattern: this.generatePatternDescription(titles, 'title'),
            headerPattern: this.generatePatternDescription(headers, 'header'),
            subheaderPattern: this.generatePatternDescription(subheaders, 'subheader'),
            listPattern: this.generatePatternDescription(lists, 'list')
        };
    }
    
    generatePatternDescription(examples, type) {
        if (examples.length === 0) {
            return `No ${type} examples found`;
        }
        
        const patterns = [];
        const lengths = examples.map(line => line.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        
        if (type === 'title') {
            if (examples.some(line => line.includes('–') || line.includes('—'))) {
                patterns.push("contains '–' or '—'");
            }
            if (examples.every(line => line[0] === line[0].toUpperCase())) {
                patterns.push("starts with capital");
            }
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'header') {
            if (examples.some(line => /^\d+\.\s/.test(line))) {
                patterns.push("starts with number.");
            }
            patterns.push("short descriptive text");
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'subheader') {
            patterns.push("short descriptive");
            if (examples.every(line => !/^\d+\.\s/.test(line))) {
                patterns.push("no numbers");
            }
            patterns.push(`length ${Math.round(avgLength * 0.5)}-${Math.round(avgLength * 1.5)}`);
        } else if (type === 'list') {
            if (examples.some(line => /^[-•*]\s/.test(line))) {
                patterns.push("starts with -, •, *");
            }
            if (examples.some(line => line.startsWith('  '))) {
                patterns.push("or indented");
            }
        }
        
        return patterns.join(', ');
    }

}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StyledPages();
});

// Add some smooth scrolling and animations
document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animation to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    });
    
    featureCards.forEach(card => {
        observer.observe(card);
    });
});
