export default function handler(req,res){
  const origin = process.env.ORIGIN_ALLOWED||'*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization');
  if(req.method==='OPTIONS') return res.status(204).end();
  res.status(200).json({ ok:true });
}
