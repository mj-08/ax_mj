const $ = (sel) => document.querySelector(sel);
const nf = (n) => new Intl.NumberFormat('ko-KR').format(n);

const IATA = { '서울':'SEL','seoul':'SEL','icn':'ICN','gmp':'GMP','도쿄':'TYO','tokyo':'TYO','nrt':'NRT','hnd':'HND','오사카':'OSA','osaka':'OSA','kix':'KIX','itm':'ITM','후쿠오카':'FUK','fukuoka':'FUK' };

function wordTokens(text){ return text.replace(/[,.;|]/g,' ').replace(/\s+/g,' ').trim().split(' '); }
function normalizeDateText(text){ return text.replace(/년/g,'-').replace(/월/g,'/').replace(/일/g,''); }
function parseDateFromPart(part){
  const toks = wordTokens(part);
  for(const w of toks){
    if(w.includes('-')){ const d = new Date(w); if(!isNaN(d.getTime())) return d.toISOString().slice(0,10); }
  }
  for(const w of toks){
    if(w.includes('/')){
      const bits = w.split('/'); const now = new Date();
      let y=now.getFullYear(), m=parseInt(bits[0],10), d=parseInt(bits[1],10);
      if(bits.length===3){ y=parseInt(bits[0],10); m=parseInt(bits[1],10); d=parseInt(bits[2],10); }
      if(m>=1&&m<=12&&d>=1&&d<=31) return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }
  }
  return '';
}
async function resolveIata(name){
  if(!name) return '';
  const key = name.toLowerCase();
  if(IATA[key]) return IATA[key];
  try{
    const r = await fetch('/api/amadeus-locations',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ keyword: name })});
    const j = await r.json();
    return (j.items?.[0]?.iataCode) || '';
  }catch(e){ return ''; }
}
function parsePax(text){
  const idx = text.indexOf('명');
  if(idx>0){
    let num=''; for(let i=idx-1;i>=0 && /[0-9]/.test(text[i]);i--) num = text[i]+num;
    const n = parseInt(num,10); if(n>0) return Math.min(9,n);
  }
  return 1;
}
const isNonstop = (t) => /직항|non\s*stop/i.test(t);

function sortFlights(list, key){
  const a = list.slice();
  if(key==='price') a.sort((x,y)=>x.price_total-y.price_total);
  else if(key==='duration') a.sort((x,y)=>x.total_duration_minutes-y.total_duration_minutes);
  else if(key==='transfers') a.sort((x,y)=> (x.transfers-y.transfers)||(x.price_total-y.price_total)||(x.total_duration_minutes-y.total_duration_minutes));
  return a;
}
function buildPickHTML(label, o){
  if(!o) return `<div>${label} 결과 없음</div>`;
  return `
    <div class="row"><strong>${label}</strong><span class="pill">${o.carriers?.join(', ')||''}</span></div>
    <div class="row">${o.segments[0].from} → ${o.segments.at(-1).to} · 환승 ${o.transfers}</div>
    <div class="row">총시간 ${Math.round(o.total_duration_minutes/60)}h ${o.total_duration_minutes%60}m</div>
    <div class="row"><strong>${nf(o.price_total)} ${o.currency}</strong></div>
    <button data-offer="${o.offerId}" class="btnAddFlight">항공 담기</button>
  `;
}
function updatePicks(){
  if(!window._flights || window._flights.length===0) return;
  const p1 = sortFlights(window._flights,'price')[0];
  const p2 = sortFlights(window._flights,'duration')[0];
  const p3 = sortFlights(window._flights,'transfers')[0];
  document.getElementById('pickPrice').innerHTML = buildPickHTML('최저가', p1);
  document.getElementById('pickDuration').innerHTML = buildPickHTML('최단시간', p2);
  document.getElementById('pickTransfers').innerHTML = buildPickHTML('최저환승', p3);
}
setInterval(updatePicks, 800);

window._cart = window._cart || {};
function updateCart(){
  const c = window._cart; const el = document.getElementById('cartSummary');
  if(!c.flight && !c.hotel){ el.textContent='선택된 항공/호텔이 없습니다.'; document.getElementById('btnMockPay').disabled=true; return; }
  const total = (c.flight?.price_total||0) + (c.hotel?.price_total||0);
  c.total = total; c.currency = c.flight?.currency || c.hotel?.currency || 'KRW';
  let html='';
  if(c.flight){ html += `✈️ 항공: <strong>${nf(c.flight.price_total)} ${c.flight.currency}</strong> (${c.flight.segments[0].from}→${c.flight.segments.at(-1).to}, 환승 ${c.flight.transfers})<br/>`; }
  if(c.hotel){ html += `🛏️ 호텔: <strong>${nf(c.hotel.price_total)} ${c.hotel.currency}</strong> (${c.hotel.name})<br/>`; }
  html += `<div class="total">합계: ${nf(total)} ${c.currency}</div>`;
  el.innerHTML = html; document.getElementById('btnMockPay').disabled=false;
}
document.getElementById('flightResults').addEventListener('click', (e)=>{
  const t = e.target; if(t.tagName==='BUTTON' && t.dataset.offer){
    const item = (window._flights||[]).find(x=>x.offerId===t.dataset.offer);
    if(item){ window._cart.flight = item; updateCart(); }
  }
});
['pickPrice','pickDuration','pickTransfers'].forEach(id=>{
  const box = document.getElementById(id);
  box.addEventListener('click',(e)=>{
    const t=e.target; if(t.tagName==='BUTTON' && t.dataset.offer){
      const item=(window._flights||[]).find(x=>x.offerId===t.dataset.offer);
      if(item){ window._cart.flight=item; updateCart(); }
    }
  });
});
document.getElementById('hotelResults').addEventListener('click', (e)=>{
  const t = e.target; if(t.tagName==='BUTTON' && t.dataset.hotel){
    try{ window._cart.hotel = JSON.parse(t.dataset.hotel); updateCart(); }catch(err){}
  }
});
document.getElementById('btnMockPay').addEventListener('click', async ()=>{
  const c = window._cart||{}; if(!c.total) return;
  const r = await fetch('/api/mock-pay',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ flightOfferId: c.flight?.offerId||null, hotelId: c.hotel?.id||null, amount: c.total, currency: c.currency })});
  const j = await r.json();
  const box = document.getElementById('payResult');
  if(j.ok){ box.classList.remove('hidden'); box.innerHTML = `<div class="card">✅ 모의 결제 성공! 주문번호: <strong>${j.orderId}</strong><br/>영수증 금액: ${nf(j.receipt.amount)} ${j.receipt.currency}</div>`; }
  else { box.classList.remove('hidden'); box.innerHTML = `<div class="card">❌ 결제 실패: ${j.error||'unknown'}</div>`; }
});

async function handleNL(){
  const raw = document.getElementById('nl').value || '';
  const text = normalizeDateText(raw);
  const nonstop = isNonstop(text);
  const pax = parsePax(text);
  let fromName='', toName='';
  if(text.includes('→')){ const [a,b] = text.split('→'); fromName=a?.trim(); toName=b?.trim(); }
  else if(/\s+to\s+/i.test(text)){ const [a,b] = text.split(/\s+to\s+/i); fromName=a?.trim(); toName=b?.trim(); }
  else { const toks = wordTokens(text); fromName=toks[0]||''; toName=toks[1]||''; }
  const from = await resolveIata(fromName);
  const to = await resolveIata(toName);
  let depart='', ret='';
  if(text.includes('~')){ const [a,b] = text.split('~'); depart = parseDateFromPart(a); ret = parseDateFromPart(b); }
  else { depart = parseDateFromPart(text); }
  if(from) document.getElementById('from').value = from;
  if(to) document.getElementById('to').value = to;
  if(depart) document.getElementById('depart').value = depart;
  if(ret) document.getElementById('return').value = ret;
  document.getElementById('adults').value = String(pax);
  document.getElementById('nonstop').value = nonstop ? 'true' : 'any';
  if(to) document.getElementById('city').value = to;
  if(depart) document.getElementById('checkin').value = depart;
  if(ret) document.getElementById('checkout').value = ret;
  if(from && to && depart) document.getElementById('btnSearchFlights').click();
  if(document.getElementById('city').value && document.getElementById('checkin').value && document.getElementById('checkout').value) document.getElementById('btnSearchHotels').click();
}
document.getElementById('btnParseNL').addEventListener('click', handleNL);
