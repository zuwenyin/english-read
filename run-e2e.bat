@echo off
cd /d d:\TraeWorkSpace\english-read
echo ============================================
echo   English Read - E2E Test Runner
echo ============================================
echo.
echo Running all E2E tests with Playwright...
echo.
npx playwright test --reporter=list
echo.
echo ============================================
echo   Test complete! Opening report...
echo ============================================
npx playwright show-report e2e/report
pause
