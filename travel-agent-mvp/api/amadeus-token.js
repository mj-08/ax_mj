import fetch from 'node-fetch';

let cached = { token: null, exp: 0 };

export default async function handler(req, res){
  if(Date.now() < cached.exp && cached.token){
    return res.status(200).json({ access_token: cached.token });
  }
  const base = process.env.AMAD_ENV === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMAD_CLIENT_ID,
    client_secret: process.env.AMAD_CLIENT_SECRET
  });
  const r = await fetch(`${base}/v1/security/oauth2/token`,{
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body
  });
  if(!r.ok){
    const txt = await r.text();
    return res.status(500).json({ error:'amadeus_oauth_failed', detail: txt });
  }
  const json = await r.json();
  cached.token = json.access_token; cached.exp = Date.now() + (json.expires_in-60)*1000;
  res.status(200).json({ access_token: cached.token });
}
