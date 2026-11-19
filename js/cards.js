function createThoughtStudio({esc,icon,readState,writeState,notify,onCollectionChange}) {
  const dialog = document.getElementById('thought-dialog');
  const canvas = dialog.querySelector('canvas');
  const themes = {
    graphite:{name:'Графит',paper:'#20241f',ink:'#f7efdb',accent:'#e7b971',line:'#626555'},
    linen:{name:'Лён',paper:'#f2e8d2',ink:'#2b2b23',accent:'#854833',line:'#b9a987'},
    pine:{name:'Хвоя',paper:'#25493e',ink:'#f5eed7',accent:'#f3c88b',line:'#789381'}
  };
  let current;
  let renderRequest = 0;

  function collection() {
    const entries = readState('thoughts',[]);
    return Array.isArray(entries) ? entries.filter(entry=>entry && typeof entry.quote === 'string' && typeof entry.id === 'string') : [];
  }
  function wordWrap(ctx, text, width) {
    const lines = [];
    let line = '';
    for (const word of text.trim().split(/\s+/)) {
      const next = line ? line+' '+word : word;
      if (ctx.measureText(next).width <= width) { line = next; continue; }
      if (line) lines.push(line);
      line = '';
      for (const char of word) {
        if (line && ctx.measureText(line+char).width > width) { lines.push(line); line = ''; }
        line += char;
      }
    }
    if (line) lines.push(line);
    return lines;
  }
  function draw() {
    if (!current) return;
    const square = current.shape === 'square';
    const w = 1080, h = square ? 1080 : 1920;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    canvas.style.aspectRatio = w+'/'+h;
    const ctx = canvas.getContext('2d');
    const palette = themes[current.theme] || themes.graphite;
    ctx.fillStyle = palette.paper;
    ctx.fillRect(0,0,w,h);
    const margin = 84, width = w-2*margin;
    ctx.fillStyle = palette.ink;
    ctx.font = '700 44px Playfair, Georgia, serif';
    ctx.fillText('FOUNDER.',margin,margin+32);
    ctx.textAlign = 'right';
    ctx.font = '500 21px Inter, Arial, sans-serif';
    ctx.fillStyle = palette.accent;
    ctx.fillText('КАРТОЧКА МЫСЛИ',w-margin,margin+25);
    ctx.textAlign = 'left';
    ctx.strokeStyle = palette.line;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(margin,margin+61); ctx.lineTo(w-margin,margin+61); ctx.stroke();
    ctx.font = '500 26px Inter, Arial, sans-serif';
    const credit = wordWrap(ctx,current.credit,width);
    const creditY = h-margin-(credit.length-1)*36;
    let bottom = creditY-55;
    let note = [];
    if (current.note.trim()) {
      ctx.font = '400 32px Inter, Arial, sans-serif';
      note = wordWrap(ctx,current.note,width);
      bottom -= note.length*43+67;
    }
    const top = square?245:370;
    const room = bottom-top-24;
    let size = square?64:80;
    let lines, leading;
    do {
      ctx.font = `italic 500 ${size}px Playfair, Georgia, serif`;
      lines = wordWrap(ctx,current.quote,width);
      leading = Math.round(size*1.29);
      if (lines.length*leading <= room || size<=32) break;
      size-=2;
    } while (true);
    const baseline = top+Math.max(0,(room-lines.length*leading)/2)+size;
    ctx.fillStyle=palette.accent;
    ctx.fillRect(margin,baseline-size-28,68,5);
    ctx.fillStyle = palette.ink;
    lines.forEach((line,i)=>ctx.fillText(line,margin,baseline+i*leading));
    if (note.length) {
      ctx.fillStyle=palette.accent; ctx.font='550 20px Inter, Arial, sans-serif';
      ctx.fillText('МОЯ ЗАМЕТКА',margin,bottom+42);
      ctx.fillStyle=palette.ink; ctx.font='400 32px Inter, Arial, sans-serif';
      note.forEach((line,i)=>ctx.fillText(line,margin,bottom+88+i*43));
    }
    ctx.fillStyle=palette.line;
    ctx.fillRect(margin,creditY-43,width,2);
    ctx.fillStyle=palette.ink; ctx.font='500 26px Inter, Arial, sans-serif';
    credit.forEach((line,i)=>ctx.fillText(line,margin,creditY+i*36));
    canvas.setAttribute('aria-label',current.quote+(current.note?' Моя заметка. '+current.note:''));
  }
  function scheduleDraw() {
    cancelAnimationFrame(renderRequest);
    renderRequest = requestAnimationFrame(draw);
  }
  function selectControls() {
    dialog.querySelectorAll('[data-card-theme]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.cardTheme === current.theme));
    dialog.querySelectorAll('[data-card-shape]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.cardShape === current.shape));
    dialog.querySelector('.card-preview').dataset.shape=current.shape;
  }
  function feedback(text) { dialog.querySelector('[data-studio-status]').textContent=text; }
  function open({quote,credit,theme='graphite',shape='square',note='',id=null}) {
    current = {quote,credit,theme:themes[theme]?theme:'graphite',shape:shape==='story'?'story':'square',note,id};
    dialog.querySelector('[data-card-note]').value = note;
    selectControls(); draw(); feedback('');
    if (!dialog.open) dialog.showModal();
    document.fonts.ready.then(scheduleDraw);
  }
  function shelf() {
    const rows = collection().slice().reverse();
    return `<section class="thought-shelf"><div class="section-head"><div class="section-title"><h2>Мои карточки</h2></div><span class="shelf-count">${rows.length}</span></div>
      ${rows.length ? `<div class="thought-grid">${rows.map(card=>`<article class="saved-thought theme-${Object.hasOwn(themes,card.theme)?card.theme:'graphite'}"><button class="open-thought" data-edit-thought="${esc(card.id)}"><span>${esc(card.credit)}</span><strong>${esc(card.quote)}</strong>${card.note?`<small>${esc(card.note)}</small>`:''}</button><button class="remove-thought" data-remove-thought="${esc(card.id)}" aria-label="Убрать карточку из коллекции">Убрать</button></article>`).join('')}</div>` :
        '<p class="shelf-empty">Выберите мысль в статье, книге или «Точке опоры» и нажмите «В коллекцию».</p>'}</section>`;
  }
  async function png() {
    await document.fonts.ready;
    draw();
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNG')),'image/png'));
  }
  async function exportCard(share=false) {
    try {
      const blob=await png();
      const filename='founder-'+(current.shape==='story'?'1080x1920':'1080x1080')+'.png';
      const file=new File([blob],filename,{type:'image/png'});
      if (share && navigator.canShare?.({files:[file]})) {
        await navigator.share({files:[file],title:'FOUNDER. Карточка мысли'});
        feedback('Карточка передана.');
      } else {
        const url=URL.createObjectURL(blob);
        const link=document.createElement('a');
        link.href=url; link.download=filename; document.body.append(link); link.click(); link.remove();
        setTimeout(()=>URL.revokeObjectURL(url),60000);
        feedback('PNG готов. Его можно отправить или сохранить в фотографиях.');
      }
    } catch(error) { if(error.name!=='AbortError') feedback('Не удалось подготовить PNG. Попробуйте ещё раз.'); }
  }
  dialog.querySelector('[data-theme-options]').innerHTML=Object.entries(themes).map(([id,theme])=>
    `<button class="theme-choice" type="button" data-card-theme="${id}"><i style="background:${theme.paper}"></i>${theme.name}</button>`).join('');
  const shareButton=dialog.querySelector('[data-card-share]');
  try { shareButton.hidden=!navigator.canShare?.({files:[new File(['x'],'card.png',{type:'image/png'})]}); } catch { shareButton.hidden=true; }
  dialog.addEventListener('input',event=>{
    if (event.target.hasAttribute('data-card-note')) { current.note=event.target.value; feedback(''); scheduleDraw(); }
  });
  dialog.addEventListener('click',event=>{
    if(event.target===dialog || event.target.closest('[data-close-thought]')) {dialog.close();return;}
    const button=event.target.closest('button');
    if(!button || !current) return;
    if(button.hasAttribute('data-card-theme') || button.hasAttribute('data-card-shape')) {
      if(button.dataset.cardTheme) current.theme=button.dataset.cardTheme;
      if(button.dataset.cardShape) current.shape=button.dataset.cardShape;
      selectControls(); scheduleDraw(); feedback('');
    }
    if(button.hasAttribute('data-card-export')) exportCard();
    if(button.hasAttribute('data-card-share')) exportCard(true);
    if(button.hasAttribute('data-card-save')) {
      const cards=collection();
      current.id ||= globalThis.crypto?.randomUUID?.() || String(Date.now())+'-'+Math.random().toString(36).slice(2);
      const i=cards.findIndex(c=>c.id===current.id);
      if(i<0) cards.push({...current}); else cards[i]={...current};
      const stored=writeState('thoughts',cards);
      feedback(stored?'Сохранено в личном уголке.':'Карточка сохранена на время этой вкладки.');
      onCollectionChange();
    }
    if(button.hasAttribute('data-card-copy')) {
      const text=[current.quote,current.note,current.credit].filter(Boolean).join('\n\n');
      navigator.clipboard?.writeText(text).then(()=>feedback('Текст скопирован.'),()=>feedback('Браузер запретил копирование.'));
    }
  });
  dialog.querySelector('[data-card-copy]').hidden=!navigator.clipboard?.writeText;
  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-edit-thought],[data-remove-thought]');
    if(!target) return;
    const rows=collection();
    if(target.dataset.editThought) {
      const entry=rows.find(c=>c.id===target.dataset.editThought);
      if (entry) open(entry);
    } else {
      writeState('thoughts',rows.filter(c=>c.id!==target.dataset.removeThought));
      onCollectionChange();
      document.querySelector('[data-edit-thought],.thought-shelf h2')?.focus({preventScroll:true});
      notify('Карточка убрана из коллекции');
    }
  });
  return {open,shelf};
}
