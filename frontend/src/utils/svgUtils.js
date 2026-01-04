/**
 * SVG Utility Functions - Fix viewBox Issues
 * ============================================
 * 
 * This utility provides functions to fix common SVG viewBox issues
 * that occur with dynamic values and third-party libraries.
 */

/**
 * Sanitizes viewBox values to ensure they contain only numbers
 * @param {string} viewBox - The viewBox attribute value
 * @returns {string} - Sanitized viewBox value
 */
export const sanitizeViewBox = (viewBox) => {
  if (!viewBox || typeof viewBox !== 'string') {
    return '0 0 24 24'; // Default viewBox
  }
  
  // Remove any percentage signs and non-numeric characters except spaces and minus signs
  const sanitized = viewBox
    .replace(/%/g, '') // Remove percentage signs
    .replace(/px/g, '') // Remove px units
    .replace(/[^\d\s\-]/g, '') // Keep only numbers, spaces, and minus signs
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  
  // Split into parts and validate
  const parts = sanitized.split(' ');
  
  // Ensure we have exactly 4 numbers
  if (parts.length !== 4) {
    return '0 0 24 24'; // Default viewBox
  }
  
  // Convert to numbers and validate
  const numbers = parts.map(part => {
    const num = parseFloat(part);
    return isNaN(num) ? 0 : num;
  });
  
  // Return properly formatted viewBox
  return numbers.join(' ');
};

/**
 * Creates a safe SVG component with sanitized viewBox
 * @param {Object} props - SVG props
 * @returns {React.Component} - Safe SVG component
 */
export const SafeSVG = ({ children, viewBox, ...props }) => {
  const safeViewBox = sanitizeViewBox(viewBox);
  
  return (
    <svg viewBox={safeViewBox} {...props}>
      {children}
    </svg>
  );
};

/**
 * Fix common viewBox patterns that cause errors
 * @param {string} viewBox - The viewBox attribute value
 * @returns {string} - Fixed viewBox value
 */
export const fixViewBox = (viewBox) => {
  if (!viewBox) return '0 0 24 24';
  
  // Fix common patterns
  const fixes = [
    // "0 0 79% 20" -> "0 0 79 20"
    /(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)/g,
    // "0 0 100% 129px" -> "0 0 100 129"
    /(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)px/g,
    // "0 0 89% 18" -> "0 0 89 18"
    /(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)/g,
    // "0 0 70% 16" -> "0 0 70 16"
    /(\d+)\s+(\d+)\s+(\d+)%\s+(\d+)/g
  ];
  
  let fixed = viewBox;
  fixes.forEach(pattern => {
    fixed = fixed.replace(pattern, '$1 $2 $3 $4');
  });
  
  return sanitizeViewBox(fixed);
};

export default {
  sanitizeViewBox,
  SafeSVG,
  fixViewBox
};
