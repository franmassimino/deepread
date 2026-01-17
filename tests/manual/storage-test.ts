import { storageService, getPdfPath, getImagePath } from '@/src/lib/services/storage';

async function testStorageService() {
  console.log('\n=== Testing Storage Service ===\n');

  const testBookId = 'manual-test-book-' + Date.now();
  const testChapterId = 'manual-test-chapter-1';

  try {
    // Test 1: Save PDF
    console.log('1. Testing PDF save...');
    const pdfPath = getPdfPath(testBookId, 'test.pdf');
    const pdfBuffer = Buffer.from('%PDF-1.4 Test PDF Content with some data');
    const savedPath = await storageService.saveFile(pdfPath, pdfBuffer);
    console.log('   ✓ PDF saved to:', savedPath);

    // Test 2: Check file exists
    console.log('\n2. Testing file existence...');
    const exists = await storageService.fileExists(pdfPath);
    console.log('   ✓ File exists:', exists);
    if (!exists) {
      throw new Error('File should exist but does not!');
    }

    // Test 3: Get file size
    console.log('\n3. Testing file size...');
    const size = await storageService.getFileSize(pdfPath);
    console.log('   ✓ File size:', size, 'bytes');
    console.log('   ✓ Expected size:', pdfBuffer.length, 'bytes');
    if (size !== pdfBuffer.length) {
      throw new Error(`Size mismatch! Expected ${pdfBuffer.length}, got ${size}`);
    }

    // Test 4: Save multiple images
    console.log('\n4. Testing multiple image saves...');
    const images = ['image-1.png', 'image-2.png', 'image-3.png'];
    for (const imageName of images) {
      const imagePath = getImagePath(testBookId, testChapterId, imageName);
      const imageBuffer = Buffer.from(`fake image data for ${imageName}`);
      await storageService.saveFile(imagePath, imageBuffer);
      console.log(`   ✓ Image saved: ${imageName}`);
    }

    // Test 5: List files in chapter directory
    console.log('\n5. Testing directory listing...');
    const imageDir = `images/${testBookId}/${testChapterId}`;
    const fileList = await storageService.listFiles(imageDir);
    console.log('   ✓ Files in directory:', fileList.length);
    console.log('   ✓ Files:', fileList.join(', '));
    if (fileList.length !== 3) {
      throw new Error(`Expected 3 files, found ${fileList.length}`);
    }

    // Test 6: Retrieve file
    console.log('\n6. Testing file retrieval...');
    const retrieved = await storageService.getFile(pdfPath);
    console.log('   ✓ Retrieved', retrieved.length, 'bytes');
    console.log('   ✓ Content matches:', retrieved.toString() === pdfBuffer.toString());
    if (retrieved.toString() !== pdfBuffer.toString()) {
      throw new Error('Retrieved content does not match original!');
    }

    // Test 7: Delete individual file
    console.log('\n7. Testing individual file deletion...');
    const firstImagePath = getImagePath(testBookId, testChapterId, images[0]);
    await storageService.deleteFile(firstImagePath);
    const stillExists = await storageService.fileExists(firstImagePath);
    console.log('   ✓ File deleted, exists:', stillExists);
    if (stillExists) {
      throw new Error('File should be deleted but still exists!');
    }

    // Test 8: Save image to different chapter
    console.log('\n8. Testing multi-chapter support...');
    const chapter2Id = 'chapter-2';
    const chapter2ImagePath = getImagePath(testBookId, chapter2Id, 'chapter2-image.png');
    await storageService.saveFile(chapter2ImagePath, Buffer.from('chapter 2 image'));
    console.log('   ✓ Image saved to chapter 2');

    // Test 9: Verify isolation between chapters
    console.log('\n9. Testing chapter isolation...');
    const ch1Files = await storageService.listFiles(`images/${testBookId}/${testChapterId}`);
    const ch2Files = await storageService.listFiles(`images/${testBookId}/${chapter2Id}`);
    console.log('   ✓ Chapter 1 files:', ch1Files.length, '(should be 2 after deletion)');
    console.log('   ✓ Chapter 2 files:', ch2Files.length, '(should be 1)');
    if (ch1Files.length !== 2 || ch2Files.length !== 1) {
      throw new Error('Chapter isolation failed!');
    }

    // Test 10: Cleanup all book files
    console.log('\n10. Testing comprehensive book cleanup...');
    const pdfExists1 = await storageService.fileExists(pdfPath);
    const img1Exists = await storageService.fileExists(getImagePath(testBookId, testChapterId, images[1]));
    const img2Exists = await storageService.fileExists(chapter2ImagePath);
    console.log('   - Before cleanup: PDF exists:', pdfExists1);
    console.log('   - Before cleanup: Chapter 1 image exists:', img1Exists);
    console.log('   - Before cleanup: Chapter 2 image exists:', img2Exists);

    await storageService.deleteBookFiles(testBookId);

    const pdfExists2 = await storageService.fileExists(pdfPath);
    const img1Exists2 = await storageService.fileExists(getImagePath(testBookId, testChapterId, images[1]));
    const img2Exists2 = await storageService.fileExists(chapter2ImagePath);
    console.log('   ✓ After cleanup: PDF exists:', pdfExists2);
    console.log('   ✓ After cleanup: Chapter 1 image exists:', img1Exists2);
    console.log('   ✓ After cleanup: Chapter 2 image exists:', img2Exists2);

    if (pdfExists2 || img1Exists2 || img2Exists2) {
      throw new Error('Some files still exist after cleanup!');
    }

    // Test 11: Error handling - non-existent file
    console.log('\n11. Testing error handling...');
    try {
      await storageService.getFile('non-existent-file.pdf');
      throw new Error('Should have thrown error for non-existent file!');
    } catch (error: any) {
      if (error.name === 'StorageError') {
        console.log('   ✓ StorageError thrown correctly');
        console.log('   ✓ Error operation:', error.operation);
        console.log('   ✓ Error path:', error.path);
      } else {
        throw error;
      }
    }

    // Test 12: Large file handling
    console.log('\n12. Testing large file handling...');
    const largeBookId = 'large-file-test-' + Date.now();
    const largeFilePath = getPdfPath(largeBookId, 'large.pdf');
    const largeBuffer = Buffer.alloc(1024 * 1024, 'x'); // 1MB
    await storageService.saveFile(largeFilePath, largeBuffer);
    const largeFileSize = await storageService.getFileSize(largeFilePath);
    console.log('   ✓ Large file saved:', (largeFileSize / 1024 / 1024).toFixed(2), 'MB');
    await storageService.deleteBookFiles(largeBookId);
    console.log('   ✓ Large file cleaned up');

    console.log('\n✅ All storage tests passed!\n');
    console.log('Summary:');
    console.log('  - PDF save/retrieve: ✓');
    console.log('  - Image save/retrieve: ✓');
    console.log('  - File size calculation: ✓');
    console.log('  - Directory listing: ✓');
    console.log('  - Individual file deletion: ✓');
    console.log('  - Multi-chapter support: ✓');
    console.log('  - Chapter isolation: ✓');
    console.log('  - Book cleanup: ✓');
    console.log('  - Error handling: ✓');
    console.log('  - Large file handling: ✓');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nCleaning up test files...');
    try {
      await storageService.deleteBookFiles(testBookId);
      console.log('✓ Cleanup successful');
    } catch (cleanupError) {
      console.error('✗ Cleanup failed:', cleanupError);
    }
    process.exit(1);
  }
}

// Run the tests
console.log('Starting manual storage service tests...');
console.log('Storage path:', process.env.STORAGE_PATH || './storage');
testStorageService();
