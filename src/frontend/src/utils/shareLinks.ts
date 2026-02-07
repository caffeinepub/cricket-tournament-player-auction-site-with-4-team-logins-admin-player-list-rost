/**
 * Utility functions for generating and handling shareable public scorecard links
 */

/**
 * Builds the absolute public share URL from the current origin and a shareId
 * Uses hash-based routing for production-safe deep links
 */
export function buildPublicShareUrl(shareId: string): string {
  return `${window.location.origin}/#/s/${shareId}`;
}

/**
 * Safely copies text to clipboard with fallback behavior
 * Returns true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    textArea.remove();
    
    return successful;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Attempts to share a URL using the Web Share API
 * Returns true if share was invoked, false if not available
 * Throws error if share fails
 */
export async function shareViaWebShare(url: string, title: string): Promise<boolean> {
  if (!navigator.share) {
    return false;
  }

  try {
    await navigator.share({
      title,
      url,
    });
    return true;
  } catch (error: any) {
    // Re-throw so caller can handle (e.g., user cancelled)
    throw error;
  }
}
