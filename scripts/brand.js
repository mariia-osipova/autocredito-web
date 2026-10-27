(()=>{
  'use strict';
  // Real HTML chapter links work without JavaScript. Preserve earlier bookmarks.
  if(document.body.dataset.page==='index.html'){
    const destinations={overview:'index.html',essence:'strategy.html#essence',logo:'visual-identity.html#logo',colors:'visual-identity.html#colors',typography:'visual-identity.html#typography',foundations:'resources.html#criterios'};
    const oldTarget=location.hash.slice(1);
    if(oldTarget&&destinations[oldTarget]&&oldTarget!=='overview')location.replace(destinations[oldTarget]);
  }
  const status=document.getElementById('toast');let timer;
  const announce=message=>{if(!status)return;clearTimeout(timer);status.textContent=message;timer=setTimeout(()=>{status.textContent=''},3500)};
  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const value=button.dataset.copy;let copied=false;
    try{
      if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(value);copied=true}
      else{const field=document.createElement('textarea');field.value=value;field.setAttribute('aria-label','Código de color');field.style.position='fixed';field.style.left='-10000px';document.body.appendChild(field);field.select();copied=document.execCommand('copy');field.remove();button.focus()}
    }catch(error){copied=false}
    announce(copied?value+' copiado al portapapeles':'Código de color: '+value);
  }));
})();
