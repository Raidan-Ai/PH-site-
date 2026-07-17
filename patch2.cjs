const fs = require('fs');
let code = fs.readFileSync('src/pages/WednesdayCinema.tsx', 'utf8');

// Insert import for CinemaCalendar
code = code.replace(
  "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';",
  "import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';\nimport CinemaCalendar from '../components/CinemaCalendar';"
);

// Insert age_group in ticket form
const ageGroupSelect = `
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">
                          {isRtl ? 'الفئة العمرية' : 'Age Group'} <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={ageGroup}
                          onChange={(e) => setAgeGroup(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                        >
                          <option value="">{isRtl ? 'اختر الفئة العمرية' : 'Select Age Group'}</option>
                          <option value="18-24">18 - 24</option>
                          <option value="25-34">25 - 34</option>
                          <option value="35-44">35 - 44</option>
                          <option value="45+">45+</option>
                        </select>
                      </div>
`;

code = code.replace(
  "{/* Ticket Modal */}",
  "{/* Ticket Modal */}"
);

code = code.replace(
  "<div>\n                        <label className=\"block text-sm font-bold text-slate-700 mb-1.5\">\n                          {isRtl ? 'رقم الواتساب' : 'WhatsApp Number'}",
  ageGroupSelect + "\n                      <div>\n                        <label className=\"block text-sm font-bold text-slate-700 mb-1.5\">\n                          {isRtl ? 'رقم الواتساب' : 'WhatsApp Number'}"
);

// Add the Mini Dashboard inside container
const dashboardHTML = `
            {/* Stats Mini Dashboard */}
            {stats && (
              <section className="mb-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Total Attendance */}
                  <div className="bg-emerald-600 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden shadow-lg">
                    <div className="absolute -right-6 -top-6 opacity-10">
                      <Users className="w-48 h-48" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-medium text-emerald-100 mb-2">{isRtl ? 'إجمالي حضور النقاشات' : 'Total Discussion Attendance'}</h3>
                      <div className="text-6xl font-black">{stats.totalAttendance}</div>
                      <div className="mt-4 flex items-center text-sm font-bold bg-emerald-500/50 w-max px-3 py-1 rounded-full">
                        <Activity className="w-4 h-4 ml-1.5" />
                        مشارك مسجل
                      </div>
                    </div>
                  </div>

                  {/* Age Distribution Chart */}
                  <div className="md:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                      <div className="w-2 h-6 bg-emerald-500 rounded-full ml-3"></div>
                      {isRtl ? 'توزيع الفئات العمرية للمشاركين' : 'Age Group Distribution'}
                    </h3>
                    <div className="h-48 w-full flex-grow relative">
                      {stats.ageDistribution && stats.ageDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.ageDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {stats.ageDistribution.map((entry, index) => {
                                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];
                                return <Cell key={\`cell-\${index}\`} fill={colors[index % colors.length]} />;
                              })}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                              itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                            />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                          {isRtl ? 'لا توجد بيانات كافية' : 'Not enough data'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Cinema Calendar */}
            <section className="mb-16">
               <div className="flex items-center space-x-3 space-x-reverse mb-10">
                 <h2 className="text-3xl font-black text-slate-900">
                   {isRtl ? 'التقويم السينمائي' : 'Cinema Calendar'}
                 </h2>
                 <div className="h-px bg-slate-200 flex-grow rounded"></div>
               </div>
               <CinemaCalendar shows={shows} onTicketRequest={handleOpenTicket} />
            </section>
`;

code = code.replace(
  "{/* Upcoming Shows */}",
  dashboardHTML + "\n            {/* Upcoming Shows */}"
);

fs.writeFileSync('src/pages/WednesdayCinema.tsx', code);
