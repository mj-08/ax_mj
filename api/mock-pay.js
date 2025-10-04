export default async function handler(req, res){
  const { amount, currency='KRW', flightOfferId=null, hotelId=null } = req.body || {};
  if(!amount || amount<=0) return res.status(400).json({ ok:false, error:'invalid_amount' });
  const orderId = 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase();
  const receipt = { amount: Math.round(amount), currency, items: { flightOfferId, hotelId }, createdAt: new Date().toISOString() };
  res.status(200).json({ ok:true, orderId, receipt });
}
