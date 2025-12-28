// admin.js
const API_BASE = location.origin.includes(':4000') ? '' : 'http://localhost:4000';
const tokenKey = 'adminToken';

async function postJSON(url, data, token){
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
    body: JSON.stringify(data)
  });
  const payload = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
  return payload;
}
async function putJSON(url, data, token){
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}) },
    body: JSON.stringify(data)
  });
  const payload = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
  return payload;
}
async function getJSON(url, token){
  const res = await fetch(url, { headers: token ? {Authorization:`Bearer ${token}`} : {} });
  const payload = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(payload.message || `HTTP ${res.status}`);
  return payload;
}

function fieldTemplate(i, p){
  return `
  <fieldset class="card" style="padding:1rem">
    <legend style="font-weight:700">Program ${i+1}</legend>
    <div class="form">
      <label>Title <input name="title-${i}" value="${(p.title||'').replace(/"/g,'&quot;')}" required /></label>
      <label>Body <textarea name="body-${i}" rows="3" required>${(p.body||'')}</textarea></label>
      <label>Link (optional) <input name="link-${i}" value="${p.link||'#'}" /></label>
      <input type="hidden" name="order-${i}" value="${i}" />
      <button type="button" data-remove="${i}" class="btn" style="align-self:start">Remove</button>
    </div>
  </fieldset>`;
}

async function loadEditor(){
  const token = localStorage.getItem(tokenKey);
  const authCard = document.getElementById('auth-card');
  const editor = document.getElementById('editor');
  const fields = document.getElementById('programs-fields');

  if (!token){
    authCard.style.display = '';
    editor.style.display = 'none';
    return;
  }
  authCard.style.display = 'none';
  editor.style.display = '';

  const data = await getJSON(`${API_BASE}/api/programs`, token);
  fields.innerHTML = data.map((p,i)=>fieldTemplate(i,p)).join('');

  fields.addEventListener('click', (e)=>{
    const idx = e.target?.dataset?.remove;
    if (typeof idx === 'undefined') return;
    const fsets = [...fields.querySelectorAll('fieldset')];
    fsets[idx]?.remove();
    [...fields.querySelectorAll('fieldset')].forEach((fs, i)=>{
      fs.querySelectorAll('input,textarea,button').forEach(el=>{
        if (el.name) el.name = el.name.replace(/-(\d+)$/, `-${i}`);
        if (el.dataset.remove) el.dataset.remove = String(i);
      });
      const hidden = fs.querySelector('input[type=hidden]');
      if (hidden) hidden.value = i;
      const legend = fs.querySelector('legend');
      if (legend) legend.textContent = `Program ${i+1}`;
    });
  });

  document.getElementById('add-program').onclick = ()=>{
    const count = fields.querySelectorAll('fieldset').length;
    fields.insertAdjacentHTML('beforeend', fieldTemplate(count, {title:'', body:'', link:'#'}));
  };

  document.getElementById('programs-form').onsubmit = async (e)=>{
    e.preventDefault();
    const status = document.getElementById('publish-status');
    status.textContent = 'Publishing...';

    const fsets = [...fields.querySelectorAll('fieldset')];
    const programs = fsets.map((fs,i)=>({
      title: fs.querySelector(`[name="title-${i}"]`).value.trim(),
      body:  fs.querySelector(`[name="body-${i}"]`).value.trim(),
      link:  fs.querySelector(`[name="link-${i}"]`).value.trim() || '#',
      order: i
    })).filter(p=>p.title && p.body);

    try{
      await putJSON(`${API_BASE}/api/programs`, { programs }, token);
      status.textContent = 'Published. Open Home to see changes.';
    }catch(err){
      status.textContent = 'Error: ' + err.message;
    }
  };

  document.getElementById('logout-btn').onclick = ()=>{
    localStorage.removeItem(tokenKey);
    location.reload();
  };
}

document.getElementById('login-form')?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const status = document.getElementById('login-status');
  status.textContent = 'Signing in...';
  const fd = new FormData(e.currentTarget);
  try{
    const { token } = await postJSON(`${API_BASE}/api/auth/login`, {
      email: fd.get('email'), password: fd.get('password')
    });
    localStorage.setItem(tokenKey, token);
    await loadEditor();
  }catch(err){
    status.textContent = 'Error: ' + err.message;
  }
});

loadEditor();
