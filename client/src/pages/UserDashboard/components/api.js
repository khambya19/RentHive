// API utility for fetching reports
export async function fetchJobReports() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
  const res = await fetch(`${apiUrl}/reports/jobs`);
  if (!res.ok) throw new Error('Failed to fetch job reports');
  return res.json();
}
