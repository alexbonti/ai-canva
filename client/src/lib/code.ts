/**
 * Wraps generated React component code in a self-contained HTML file
 * that loads React + Babel via CDN. Used for iframe preview and download.
 */
export function wrapCodeInHtml(code: string): string {
  return [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>',
    '  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>',
    '  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>',
    '  <style>',
    '    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif; }',
    '    #root { padding: 16px; }',
    '    * { box-sizing: border-box; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <div id="root"></div>',
    '  <script type="text/babel">',
    code,
    "  setTimeout(function() { window.parent.postMessage({ type: 'preview-ready' }, '*'); }, 300);",
    '  </script>',
    '</body>',
    '</html>',
  ].join('\n');
}

/**
 * Strips markdown code block wrappers if Claude wrapped the output.
 */
export function extractCode(raw: string): string {
  let code = raw.trim();
  // Remove markdown code block wrapper (```jsx ... ```)
  const codeBlockMatch = code.match(/```(?:jsx?|javascript|react)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    code = codeBlockMatch[1].trim();
  }
  return code;
}

/**
 * Triggers a browser download of the HTML file.
 */
export function downloadHtml(html: string, filename = "prototype.html") {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies text to the clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}