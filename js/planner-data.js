'use strict';

function createPlannerData({esc, icon, dateKey, notify}) {
  const prefix = 'founder.cabinet.v1.';
  const kinds = {
    note: {label:'Заметка', plural:'Заметки', icon:'write'},
    idea: {label:'Идея', plural:'Идеи', icon:'bulb'},
    book: {label:'Книжная цитата', plural:'Из книг', icon:'book'},
    quote: {label:'Деловая цитата', plural:'Цитаты', icon:'quote'}
  };
  const tabs = [['','Полка','bookmark'],['diary','Дневник','write'],['calendar','Календарь','calendar']];
  const key = (bucket,id) => prefix+bucket+'.'+id;
  const uid = () => crypto.randomUUID().replaceAll('-','');
  function list(bucket) {
    const rows = [];
    try {
      for (let i=0; i<localStorage.length; i++) {
        const name=localStorage.key(i);
        if (!name?.startsWith(key(bucket,''))) continue;
        try {
          const row=JSON.parse(localStorage.getItem(name));
          if (row?.id && name===key(bucket,row.id)) rows.push(row);
        } catch { /* An unreadable record should not hide the rest. */ }
      }
    } catch { /* Storage can be disabled in private windows. */ }
    return rows;
  }
  function save(bucket,row,previousVersion) {
    const name=key(bucket,row.id);
    try {
      const current=JSON.parse(localStorage.getItem(name));
      if (previousVersion && current?.version!==previousVersion) {
        notify('Запись изменилась в другой вкладке. Ваш текст можно скачать из редактора.');
        return false;
      }
      const version=uid();
      localStorage.setItem(name,JSON.stringify({...row,version}));
      return true;
    } catch {
      notify('Браузер не смог сохранить изменения. Можно скачать копию.');
      return false;
    }
  }
  function remove(bucket,row) {
    try {
      const name=key(bucket,row.id);
      const current=JSON.parse(localStorage.getItem(name));
      if (current && current.version!==row.version) {
        notify('Запись изменилась в другой вкладке. Откройте её заново.');
        return false;
      }
      localStorage.removeItem(name);
      return true;
    } catch { notify('Не удалось изменить хранилище браузера.'); return false; }
  }
  function dateOf(day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day||'')) return null;
    const [y,m,d]=day.split('-').map(Number);
    const date=new Date(y,m-1,d,12);
    return dateKey(date)===day ? date : null;
  }
  function dayLabel(day,options={day:'numeric',month:'long',year:'numeric'}) {
    return dateOf(day)?.toLocaleDateString('ru-RU',options) || '';
  }
  function offset(day,amount) {
    const date=dateOf(day);
    date.setDate(date.getDate()+amount);
    return dateKey(date);
  }
  function nav(active) {
    return `<nav class="cab-tabs" aria-label="Личный кабинет">${tabs.map(([id,label,symbol])=>
      `<a href="#saved${id?'/'+id:''}" ${id===active?'aria-current="page"':''}>${icon(symbol)}${label}</a>`).join('')}</nav>`;
  }
  function header(active,title,description,action='') {
    return `${nav(active)}<header class="cab-head"><div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</header>`;
  }
  function download(name,content,mime='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([content],{type:mime}));
    const a=document.createElement('a');
    a.href=url; a.download=name; document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function stem(label) {
    return String(label).replace(/[<>:"/\\|?*\u0000-\u001f]/g,' ').replace(/\s+/g,' ').trim().slice(0,72).trim() || 'Запись';
  }
  return {prefix,kinds,list,save,remove,uid,dateOf,dayLabel,offset,nav,header,download,stem,esc,icon,dateKey,notify};
}
