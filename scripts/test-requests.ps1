for ($i = 1; $i -le 15; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/orders"

        Write-Host "Request $i -> Respondio: $($response.instance) | Delay: $($response.delayMs) ms"
    }
    catch {
        Write-Host "Request $i -> Error: $($_.Exception.Message)"
    }

    Start-Sleep -Milliseconds 300
}