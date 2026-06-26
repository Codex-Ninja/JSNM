// ========== SENSORS ==========
async function loadSensors() {
    const sensors = await apiGet('/sensors');
    if (!sensors) return;
    const tbody = document.getElementById('sensorsTable');
    if (!tbody) return;
    if (sensors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No sensors found</td></tr>';
        return;
    }
    tbody.innerHTML = sensors.map(sensor => `
        <tr>
            <td>#${sensor.sensor_id}</td>
            <td>${sensor.sensor_type}</td>
            <td>${sensor.serial_number || 'N/A'}</td>
            <td>${sensor.cable_name || 'Unassigned'}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="flex:1;background:#e2e8f0;height:8px;border-radius:4px;overflow:hidden;">
                        <div style="width:${sensor.battery_level}%;height:100%;background:${getBatteryColor(sensor.battery_level)};border-radius:4px;"></div>
                    </div>
                    <span style="font-size:12px;min-width:35px;">${sensor.battery_level}%</span>
                </div>
            </td>
            <td>${sensor.signal_strength}%</td>
            <td><span class="badge badge-${getStatusClass(sensor.status)}">${sensor.status}</span></td>
            <td><button class="btn btn-sm btn-primary" onclick="viewSensorReadings(${sensor.sensor_id})">Readings</button></td>
        </tr>
    `).join('');
}

async function viewSensorReadings(sensorId) {
    const readings = await apiGet(`/sensors/${sensorId}/readings`);
    if (!readings) return;
    const modal = document.getElementById('sensorModal');
    const modalBody = document.getElementById('sensorModalBody');
    modalBody.innerHTML = `
        <h4 class="mb-3">Sensor #${sensorId} - Recent Readings</h4>
        ${readings.length === 0 ? '<p>No readings available.</p>' : `
        <table class="data-table">
            <thead><tr><th>Time</th><th>Type</th><th>Value</th><th>Signal</th><th>Anomaly</th></tr></thead>
            <tbody>
                ${readings.map(r => `
                    <tr style="${r.is_anomaly ? 'background:#fef2f2;' : ''}">
                        <td>${formatDateTime(r.reading_time)}</td>
                        <td>${r.reading_type}</td>
                        <td><strong>${r.reading_value}</strong></td>
                        <td>${r.signal_strength}%</td>
                        <td>${r.is_anomaly ? '<span class="badge badge-danger">YES</span>' : '<span class="badge badge-secondary">No</span>'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`}
    `;
    modal.classList.add('active');
}

function getBatteryColor(level) {
    if (level > 60) return '#059669';
    if (level > 30) return '#d97706';
    return '#dc2626';
}

// ========== ASSETS ==========
async function loadAssets() {
    const assets = await apiGet('/assets');
    if (!assets) return;
    const tbody = document.getElementById('assetsTable');
    if (!tbody) return;
    if (assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No assets found</td></tr>';
        return;
    }
    tbody.innerHTML = assets.map(asset => `
        <tr>
            <td>#${asset.asset_id}</td>
            <td>${asset.cable_name}</td>
            <td><span class="badge badge-primary">${asset.cable_type}</span></td>
            <td>${asset.site_name || 'N/A'}</td>
            <td>${asset.length_km ? asset.length_km + ' km' : 'N/A'}</td>
            <td><span class="badge badge-${getStatusClass(asset.status)}">${asset.status}</span></td>
            <td>${asset.sensor_count || 0}</td>
            <td><button class="btn btn-sm btn-primary" onclick="viewAsset(${asset.asset_id})">View</button></td>
        </tr>
    `).join('');
}

async function viewAsset(id) {
    const asset = await apiGet(`/assets/${id}`);
    if (!asset) return;
    const modal = document.getElementById('assetModal');
    const modalBody = document.getElementById('assetModalBody');
    modalBody.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div>
                <p class="mb-1"><strong>Asset ID:</strong> #${asset.asset_id}</p>
                <p class="mb-1"><strong>Name:</strong> ${asset.cable_name}</p>
                <p class="mb-1"><strong>Type:</strong> ${asset.cable_type}</p>
                <p class="mb-1"><strong>Status:</strong> <span class="badge badge-${getStatusClass(asset.status)}">${asset.status}</span></p>
            </div>
            <div>
                <p class="mb-1"><strong>Location:</strong> ${asset.site_name || 'N/A'}</p>
                <p class="mb-1"><strong>Length:</strong> ${asset.length_km ? asset.length_km + ' km' : 'N/A'}</p>
                <p class="mb-1"><strong>Installed:</strong> ${asset.installation_date ? formatDate(asset.installation_date) : 'N/A'}</p>
                <p class="mb-1"><strong>Risk Level:</strong> <span class="risk-heat ${(asset.risk_level || 'low').toLowerCase()}">${asset.risk_level || 'Low'}</span></p>
            </div>
        </div>
        ${asset.sensors && asset.sensors.length > 0 ? `
        <div class="mb-3">
            <strong>Sensors (${asset.sensors.length}):</strong>
            <table class="data-table mt-2">
                <thead><tr><th>Type</th><th>Serial</th><th>Battery</th><th>Status</th></tr></thead>
                <tbody>
                    ${asset.sensors.map(s => `
                        <tr>
                            <td>${s.sensor_type}</td>
                            <td>${s.serial_number || 'N/A'}</td>
                            <td>${s.battery_level}%</td>
                            <td><span class="badge badge-${getStatusClass(s.status)}">${s.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p class="mb-3">No sensors attached to this asset.</p>'}
        ${asset.incidents && asset.incidents.length > 0 ? `
        <div>
            <strong>Incident History (${asset.incidents.length}):</strong>
            <table class="data-table mt-2">
                <thead><tr><th>Type</th><th>Severity</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${asset.incidents.map(i => `
                        <tr>
                            <td>${i.incident_type}</td>
                            <td><span class="badge badge-${getSeverityClass(i.severity)}">${i.severity}</span></td>
                            <td>${formatDate(i.incident_time)}</td>
                            <td><span class="badge badge-${getStatusClass(i.status)}">${i.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>` : '<p>No incidents recorded for this asset.</p>'}
    `;
    modal.classList.add('active');
}