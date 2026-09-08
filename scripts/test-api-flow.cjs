async function test() {
  const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cliente@securelife.com', password: 'Password123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data.tokens.accessToken;
  console.log('Login OK. User:', loginData.data.user.email);

  const summaryRes = await fetch('http://localhost:3000/api/v1/dashboard/summary', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('Summary status:', summaryRes.status);
  const summaryData = await summaryRes.json();
  console.log('Summary Data from DB Stored Procedure:', summaryData);

  const policiesRes = await fetch('http://localhost:3000/api/v1/dashboard/policies', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const policiesData = await policiesRes.json();
  console.log('Policies Data from DB View/SP:', policiesData);

  const activityRes = await fetch('http://localhost:3000/api/v1/dashboard/activity', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const activityData = await activityRes.json();
  console.log('Activity Data from DB View/SP:', activityData);
}

test().catch(console.error);
