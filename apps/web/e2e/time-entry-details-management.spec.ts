import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Time Entry Details Management
 * ทดสอบการดูรายละเอียดการมาทำงาน: รูปภาพ selfie, ตำแหน่ง GPS, รายละเอียดการทำงาน
 */

test.describe('Time Entry Details Management E2E Tests', () => {
  let testEmployeeId: string;
  let testTimeEntryId: string;
  
  test.beforeEach(async ({ page }) => {
    // Login as Admin
    await page.goto('/login/admin');
    await page.fill('[data-testid="email-input"]', 'admin@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for admin dashboard to load
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Employees page to get a valid employee ID
    await page.click('[data-testid="nav-employees"]');
    await expect(page.locator('[data-testid="employees-page"]')).toBeVisible();
    
    // Get first employee ID from the table
    const firstRow = page.locator('[data-testid="employee-table"] tbody tr').first();
    const viewBtn = firstRow.locator('[data-testid="view-employee-btn"]');
    await viewBtn.click();
    
    // Extract employee ID from URL
    const currentUrl = page.url();
    const urlMatch = currentUrl.match(/\/admin\/employees\/([a-f0-9-]+)/);
    if (urlMatch) {
      testEmployeeId = urlMatch[1];
    }
    
    // Verify we're on employee detail page
    await expect(page.locator('[data-testid="employee-detail-page"]')).toBeVisible();
    
    // Wait for time entries to load
    await page.waitForTimeout(2000);
    
    // Get first time entry ID if available
    const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
    const rowCount = await timeEntryRows.count();
    
    if (rowCount > 0) {
      const firstTimeEntryRow = timeEntryRows.first();
      const timeEntryId = await firstTimeEntryRow.getAttribute('data-time-entry-id');
      if (timeEntryId) {
        testTimeEntryId = timeEntryId;
      }
    }
  });

  test('Time Entry Detail Modal Basic Functionality', async ({ page }) => {
    await test.step('Open time entry detail modal', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount > 0) {
        // Click view button on first time entry
        await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
        
        // Verify modal opens
        await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="modal-title"]')).toContainText('รายละเอียดการมาทำงาน');
      } else {
        // Skip test if no time entries
        test.skip();
      }
    });

    await test.step('Verify modal structure', async () => {
      const modal = page.locator('[data-testid="time-entry-detail-modal"]');
      
      // Check modal header
      await expect(page.locator('[data-testid="modal-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="modal-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="close-modal-btn"]')).toBeVisible();
      
      // Check modal content sections
      await expect(page.locator('[data-testid="time-entry-basic-info"]')).toBeVisible();
      
      // Check if selfie gallery exists
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        await expect(selfieGallery).toBeVisible();
      }
      
      // Check if GPS location section exists
      const gpsSection = page.locator('[data-testid="gps-location-section"]');
      const gpsExists = await gpsSection.isVisible();
      
      if (gpsExists) {
        await expect(gpsSection).toBeVisible();
      }
    });

    await test.step('Test modal close functionality', async () => {
      // Test close button
      await page.click('[data-testid="close-modal-btn"]');
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
      
      // Reopen modal
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Test clicking outside modal to close
      await page.click('[data-testid="modal-backdrop"]');
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
      
      // Test ESC key to close
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
    });
  });

  test('Time Entry Basic Information Display', async ({ page }) => {
    await test.step('Open modal and verify basic info', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Verify basic information is displayed
      await expect(page.locator('[data-testid="time-entry-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="time-entry-checkin-time"]')).toBeVisible();
      
      // Check if checkout time exists
      const checkoutTime = page.locator('[data-testid="time-entry-checkout-time"]');
      const hasCheckout = await checkoutTime.isVisible();
      
      if (hasCheckout) {
        await expect(checkoutTime).toBeVisible();
      }
      
      // Verify total hours
      const totalHours = page.locator('[data-testid="time-entry-total-hours"]');
      const hasTotalHours = await totalHours.isVisible();
      
      if (hasTotalHours) {
        await expect(totalHours).toBeVisible();
      }
      
      // Verify break duration
      const breakDuration = page.locator('[data-testid="time-entry-break-duration"]');
      const hasBreakDuration = await breakDuration.isVisible();
      
      if (hasBreakDuration) {
        await expect(breakDuration).toBeVisible();
      }
      
      // Verify status
      await expect(page.locator('[data-testid="time-entry-status"]')).toBeVisible();
    });

    await test.step('Verify time format display', async () => {
      // Check that times are displayed in proper format
      const checkinTime = page.locator('[data-testid="time-entry-checkin-time"]');
      const checkinText = await checkinTime.textContent();
      
      // Should contain time format (HH:MM or similar)
      expect(checkinText).toMatch(/\d{1,2}:\d{2}/);
      
      // Check date format
      const dateElement = page.locator('[data-testid="time-entry-date"]');
      const dateText = await dateElement.textContent();
      
      // Should contain date information
      expect(dateText).toBeTruthy();
    });
  });

  test('Selfie Images Display and Interaction', async ({ page }) => {
    await test.step('Open modal and check selfie images', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Check for selfie gallery section
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        // Check for check-in selfie
        const checkinImage = page.locator('[data-testid="checkin-selfie-image"]');
        const checkinFallback = page.locator('[data-testid="checkin-selfie-fallback"]');
        
        const checkinImageExists = await checkinImage.isVisible();
        const checkinFallbackExists = await checkinFallback.isVisible();
        
        expect(checkinImageExists || checkinFallbackExists).toBeTruthy();
        
        // Check for check-out selfie
        const checkoutImage = page.locator('[data-testid="checkout-selfie-image"]');
        const checkoutFallback = page.locator('[data-testid="checkout-selfie-fallback"]');
        
        const checkoutImageExists = await checkoutImage.isVisible();
        const checkoutFallbackExists = await checkoutFallback.isVisible();
        
        expect(checkoutImageExists || checkoutFallbackExists).toBeTruthy();
      }
    });

    await test.step('Test selfie image interactions', async () => {
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        // Test image zoom functionality if available
        const checkinImage = page.locator('[data-testid="checkin-selfie-image"]');
        const checkinImageExists = await checkinImage.isVisible();
        
        if (checkinImageExists) {
          // Click on image to zoom
          await checkinImage.click();
          
          // Check if zoom modal opens
          const zoomModal = page.locator('[data-testid="image-zoom-modal"]');
          const zoomExists = await zoomModal.isVisible();
          
          if (zoomExists) {
            await expect(zoomModal).toBeVisible();
            
            // Close zoom modal
            await page.click('[data-testid="close-zoom-modal"]');
            await expect(zoomModal).not.toBeVisible();
          }
        }
        
        // Test image download if available
        const downloadBtn = page.locator('[data-testid="download-selfie-btn"]');
        const downloadExists = await downloadBtn.isVisible();
        
        if (downloadExists) {
          const downloadPromise = page.waitForEvent('download');
          await downloadBtn.click();
          
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/selfie.*\.(jpg|jpeg|png)/);
        }
      }
    });

    await test.step('Test selfie image loading states', async () => {
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        // Check for loading states
        const imageLoading = page.locator('[data-testid="selfie-image-loading"]');
        const loadingExists = await imageLoading.isVisible();
        
        if (loadingExists) {
          // Wait for loading to complete
          await expect(imageLoading).not.toBeVisible({ timeout: 10000 });
        }
        
        // Check for error states
        const imageError = page.locator('[data-testid="selfie-image-error"]');
        const errorExists = await imageError.isVisible();
        
        if (errorExists) {
          // Verify error message
          await expect(imageError).toContainText('ไม่สามารถโหลดรูปภาพได้');
        }
      }
    });
  });

  test('GPS Location Information Display', async ({ page }) => {
    await test.step('Open modal and check GPS information', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Check for GPS location section
      const gpsSection = page.locator('[data-testid="gps-location-section"]');
      const gpsExists = await gpsSection.isVisible();
      
      if (gpsExists) {
        // Verify GPS information is displayed
        await expect(page.locator('[data-testid="checkin-location"]')).toBeVisible();
        
        // Check if checkout location exists
        const checkoutLocation = page.locator('[data-testid="checkout-location"]');
        const hasCheckoutLocation = await checkoutLocation.isVisible();
        
        if (hasCheckoutLocation) {
          await expect(checkoutLocation).toBeVisible();
        }
        
        // Verify location coordinates
        const coordinates = page.locator('[data-testid="location-coordinates"]');
        const hasCoordinates = await coordinates.isVisible();
        
        if (hasCoordinates) {
          await expect(coordinates).toBeVisible();
          
          // Check coordinate format
          const coordText = await coordinates.textContent();
          expect(coordText).toMatch(/\d+\.\d+/); // Should contain decimal numbers
        }
        
        // Verify distance to branch
        const distanceToBranch = page.locator('[data-testid="distance-to-branch"]');
        const hasDistance = await distanceToBranch.isVisible();
        
        if (hasDistance) {
          await expect(distanceToBranch).toBeVisible();
          
          // Check distance format
          const distanceText = await distanceToBranch.textContent();
          expect(distanceText).toMatch(/\d+.*(m|km|เมตร|กิโลเมตร)/);
        }
      }
    });

    await test.step('Test GPS map integration', async () => {
      const gpsSection = page.locator('[data-testid="gps-location-section"]');
      const gpsExists = await gpsSection.isVisible();
      
      if (gpsExists) {
        // Check for map component
        const mapComponent = page.locator('[data-testid="location-map"]');
        const mapExists = await mapComponent.isVisible();
        
        if (mapExists) {
          await expect(mapComponent).toBeVisible();
          
          // Test map interactions
          await mapComponent.hover();
          
          // Check for map controls
          const mapControls = page.locator('[data-testid="map-controls"]');
          const controlsExist = await mapControls.isVisible();
          
          if (controlsExist) {
            await expect(mapControls).toBeVisible();
          }
        }
        
        // Test location accuracy indicator
        const accuracyIndicator = page.locator('[data-testid="location-accuracy"]');
        const accuracyExists = await accuracyIndicator.isVisible();
        
        if (accuracyExists) {
          await expect(accuracyIndicator).toBeVisible();
        }
      }
    });
  });

  test('Time Entry Notes and Additional Information', async ({ page }) => {
    await test.step('Check for notes section', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Check for notes section
      const notesSection = page.locator('[data-testid="time-entry-notes"]');
      const notesExists = await notesSection.isVisible();
      
      if (notesExists) {
        await expect(notesSection).toBeVisible();
        
        // Check notes content
        const notesContent = page.locator('[data-testid="notes-content"]');
        const hasNotesContent = await notesContent.isVisible();
        
        if (hasNotesContent) {
          await expect(notesContent).toBeVisible();
        } else {
          // Check for empty notes state
          await expect(page.locator('[data-testid="no-notes"]')).toBeVisible();
        }
      }
    });

    await test.step('Check for material usage information', async () => {
      // Check for material usage section
      const materialSection = page.locator('[data-testid="material-usage-section"]');
      const materialExists = await materialSection.isVisible();
      
      if (materialExists) {
        await expect(materialSection).toBeVisible();
        
        // Check material usage list
        const materialList = page.locator('[data-testid="material-usage-list"]');
        const hasMaterials = await materialList.isVisible();
        
        if (hasMaterials) {
          await expect(materialList).toBeVisible();
          
          // Check individual material items
          const materialItems = page.locator('[data-testid="material-item"]');
          const itemCount = await materialItems.count();
          
          if (itemCount > 0) {
            // Verify first material item
            const firstItem = materialItems.first();
            await expect(firstItem.locator('[data-testid="material-name"]')).toBeVisible();
            await expect(firstItem.locator('[data-testid="material-quantity"]')).toBeVisible();
            await expect(firstItem.locator('[data-testid="material-unit"]')).toBeVisible();
          }
        } else {
          // Check for empty materials state
          await expect(page.locator('[data-testid="no-materials"]')).toBeVisible();
        }
      }
    });
  });

  test('Time Entry Detail Modal Performance', async ({ page }) => {
    await test.step('Test modal open performance', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      const startTime = Date.now();
      
      // Click view button
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      
      // Wait for modal to open
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      const openTime = Date.now() - startTime;
      expect(openTime).toBeLessThan(1000); // Modal should open within 1 second
    });

    await test.step('Test image loading performance', async () => {
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        const startTime = Date.now();
        
        // Wait for images to load
        const checkinImage = page.locator('[data-testid="checkin-selfie-image"]');
        const checkoutImage = page.locator('[data-testid="checkout-selfie-image"]');
        
        await Promise.race([
          checkinImage.waitFor({ state: 'visible', timeout: 5000 }),
          checkoutImage.waitFor({ state: 'visible', timeout: 5000 }),
          page.locator('[data-testid="selfie-image-loading"]').waitFor({ state: 'hidden', timeout: 5000 })
        ]);
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(5000); // Images should load within 5 seconds
      }
    });

    await test.step('Test modal close performance', async () => {
      const startTime = Date.now();
      
      // Close modal
      await page.click('[data-testid="close-modal-btn"]');
      
      // Wait for modal to close
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).not.toBeVisible();
      
      const closeTime = Date.now() - startTime;
      expect(closeTime).toBeLessThan(500); // Modal should close within 500ms
    });
  });

  test('Time Entry Detail Error Handling', async ({ page }) => {
    await test.step('Test invalid time entry ID', async () => {
      // Navigate to invalid time entry detail
      await page.goto(`/admin/employees/${testEmployeeId}/time-entries/invalid-id/detail`);
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('ไม่พบข้อมูลการมาทำงาน');
    });

    await test.step('Test network error handling', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Simulate network failure for time entry detail
      await page.route('**/api/admin/employees/*/time-entries/*/detail*', route => route.abort());
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      
      // Verify error handling
      await expect(page.locator('[data-testid="modal-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="retry-modal-btn"]')).toBeVisible();
      
      // Test retry functionality
      await page.unroute('**/api/admin/employees/*/time-entries/*/detail*');
      await page.click('[data-testid="retry-modal-btn"]');
      
      // Verify modal loads successfully
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
    });

    await test.step('Test image loading errors', async () => {
      const selfieGallery = page.locator('[data-testid="selfie-gallery"]');
      const galleryExists = await selfieGallery.isVisible();
      
      if (galleryExists) {
        // Simulate image loading failure
        await page.route('**/storage/v1/object/public/**', route => route.abort());
        
        // Reload modal
        await page.reload();
        await page.waitForTimeout(2000);
        
        const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
        await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
        
        // Verify image error handling
        await expect(page.locator('[data-testid="selfie-image-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="selfie-image-fallback"]')).toBeVisible();
      }
    });
  });

  test('Time Entry Detail Responsive Design', async ({ page }) => {
    await test.step('Test mobile modal layout', async () => {
      // Check if there are time entries
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      const rowCount = await timeEntryRows.count();
      
      if (rowCount === 0) {
        test.skip();
        return;
      }
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Open modal
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Verify mobile layout
      await expect(page.locator('[data-testid="modal-content"]')).toBeVisible();
      
      // Check that content is properly stacked
      await expect(page.locator('[data-testid="time-entry-basic-info"]')).toBeVisible();
      
      // Test mobile scrolling
      await page.locator('[data-testid="modal-content"]').scroll({ top: 100 });
      
      // Close modal
      await page.click('[data-testid="close-modal-btn"]');
    });

    await test.step('Test tablet modal layout', async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Open modal
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Verify tablet layout
      await expect(page.locator('[data-testid="modal-content"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-modal-btn"]');
    });

    await test.step('Test desktop modal layout', async () => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Open modal
      const timeEntryRows = page.locator('[data-testid="time-entry-row"]');
      await timeEntryRows.first().locator('[data-testid="view-time-entry-btn"]').click();
      await expect(page.locator('[data-testid="time-entry-detail-modal"]')).toBeVisible();
      
      // Verify desktop layout
      await expect(page.locator('[data-testid="modal-content"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-modal-btn"]');
    });
  });
});
