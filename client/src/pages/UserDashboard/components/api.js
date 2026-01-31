import API_BASE_URL from '../../../config/api';

// API utility for fetching reports
export async function fetchJobReports() {
  const res = await fetch(`${API_BASE_URL}/reports/jobs`);
  if (!res.ok) throw new Error('Failed to fetch job reports');
  return res.json();
}
