// SENSORS API
app.get('/api/sensors', authenticateToken, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT s.*, a.cable_name, l.site_name 
         FROM sensors s
         LEFT JOIN assets a ON s.asset_id = a.asset_id
         LEFT JOIN locations l ON a.location_id = l.location_id
         ORDER BY s.created_at DESC`
    );
    res.json(rows);
});

app.get('/api/sensors/:id/readings', authenticateToken, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT * FROM sensor_readings 
         WHERE sensor_id = ? 
         ORDER BY reading_time DESC 
         LIMIT 100`,
        [req.params.id]
    );
    res.json(rows);
});

// ASSETS API
app.get('/api/assets', authenticateToken, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT a.*, l.site_name, l.latitude, l.longitude, l.risk_level,
         COUNT(s.sensor_id) as sensor_count
         FROM assets a
         LEFT JOIN locations l ON a.location_id = l.location_id
         LEFT JOIN sensors s ON a.asset_id = s.asset_id
         GROUP BY a.asset_id
         ORDER BY a.created_at DESC`
    );
    res.json(rows);
});

app.get('/api/assets/:id', authenticateToken, async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT a.*, l.* FROM assets a
         LEFT JOIN locations l ON a.location_id = l.location_id
         WHERE a.asset_id = ?`,
        [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Asset not found' });
    
    const [sensors] = await pool.execute('SELECT * FROM sensors WHERE asset_id = ?', [req.params.id]);
    const [incidents] = await pool.execute('SELECT * FROM incidents WHERE asset_id = ? ORDER BY incident_time DESC', [req.params.id]);
    
    res.json({ ...rows[0], sensors, incidents });
});