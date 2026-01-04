/**
 * Global SVG viewBox Fix - Runtime Error Prevention
 * =================================================
 * 
 * This script fixes SVG viewBox errors that occur at runtime
 * by intercepting and sanitizing viewBox values.
 */

(function() {

  /**
   * Fix viewBox attribute on SVG elements
   */
  function fixSVGViewBox() {
    const svgs = document.querySelectorAll('svg[viewBox]');
    
    svgs.forEach(svg => {
      const viewBox = svg.getAttribute('viewBox');
      if (viewBox && viewBox.includes('%')) {
        // Fix viewBox by removing percentage signs and ensuring proper format
        const fixed = viewBox
          .replace(/%/g, '')
          .replace(/px/g, '')
          .replace(/[^\d\s-]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const parts = fixed.split(' ');
        if (parts.length === 4) {
          const numbers = parts.map(part => {
            const num = parseFloat(part);
            return isNaN(num) ? 0 : num;
          });
          svg.setAttribute('viewBox', numbers.join(' '));
        }
      }
    });
  }

  /**
   * Monitor for dynamically added SVG elements
   */
  function observeSVGChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is an SVG or contains SVGs
            if (node.tagName === 'SVG') {
              fixSVGViewBox();
            } else if (node.querySelectorAll) {
              const svgs = node.querySelectorAll('svg[viewBox]');
              if (svgs.length > 0) {
                fixSVGViewBox();
              }
            }
          }
        });
      });
    });

    // Start observing the entire document
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  /**
   * Initialize the SVG fix when DOM is ready
   */
  function initSVGFix() {
    // Fix existing SVGs
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fixSVGViewBox);
    } else {
      fixSVGViewBox();
    }

    // Start observing for new SVGs
    observeSVGChanges();

    // Also fix SVGs periodically (for any missed ones)
    setInterval(fixSVGViewBox, 1000);
  }

  // Initialize immediately if possible
  if (typeof window !== 'undefined') {
    initSVGFix();
  }

  // Export for React usage
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { fixSVGViewBox };
  }
})();
