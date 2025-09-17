const StyledPagesPDFGenerator = require('./generate-pdf.js');
const fs = require('fs');

/**
 * Example usage of StyledPages PDF Generator
 */
async function runExamples() {
    const generator = new StyledPagesPDFGenerator();
    
    try {
        console.log('🚀 Starting StyledPages PDF Generator Examples...\n');
        
        await generator.init();
        
        // Example 1: Generate PDF from optimized HTML file
        console.log('📄 Example 1: Generating PDF from HTML file...');
        await generator.generatePDF('index-optimized.html', 'example-from-html.pdf');
        
        // Example 2: Generate PDF with custom content and professional styling
        console.log('\n📄 Example 2: Generating PDF with custom content...');
        const professionalContent = `# Professional Business Report

## Executive Summary

This report provides a comprehensive analysis of our Q4 performance and strategic recommendations for the upcoming quarter.

### Key Metrics

- **Revenue Growth**: 23% increase year-over-year
- **Customer Satisfaction**: 94% approval rating
- **Market Share**: Expanded by 15% in target segments

## Market Analysis

Our market analysis reveals several *critical* opportunities for growth in the coming year. The data suggests that our current strategy is well-positioned for continued success.

### Competitive Landscape

The competitive landscape has shifted significantly:

1. **New Entrants**: Three new competitors entered the market
2. **Price Pressure**: Increased competition driving price sensitivity
3. **Technology Advances**: New tools enabling better customer experience

## Strategic Recommendations

Based on our analysis, we recommend the following strategic initiatives:

- **Digital Transformation**: Accelerate our digital platform development
- **Customer Experience**: Invest in customer service automation
- **Market Expansion**: Explore opportunities in adjacent markets

## Conclusion

The data clearly indicates that our strategic direction is sound, but we must remain agile and responsive to market changes.

*Prepared by the Strategy Team*`;

        await generator.generateStandalonePDF(
            professionalContent,
            'professional-report.pdf',
            {
                titleFont: 'Playfair Display',
                headerFont: 'Montserrat',
                bodyFont: 'Inter',
                titleColor: '#1a202c',
                headerColor: '#2d3748',
                bodyColor: '#4a5568',
                accentColor: '#3182ce',
                titleSize: 36,
                headerSize: 28,
                bodySize: 16,
                textAlignment: 'left',
                lineSpacing: 1.6,
                pageSize: 'letter',
                marginTop: 1,
                marginBottom: 1,
                marginLeft: 1,
                marginRight: 1
            }
        );

        // Example 3: Generate PDF with creative styling
        console.log('\n📄 Example 3: Generating PDF with creative styling...');
        const creativeContent = `# Creative Portfolio

## About Me

I'm a **passionate** designer and developer with over 5 years of experience creating beautiful, functional digital experiences.

### My Skills

- **UI/UX Design**: Creating intuitive user interfaces
- **Frontend Development**: React, Vue, and vanilla JavaScript
- **Brand Identity**: Logo design and brand guidelines
- **Motion Graphics**: After Effects and Lottie animations

## Featured Projects

### E-commerce Platform Redesign

Led the complete redesign of a major e-commerce platform, resulting in:

- 40% increase in conversion rate
- 25% reduction in bounce rate
- 95% user satisfaction score

### Mobile App Development

Developed a cross-platform mobile app for a startup, featuring:

- Real-time data synchronization
- Offline functionality
- Intuitive user experience

## Contact

Ready to work together? Let's create something amazing!

*Email: hello@example.com*`;

        await generator.generateStandalonePDF(
            creativeContent,
            'creative-portfolio.pdf',
            {
                titleFont: 'Playfair Display',
                headerFont: 'Montserrat',
                bodyFont: 'Open Sans',
                titleColor: '#7c3aed',
                headerColor: '#a855f7',
                bodyColor: '#1f2937',
                accentColor: '#f59e0b',
                titleSize: 40,
                headerSize: 32,
                bodySize: 18,
                textAlignment: 'left',
                lineSpacing: 1.7,
                pageSize: 'letter',
                marginTop: 0.75,
                marginBottom: 0.75,
                marginLeft: 0.75,
                marginRight: 0.75
            }
        );

        // Example 4: Generate academic paper
        console.log('\n📄 Example 4: Generating academic paper...');
        const academicContent = `# The Impact of Artificial Intelligence on Modern Education

## Abstract

This paper examines the transformative effects of artificial intelligence on educational methodologies, student learning outcomes, and institutional practices in the 21st century.

## Introduction

The integration of artificial intelligence (AI) into educational systems represents one of the most significant technological advances in modern pedagogy. This research investigates the multifaceted impact of AI technologies on teaching and learning processes.

### Research Questions

The study addresses the following key questions:

1. How does AI enhance personalized learning experiences?
2. What are the implications for teacher roles and responsibilities?
3. How do AI-driven assessments compare to traditional methods?

## Literature Review

### Historical Context

The evolution of educational technology has been marked by several paradigm shifts:

- **1960s-1980s**: Computer-assisted instruction
- **1990s-2000s**: Internet-based learning platforms
- **2010s-Present**: AI-powered adaptive learning systems

### Current State of Research

Recent studies have demonstrated significant benefits of AI in education:

- **Personalization**: AI enables tailored learning paths for individual students
- **Efficiency**: Automated grading and feedback systems reduce teacher workload
- **Accessibility**: AI tools make education more accessible to diverse learners

## Methodology

### Research Design

This study employs a mixed-methods approach combining:

- Quantitative analysis of student performance data
- Qualitative interviews with educators and administrators
- Case studies of AI implementation in various institutions

### Data Collection

Data was collected from 50 educational institutions over a 12-month period, including:

- Student performance metrics
- Teacher feedback surveys
- Administrative efficiency reports

## Results

### Student Performance

Students using AI-enhanced learning tools showed:

- 23% improvement in test scores
- 18% increase in engagement levels
- 31% reduction in learning time for complex concepts

### Teacher Perspectives

Educators reported:

- 67% reduction in administrative tasks
- 89% satisfaction with AI-assisted grading
- 45% increase in time available for student interaction

## Discussion

### Implications for Practice

The findings suggest several important implications for educational practice:

1. **Curriculum Design**: AI enables more adaptive and responsive curricula
2. **Assessment Methods**: Traditional testing may need to evolve alongside AI capabilities
3. **Teacher Training**: Professional development must address AI integration

### Limitations

This study has several limitations:

- Limited to institutions with sufficient technological infrastructure
- Short-term data may not capture long-term effects
- Cultural and socioeconomic factors not fully explored

## Conclusion

The evidence strongly supports the positive impact of AI on educational outcomes. However, successful implementation requires careful planning, adequate training, and ongoing evaluation.

### Future Research

Further research should examine:

- Long-term effects on student learning
- Cost-benefit analysis of AI implementation
- Ethical considerations in AI-driven education

## References

1. Smith, J. (2023). "AI in Education: A Comprehensive Review." *Educational Technology Journal*, 45(2), 123-145.

2. Johnson, M. (2023). "Personalized Learning Through Artificial Intelligence." *Journal of Educational Research*, 78(4), 234-256.

3. Chen, L. (2023). "The Future of Assessment in AI-Enhanced Classrooms." *International Education Review*, 12(3), 89-102.`;

        await generator.generateStandalonePDF(
            academicContent,
            'academic-paper.pdf',
            {
                titleFont: 'Georgia',
                headerFont: 'Source Sans Pro',
                bodyFont: 'Georgia',
                titleColor: '#1f2937',
                headerColor: '#374151',
                bodyColor: '#1f2937',
                accentColor: '#dc2626',
                titleSize: 28,
                headerSize: 22,
                bodySize: 14,
                textAlignment: 'justify',
                lineSpacing: 1.5,
                pageSize: 'letter',
                marginTop: 1.25,
                marginBottom: 1.25,
                marginLeft: 1.25,
                marginRight: 1.25
            }
        );

        console.log('\n🎉 All examples completed successfully!');
        console.log('\nGenerated files:');
        console.log('- example-from-html.pdf');
        console.log('- professional-report.pdf');
        console.log('- creative-portfolio.pdf');
        console.log('- academic-paper.pdf');

    } catch (error) {
        console.error('💥 Error running examples:', error);
    } finally {
        await generator.close();
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples();
}

module.exports = runExamples;
