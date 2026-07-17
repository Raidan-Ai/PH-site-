const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const statsEndpoint = `
// Get cinema stats
app.get('/api/cinema/stats', async (req, res) => {
  try {
    const [tickets] = await pool.query("SELECT * FROM cinema_tickets WHERE status = 'approved'");
    let totalAttendance = 0;
    const ageGroups = {};

    if (Array.isArray(tickets)) {
      totalAttendance = tickets.length;
      tickets.forEach(t => {
        const group = t.age_group || 'غير محدد';
        if (!ageGroups[group]) ageGroups[group] = 0;
        ageGroups[group]++;
      });
    }

    const ageDistribution = Object.keys(ageGroups).map(key => ({
      name: key,
      value: ageGroups[key]
    }));

    res.json({ success: true, totalAttendance, ageDistribution });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
`;

code = code.replace('app.get(\'/api/cinema/tickets\',', statsEndpoint + '\napp.get(\'/api/cinema/tickets\',');
fs.writeFileSync('server.ts', code);
