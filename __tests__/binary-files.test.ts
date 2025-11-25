import { isBinaryFile } from '../src/utils/binary-files';

describe('Binary File Detection', () => {
  describe('Image files', () => {
    it('should detect common image formats as binary', () => {
      expect(isBinaryFile('photo.png')).toBe(true);
      expect(isBinaryFile('logo.jpg')).toBe(true);
      expect(isBinaryFile('avatar.jpeg')).toBe(true);
      expect(isBinaryFile('animation.gif')).toBe(true);
      expect(isBinaryFile('icon.svg')).toBe(true);
      expect(isBinaryFile('favicon.ico')).toBe(true);
      expect(isBinaryFile('image.webp')).toBe(true);
      expect(isBinaryFile('photo.bmp')).toBe(true);
      expect(isBinaryFile('scan.tiff')).toBe(true);
    });
  });

  describe('Document files', () => {
    it('should detect document formats as binary', () => {
      expect(isBinaryFile('report.pdf')).toBe(true);
      expect(isBinaryFile('document.doc')).toBe(true);
      expect(isBinaryFile('spreadsheet.xlsx')).toBe(true);
      expect(isBinaryFile('presentation.pptx')).toBe(true);
    });
  });

  describe('Archive files', () => {
    it('should detect archive formats as binary', () => {
      expect(isBinaryFile('package.zip')).toBe(true);
      expect(isBinaryFile('backup.tar')).toBe(true);
      expect(isBinaryFile('archive.gz')).toBe(true);
      expect(isBinaryFile('compressed.7z')).toBe(true);
      expect(isBinaryFile('file.rar')).toBe(true);
    });
  });

  describe('Executable files', () => {
    it('should detect executable formats as binary', () => {
      expect(isBinaryFile('program.exe')).toBe(true);
      expect(isBinaryFile('library.dll')).toBe(true);
      expect(isBinaryFile('shared.so')).toBe(true);
      expect(isBinaryFile('library.dylib')).toBe(true);
    });
  });

  describe('Compiled files', () => {
    it('should detect compiled formats as binary', () => {
      expect(isBinaryFile('module.pyc')).toBe(true);
      expect(isBinaryFile('optimized.pyo')).toBe(true);
      expect(isBinaryFile('web.wasm')).toBe(true);
      expect(isBinaryFile('Program.class')).toBe(true);
      expect(isBinaryFile('library.jar')).toBe(true);
    });
  });

  describe('Font files', () => {
    it('should detect font formats as binary', () => {
      expect(isBinaryFile('font.woff')).toBe(true);
      expect(isBinaryFile('font.woff2')).toBe(true);
      expect(isBinaryFile('font.ttf')).toBe(true);
      expect(isBinaryFile('font.eot')).toBe(true);
      expect(isBinaryFile('font.otf')).toBe(true);
    });
  });

  describe('Media files', () => {
    it('should detect media formats as binary', () => {
      expect(isBinaryFile('song.mp3')).toBe(true);
      expect(isBinaryFile('video.mp4')).toBe(true);
      expect(isBinaryFile('clip.avi')).toBe(true);
      expect(isBinaryFile('movie.mov')).toBe(true);
      expect(isBinaryFile('audio.wav')).toBe(true);
      expect(isBinaryFile('lossless.flac')).toBe(true);
    });
  });

  describe('Database and data files', () => {
    it('should detect database formats as binary', () => {
      expect(isBinaryFile('database.db')).toBe(true);
      expect(isBinaryFile('data.sqlite')).toBe(true);
      expect(isBinaryFile('file.dat')).toBe(true);
    });
  });

  describe('Text files', () => {
    it('should not detect text files as binary', () => {
      expect(isBinaryFile('code.js')).toBe(false);
      expect(isBinaryFile('styles.css')).toBe(false);
      expect(isBinaryFile('markup.html')).toBe(false);
      expect(isBinaryFile('script.ts')).toBe(false);
      expect(isBinaryFile('README.md')).toBe(false);
      expect(isBinaryFile('config.json')).toBe(false);
      expect(isBinaryFile('settings.yml')).toBe(false);
      expect(isBinaryFile('data.txt')).toBe(false);
      expect(isBinaryFile('script.py')).toBe(false);
    });
  });

  describe('Case insensitivity', () => {
    it('should handle uppercase extensions', () => {
      expect(isBinaryFile('IMAGE.PNG')).toBe(true);
      expect(isBinaryFile('DOCUMENT.PDF')).toBe(true);
      expect(isBinaryFile('FILE.ZIP')).toBe(true);
    });

    it('should handle mixed case extensions', () => {
      expect(isBinaryFile('photo.PnG')).toBe(true);
      expect(isBinaryFile('file.Pdf')).toBe(true);
      expect(isBinaryFile('archive.ZiP')).toBe(true);
    });
  });

  describe('Complex filenames', () => {
    it('should handle files with multiple dots', () => {
      expect(isBinaryFile('my.file.name.png')).toBe(true);
      expect(isBinaryFile('version.1.2.3.exe')).toBe(true);
      expect(isBinaryFile('backup.2024.01.01.zip')).toBe(true);
    });

    it('should handle paths with directories', () => {
      expect(isBinaryFile('assets/images/logo.png')).toBe(true);
      expect(isBinaryFile('dist/bundle.wasm')).toBe(true);
      expect(isBinaryFile('/absolute/path/file.pdf')).toBe(true);
    });

    it('should handle files without extensions', () => {
      expect(isBinaryFile('Makefile')).toBe(false);
      expect(isBinaryFile('README')).toBe(false);
      expect(isBinaryFile('LICENSE')).toBe(false);
    });
  });
});