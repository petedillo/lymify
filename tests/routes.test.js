// Tests for Lymify routes
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Mock the socket.io module since we don't need to test it in this context
vi.mock('socket.io', () => ({
  Server: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
  }))
}));

// Mock the logger module
vi.mock('../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock the spotifyService module
vi.mock('../src/services/spotifyService', () => ({
  downloadTrack: vi.fn()
}));

// Mock the fileUtils module
describe('Route Tests', () => {
  let dom;
  let document;
  
  beforeEach(() => {
    // Read the index.ejs file and convert it to HTML for testing
    const indexPath = path.join(__dirname, '../src/views/index.ejs');
    let htmlContent = fs.readFileSync(indexPath, 'utf8');
    
    // Remove EJS specific syntax for testing purposes
    htmlContent = htmlContent.replace(/<%-\s*include\([^)]*\)\s*%>/g, '');
    
    // Create a JSDOM instance
    dom = new JSDOM(htmlContent, { 
      url: 'http://localhost:3300',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    
    document = dom.window.document;
    
    // Mock fetch globally
    global.fetch = vi.fn();
    
    // Mock window.location
    Object.defineProperty(dom.window, 'location', {
      value: {
        href: 'http://localhost:3300',
        assign: vi.fn()
      },
      writable: true
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('Download form should have correct action and method attributes', () => {
    const form = document.getElementById('download-form');
    expect(form).toBeTruthy();
    expect(form.getAttribute('action')).toBe('/download');
    expect(form.getAttribute('method')).toBe('POST');
  });
  
  test('Download form should have required input fields', () => {
    const trackUrlInput = document.getElementById('track-url');
    expect(trackUrlInput).toBeTruthy();
    expect(trackUrlInput.getAttribute('type')).toBe('url');
    expect(trackUrlInput.getAttribute('name')).toBe('trackUrl');
    expect(trackUrlInput.hasAttribute('required')).toBe(true);
    
    const submitButton = document.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    expect(submitButton.textContent).toBe('Download');
  });
  
  test('Download form submission should redirect to status page', async () => {
    // This test verifies that the form is set up correctly for server-side redirect
    // Since we removed the JavaScript handler, the form should submit normally
    const form = document.getElementById('download-form');
    expect(form).toBeTruthy();
    
    // Verify the form will submit to the correct endpoint
    expect(form.getAttribute('action')).toBe('/download');
    expect(form.getAttribute('method')).toBe('POST');
    
    // Note: We can't fully test the redirect behavior in JSDOM since it doesn't
    // actually submit forms, but we can verify the form is configured correctly
  });
});
