import fetch from 'node-fetch';
import crypto from 'crypto';

function hbSignature(){
  const apiKey = process.env.HOTELBEDS_API_KEY;
  const secret = process.env.HOTELBEDS_SECRET;
  const ts = Math.floor(Date.now()/1000);
  const sig = crypto.createHash('sha256').update(apiKey+secret+ts).digest('hex');
  return { sig, ts };
}

export default async function handler(req, res){
  if(req.method==='OPTIONS'){ return res.status(204).end(); }
  const { city='Tokyo', checkin, checkout, rooms=1, pax=2 } = req.body||{};
  if(!checkin||!checkout){ return res.status(400).json({ error:'missing_dates' }); }
  const base = process.env.HOTELBEDS_BASE || 'https://api.test.hotelbeds.com/hotel-api/1.0';
  const { sig } = hbSignature();

  const payload = {
    stay: { checkIn: checkin, checkOut: checkout },
    occupancies: [{ rooms, adults: pax }],
    destination: { keyword: city }
  };

  const r = await fetch(`${base}/hotels`,{
    method:'POST',
    headers:{ 'Accept':'application/json','Content-Type':'application/json','Api-key':process.env.HOTELBEDS_API_KEY,'X-Signature':sig },
    body: JSON.stringify(payload)
  });
  const j = await r.json();
  if(!r.ok){ return res.status(r.status).json(j); }

  const items = (j.hotels?.hotels||[]).map(h=>({ id: h.code, name: h.name?.content, address: h.address?.content, stars: h.categoryName?.content?.match(/(\d)/)?.[1], price_total: Math.round(h.minRate||0), currency: h.currency||'KRW' }));
  res.status(200).json({ items });
}
