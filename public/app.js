const $ = (sel) => document.querySelector(sel);
const api = (p, q={}) => fetch(p, {method: q.method||'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(q.body||{})}).then(r=>r.json());

function sortFlights(list, key){
  if(key==='price') return [...list].sort((a,b)=>a.price_total-b.price_total);
  if(key==='duration') return [...list].sort((a,b)=>a.total_duration_minutes-b.total_duration_minutes);
  if(key==='transfers') return [...list].sort((a,b)=> (a.transfers-b.transfers) || (a.price_total-b.price_total) || (a.total_duration_minutes-b.total_duration_minutes));
  return list;
}

function renderFlights(list){
  const html = list.slice(0,12).map(o=>`
  <div class="card">
    <div class="row"><strong>${o.carriers?.join(', ')||''}</strong><span class="pill">환승 ${o.transfers}</span></div>
    <div class="row">${o.segments[0].from} → ${o.segments.at(-1).to}</div>
    <div class="row">총시간 ${Math.round(o.total_duration_minutes/60)}h ${o.total_duration_minutes%60}m</div>
    <div class="row"><strong>${new Intl.NumberFormat('ko-KR').format(o.price_total)} ${o.currency}</strong></div>
    <button data-offer="${o.offerId}">장바구니</button>
  </div>`).join('');
  $('#flightResults').innerHTML = html;
}

function renderHotels(list){
  const html = list.slice(0,12).map(h=>`
  <div class="card">
    <div class="row"><strong>${h.name}</strong><span class="pill">★ ${h.stars||'-'}</span></div>
    <div>${h.address||''}</div>
    <div class="row"><strong>${new Intl.NumberFormat('ko-KR').format(h.price_total)} ${h.currency}</strong></div>
    <button data-hotel='${JSON.stringify(h)}'>장바구니</button>
  </div>`).join('');
  $('#hotelResults').innerHTML = html;
}

$('#btnSearchFlights').addEventListener('click', async ()=>{
  const body={
    origin: $('#from').value.trim(), destination: $('#to').value.trim(),
    depart: $('#depart').value, ret: $('#return').value,
    adults: +$('#adults').value, nonstop: $('#nonstop').value==='true'
  };
  const res = await api('/api/flight-search', {body});
  window._flights = res.items||[];
  renderFlights(sortFlights(window._flights,'price'));
});

$('#btnSearchHotels').addEventListener('click', async ()=>{
  const body={ city: $('#city').value.trim(), checkin: $('#checkin').value, checkout: $('#checkout').value, rooms:+$('#rooms').value, pax:+$('#pax').value };
  const res = await api('/api/hotel-search', {body});
  window._hotels = res.items||[];
  renderHotels(window._hotels);
});

for (const el of document.querySelectorAll('.tab')){
  el.addEventListener('click', ()=>{
    if(!window._flights) return;
    renderFlights(sortFlights(window._flights, el.dataset.sort));
  });
}
