import fetch from 'node-fetch';

async function getToken(){
  const url = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}/api/amadeus-token` : 'http://localhost:3000/api/amadeus-token';
  const r = await fetch(url,{method:'POST'});
  const j = await r.json();
  return j.access_token;
}

export default async function handler(req, res){
  const { keyword } = req.body||{};
  if(!keyword) return res.status(400).json({ error:'missing_keyword' });
  const base = process.env.AMAD_ENV === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
  const token = await getToken();
  const url = new URL(`${base}/v1/reference-data/locations`);
  url.searchParams.set('keyword', keyword);
  url.searchParams.set('subType','CITY,AIRPORT');
  url.searchParams.set('page[limit]','5');
  const r = await fetch(url.toString(),{ headers:{ Authorization: `Bearer ${token}` }});
  const j = await r.json();
  if(!r.ok) return res.status(r.status).json(j);
  const items = (j.data||[]).map(x=>({ iataCode: x.iataCode, name: x.name, subType: x.subType }));
  res.status(200).json({ items });
}
