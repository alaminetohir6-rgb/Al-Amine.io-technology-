const $ = (id) => document.getElementById(id);
async function api(url, options={}) {
  const response = await fetch(url, { ...options, headers: { 'Content-Type':'application/json', ...(options.headers||{}) } });
  const data = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}
async function loadDashboard() {
  const summary = await api('/api/owner/summary');
  $('summary').textContent = JSON.stringify(summary.counts, null, 2);
  $('payments').textContent = summary.paymentsNeedingReview;
  const orders = await api('/api/owner/orders');
  $('orders').innerHTML = orders.length ? orders.map(o => `<div class="order"><strong>#${o.id} · ${escapeHtml(o.service)}</strong><p>${escapeHtml(o.customer_name)} · ${escapeHtml(o.contact)}</p><p>${escapeHtml(o.details)}</p><small>Status: ${escapeHtml(o.status)} · Payment: ${escapeHtml(o.payment_status)}</small><br><button data-approve="${o.id}">Approve order</button><button class="secondary" data-payment="${o.id}" data-status="verified">Mark payment verified</button></div>`).join('') : '<p>No orders yet.</p>';
  const activity = await api('/api/owner/activity');
  $('activity').innerHTML = activity.map(a=>`<p>${escapeHtml(a.created_at)} — ${escapeHtml(a.event)}: ${escapeHtml(a.detail)}</p>`).join('') || '<p>No activity yet.</p>';
}
function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
$('loginForm').addEventListener('submit', async e=>{e.preventDefault();const form=new FormData(e.currentTarget);try{await api('/api/owner/login',{method:'POST',body:JSON.stringify({username:form.get('username'),password:form.get('password')})});$('login').hidden=true;$('dashboard').hidden=false;await loadDashboard();}catch(err){$('loginMessage').textContent=err.message;}});
$('logout').addEventListener('click',async()=>{await api('/api/owner/logout',{method:'POST'});$('dashboard').hidden=true;$('login').hidden=false;});
$('orders').addEventListener('click',async e=>{const approve=e.target.dataset.approve;const payment=e.target.dataset.payment;try{if(approve)await api(`/api/owner/orders/${approve}/approve`,{method:'POST',body:'{}'});if(payment)await api(`/api/owner/orders/${payment}/payment-review`,{method:'POST',body:JSON.stringify({status:e.target.dataset.status})});await loadDashboard();}catch(err){alert(err.message);}});
api('/api/owner/summary').then(async()=>{$('login').hidden=true;$('dashboard').hidden=false;await loadDashboard();}).catch(()=>{});
