import fetch from 'node-fetch';

async function getToken(){
  const url = process.env.VERCEL_URL? `https://${process.env.VERCEL_URL}/api/amadeus-token` : 'http://localhost:3000/api/amadeus-token';
  const r = await fetch(url,{method:'POST'});
  const j = await r.json();
  return j.access_token;
}

export default async function handler(req, res){
  if(req.method==='OPTIONS'){ return res.status(204).end(); }
  const { origin, destination, depart, ret, adults=1, nonstop=false } = req.body||{};
  if(!origin||!destination||!depart){ return res.status(400).json({ error:'missing_params' }); }
  const token = await getToken();
  const base = process.env.AMAD_ENV === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com';
  const url = new URL(`${base}/v2/shopping/flight-offers`);
  url.searchParams.set('originLocationCode', origin);
  url.searchParams.set('destinationLocationCode', destination);
  url.searchParams.set('departureDate', depart);
  if(ret) url.searchParams.set('returnDate', ret);
  url.searchParams.set('adults', String(adults));
  url.searchParams.set('nonStop', String(!!nonstop));
  url.searchParams.set('currencyCode','KRW');
  url.searchParams.set('max','30');

  const r = await fetch(url.toString(),{ headers: { Authorization: `Bearer ${token}` }});
  const j = await r.json();
  if(!r.ok){ return res.status(r.status).json(j); }

  const items = (j.data||[]).map((d)=>{
    const segs = d.itineraries.flatMap(it=> it.segments.map(s=>({from:s.departure.iataCode,to:s.arrival.iataCode,dep:s.departure.at,arr:s.arrival.at,carrier:s.carrierCode})));
    const transfers = d.itineraries.reduce((acc,it)=> acc + Math.max(0,it.segments.length-1),0);
    const durationMin = d.itineraries.reduce((acc,it)=>{
      const iso = it.duration;
      const m = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso)||[];
      const mins = (parseInt(m[1]||'0')*60)+(parseInt(m[2]||'0'));
      return acc+mins;
    },0);
    return { offerId: d.id, price_total: Math.round(Number(d.price.total)*100)/100*100, currency: d.price.currency, segments: segs, carriers: [...new Set(segs.map(s=>s.carrier))], transfers, total_duration_minutes: durationMin };
  });
  res.status(200).json({ items });
}
