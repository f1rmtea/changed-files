
const BINARY_EXTENSIONS = [
    // Images
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.tiff',
    // Documents
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    // Archives
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
    // Executables
    '.exe', '.dll', '.so', '.dylib', '.app',
    // Compiled
    '.pyc', '.pyo', '.wasm', '.class', '.jar',
    // Fonts
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    // Media
    '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
    // Other
    '.db', '.sqlite', '.dat'
  ];
  
  export function isBinaryFile(filename: string): boolean {
    const lowerFilename = filename.toLowerCase();
    return BINARY_EXTENSIONS.some(ext => lowerFilename.endsWith(ext));
  }