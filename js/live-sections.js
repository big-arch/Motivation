function createLiveSections({esc, external, icon}) {
  const feeds = {};
  const labels = {stories:'Истории из первых рук',museum:'Закрытия компаний и разборы сбоев',
    resources:'Практика из свежих публикаций',support:'Об устойчивости и привычках',
    library:'Поступления открытой полки',archive:'Из источников журнала',journal:'Истории и разборы из источников'};
  const limits = {};
  const formatter = new Intl.DateTimeFormat('ru-RU',{dateStyle:'medium'});
  const withTime = new Intl.DateTimeFormat('ru-RU',{dateStyle:'medium',timeStyle:'short'});
  function date(value,detail=false) {
    const t=Date.parse(value);
    return Number.isFinite(t)?'<time datetime="'+esc(value)+'">'+esc((detail?withTime:formatter).format(t))+'</time>':'';
  }
  function rows(key) {
    const sections=feeds.sections?.sections||{};
    if(key==='library') return feeds['open-books']?.items||[];
    if(key==='journal'||key==='archive') {
      const combined=[...(sections.stories||[]),...(sections.museum||[])];
      return [...new Map(combined.map(row=>[row.url,row])).values()].sort((a,b)=>b.published.localeCompare(a.published));
    }
    return sections[key]||[];
  }
  function list(key) {
    const all=rows(key), limit=limits[key]||(key==='journal'?2:3);
    if(!all.length) return '';
    return '<section class="source-picks"><h2>'+esc(labels[key])+'</h2><div class="link-list">'+all.slice(0,limit).map(item=>{
      const time=date(item.published);
      const meta=key==='library'?'На полке с '+time:esc(item.label)+' · '+time;
      const span='<span><small class="row-meta">'+meta+' · '+esc(item.source)+'</small><strong lang="'+(item.lang==='en'?'en':'ru')+'">'+esc(item.title)+'</strong></span>';
      if(key==='library') return '<button type="button" class="link-row" data-book-open="'+esc(item.id)+'">'+span+icon('book')+'</button>';
      return '<a class="link-row" target="_blank" rel="noopener noreferrer" href="'+esc(external(item.url))+'">'+span+icon('out')+'</a>';
    }).join('')+'</div>'+(key==='journal'?'<a class="text-link" href="#archive">Все материалы '+icon('arrow')+'</a>':
      all.length>limit?'<button type="button" class="text-link" data-more-section="'+key+'">Показать ещё · '+(all.length-limit)+'</button>':'')+'</section>';
  }
  function status() {
    const data=feeds['site-status'];
    if(!data) return '';
    const names={news:'Новости',videos:'Видео',audio:'Лекции, подкасты и аудиокниги','open-books':'Открытая полка'};
    const lines=Object.entries(data.catalogs).map(([key,row])=>'<li><strong>'+esc(names[key])+'</strong> · '+row.count+
      ' материалов. Последние данные — '+(date(row.checked,true)||'—')+'. Ответили '+row.fresh+' из '+row.total+' источников.'+(row.retained.length?' Сохранена предыдущая подборка: '+esc(row.retained.join(', '))+'.':'')+'</li>');
    for(const row of data.editorialSources||[]) lines.push('<li><strong>'+esc(row.name)+'</strong> · '+(row.ok?'проверен ':'предыдущая успешная проверка ')+(date(row.checked,true)||'—')+'</li>');
    return '<section class="source-picks" id="publication-status"><h2>Обновления сайта</h2><p>Сборка от '+date(data.built,true)+'. Расписание — каждые шесть часов. Время показано на вашем устройстве.</p><ul>'+lines.join('')+'</ul><p>Подготовлено выжимок и разборов видео: '+data.guides+'.</p></section>';
  }
  function paint(host) { const key=host.dataset.liveSection;host.innerHTML=key==='status'?status():list(key); }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-more-section]');
    if(!button) return;
    const key=button.dataset.moreSection,host=button.closest('[data-live-section]');
    const before=host.querySelectorAll('.link-row').length;
    limits[key]=before+12;paint(host);host.querySelectorAll('.link-row')[before]?.focus({preventScroll:true});
  });
  return {
    slot(key){ return '<div data-live-section="'+key+'">'+(key==='status'?status():list(key))+'</div>'; },
    set(kind,data){
      feeds[kind]=data;
      for(const host of document.querySelectorAll('[data-live-section]')){
        const key=host.dataset.liveSection;
        if(kind===(key==='status'?'site-status':key==='library'?'open-books':'sections')) paint(host);
      }
    }
  };
}
