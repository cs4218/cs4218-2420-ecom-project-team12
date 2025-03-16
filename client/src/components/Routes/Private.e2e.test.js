import { test, expect } from '@playwright/test';

//author:@thennant with reference: https://chatgpt.com/share/67d6c293-bf18-800a-a3f0-8963ba9dc691
describe("UI tests for authenticated routes", () => {
    test.describe('Authenticated User Dashboard Access', () => {
      
      test.beforeEach(async ({ page }) => {
        
        await page.goto('http://localhost:3000');
        
        await page.evaluate(() => {
          localStorage.setItem('token', 'valid-token');
        });
      });
    
      test('authenticated user can access /dashboard/user', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user');
        
        await expect(page.locator('text=Dashboard User')).toBeVisible();
      });
    
      test('authenticated user can access /dashboard/user/profile', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user/profile');
        await expect(page.locator('text=User Profile')).toBeVisible();
      });
    
      test('authenticated user can access /dashboard/user/orders', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user/orders');
        await expect(page.locator('text=User Orders')).toBeVisible();
      });
    
      test('authenticated user remains logged in after page refresh', async ({ page }) => {
        await page.goto('http://localhost:3000/dashboard/user/profile');
        await expect(page.locator('text=User Profile')).toBeVisible();
        
        await page.reload();
        await expect(page.locator('text=User Profile')).toBeVisible();
      });
    });
  
  
  });