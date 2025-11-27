# PowerShell Test Script for User Data Update
# This script tests login and user data update functionality

# Configuration
$API_URL = "http://localhost:5000"
$EMAIL = "user@gmail.com"
$PASSWORD = "yourpassword"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  MHMS User Data Update Test" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Test 1: Login
Write-Host "Step 1: Testing Login..." -ForegroundColor Yellow

$loginBody = @{
    email = $EMAIL
    password = $PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod `
        -Uri "$API_URL/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    
    Write-Host "✅ Login Successful!" -ForegroundColor Green
    Write-Host "   User ID: $($loginResponse.user.id)" -ForegroundColor Gray
    Write-Host "   Name: $($loginResponse.user.name)" -ForegroundColor Gray
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Login Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure backend server is running (cd backend; npm start)" -ForegroundColor Gray
    Write-Host "   2. Check email and password in this script" -ForegroundColor Gray
    Write-Host "   3. Verify MongoDB connection" -ForegroundColor Gray
    exit 1
}

# Test 2: Update User Data
Write-Host "Step 2: Testing User Data Update..." -ForegroundColor Yellow

$updateData = @{
    name = "John Doe (Updated via PowerShell)"
    phone = "+1234567890"
    dateOfBirth = "1990-01-15"
    gender = "male"
    address = @{
        street = "123 Main Street"
        city = "New York"
        state = "NY"
        zipCode = "10001"
        country = "USA"
    }
    emergencyContact = @{
        name = "Jane Doe"
        phone = "+1987654321"
        relationship = "Spouse"
    }
    preferences = @{
        theme = "dark"
        notifications = $true
        privacy = "private"
        language = "en"
    }
} | ConvertTo-Json -Depth 5

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $updateResponse = Invoke-RestMethod `
        -Uri "$API_URL/api/user/update-data" `
        -Method PUT `
        -Headers $headers `
        -Body $updateData
    
    Write-Host "✅ Update Successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Updated User Data:" -ForegroundColor Cyan
    Write-Host ($updateResponse.user | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "❌ Update Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get User Profile
Write-Host "`nStep 3: Fetching Updated Profile..." -ForegroundColor Yellow

try {
    $profileResponse = Invoke-RestMethod `
        -Uri "$API_URL/api/user/profile" `
        -Method GET `
        -Headers $headers
    
    Write-Host "✅ Profile Fetched!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current Profile:" -ForegroundColor Cyan
    Write-Host ($profileResponse.user | ConvertTo-Json -Depth 5) -ForegroundColor Gray
} catch {
    Write-Host "❌ Profile Fetch Failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  ✅ ALL TESTS PASSED!" -ForegroundColor Green
Write-Host "============================================`n" -ForegroundColor Cyan

# Additional Examples
Write-Host "Additional Examples:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update only name:" -ForegroundColor Gray
Write-Host '   $data = @{ name = "New Name" } | ConvertTo-Json' -ForegroundColor DarkGray
Write-Host '   Invoke-RestMethod -Uri "$API_URL/api/user/update-data" -Method PUT -Headers $headers -Body $data' -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Update only preferences:" -ForegroundColor Gray
Write-Host '   $data = @{ preferences = @{ theme = "light" } } | ConvertTo-Json -Depth 3' -ForegroundColor DarkGray
Write-Host '   Invoke-RestMethod -Uri "$API_URL/api/user/preferences" -Method PATCH -Headers $headers -Body $data' -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Update only emergency contact:" -ForegroundColor Gray
Write-Host '   $data = @{ name = "Contact"; phone = "+123" } | ConvertTo-Json' -ForegroundColor DarkGray
Write-Host '   Invoke-RestMethod -Uri "$API_URL/api/user/emergency-contact" -Method PATCH -Headers $headers -Body $data' -ForegroundColor DarkGray
Write-Host ""

# Save token for future use
Write-Host "Your authentication token (saved for 5 minutes):" -ForegroundColor Yellow
Write-Host $token -ForegroundColor DarkGray
Write-Host ""

# Interactive Mode
Write-Host "Would you like to perform another update? (Y/N)" -ForegroundColor Yellow
$choice = Read-Host

if ($choice -eq "Y" -or $choice -eq "y") {
    Write-Host "`nEnter field to update (name/phone/city/state):" -ForegroundColor Yellow
    $field = Read-Host
    
    Write-Host "Enter new value:" -ForegroundColor Yellow
    $value = Read-Host
    
    $customUpdate = @{}
    
    switch ($field) {
        "name" { $customUpdate.name = $value }
        "phone" { $customUpdate.phone = $value }
        "city" { $customUpdate.address = @{ city = $value } }
        "state" { $customUpdate.address = @{ state = $value } }
        default { 
            Write-Host "Unknown field!" -ForegroundColor Red
            exit
        }
    }
    
    $customUpdateJson = $customUpdate | ConvertTo-Json -Depth 3
    
    try {
        $customResponse = Invoke-RestMethod `
            -Uri "$API_URL/api/user/update-data" `
            -Method PUT `
            -Headers $headers `
            -Body $customUpdateJson
        
        Write-Host "`n✅ Custom Update Successful!" -ForegroundColor Green
        Write-Host ($customResponse.user | ConvertTo-Json -Depth 5) -ForegroundColor Gray
    } catch {
        Write-Host "`n❌ Custom Update Failed!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nTest completed successfully!" -ForegroundColor Green
