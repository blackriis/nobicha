// Test compression functionality
const { compressImage, formatFileSize } = require('./apps/web/src/lib/utils/file-upload.utils.ts');

// Create a test canvas element
const canvas = document.createElement('canvas');
canvas.width = 2000;
canvas.height = 1500;

// Draw something to create a test image
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#FF0000';
ctx.fillRect(0, 0, 2000, 1500);

// Convert to blob
canvas.toBlob(async (blob) => {
  // Create a File object
  const file = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });

  console.log('Original file size:', formatFileSize(file.size));

  // Test compression
  try {
    const compressedFile = await compressImage(file, 1024, 0.8);
    console.log('Compressed file size:', formatFileSize(compressedFile.size));
    console.log('Size reduction:', ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%');
  } catch (error) {
    console.error('Compression failed:', error);
  }
}, 'image/jpeg', 1.0);