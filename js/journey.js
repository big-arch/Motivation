function createJourney({esc, icon, readState, writeState, notify, byId, moods, audio, onUpdate, syncStep, completeStep}) {
  const moodRoutes = {'Усталость':'energy','Страх старта':'start','Сомнения':'failure','Деньги':'launch','Фокус':'consistency'};

  function plan() {
    const value = readState('plan', []);
    return Array.isArray(value) ? value.filter(item=>item && typeof item.text==='string' && typeof item.id==='string') : [];
  }
  function state() {
    const value = readState('journey', {});
    return value && typeof value==='object' && !Array.isArray(value) ? value : {};
  }
  function reading() {
    const value = readState('reading', {});
    return value && typeof value==='object' && !Array.isArray(value) ? value : {};
  }
  function route(id) { return journeyRoutes.find(item=>item.id===id); }
  function routeDone(id) { return new Set((state().done?.[id] || []).filter(index=>Number.isInteger(index))); }
  function nextDay(id) {
    const selected = route(id);
    if (!selected) return null;
    const done = routeDone(id);
    const index = selected.days.findIndex((_,day)=>!done.has(day));
    return index<0 ? null : {day:selected.days[index],index};
  }
  function add(task) {
    if (!task?.text?.trim()) return;
    const rows = plan();
    const existing = rows.find(item=>item.sourceId===task.sourceId && item.text===task.text.trim());
    if (existing) { notify('Это задание уже есть в вашем плане'); return; }
    rows.unshift({id:'step-'+Date.now().toString(36),text:task.text.trim(),sourceId:task.sourceId||'',sourceTitle:task.sourceTitle||'',href:task.href||'#journey',done:false,createdAt:new Date().toISOString(),note:''});
    writeState('plan',rows);
    syncStep?.(task.text.trim());
    notify('Задание добавлено в «Мой путь»');
    onUpdate?.();
  }
  function practice(item,action,challenge) {
    return `<section class="practice-block"><div class="panel-label">${icon('check')} От материала — к действию</div><h2>Что можно применить</h2>
      <div class="practice-level"><span>Маленький шаг · 5–15 минут</span><p>${esc(action)}</p><button type="button" class="button primary" data-practice-add="${esc(item.id)}" data-action="${esc(action)}">${icon('check')} Взять в мой план</button></div>
      <div class="practice-level"><span>Шаг посложнее · на этой неделе</span><p>${esc(challenge)}</p><button type="button" class="button secondary" data-challenge-add="${esc(item.id)}" data-challenge="${esc(challenge)}">${icon('arrow')} Добавить вызов недели</button></div></section>`;
  }
  function bookProgress(item) {
    const value = reading()[item.id] || {};
    const percent = Math.max(0,Math.min(100,Number(value.percent)||0));
    const status = value.status || 'want';
    return `<section class="reading-progress-panel editorial-progress"><div><h2>Моё чтение</h2><output for="reading-${esc(item.id)}">${percent}%</output></div>
      <div class="reading-status" role="group" aria-label="Статус книги">${[['want','В планах'],['reading','Читаю'],['done','Прочитано']].map(([key,label])=>`<button type="button" class="chip" data-reading-status="${key}" data-reading-id="${esc(item.id)}" aria-pressed="${status===key}">${label}</button>`).join('')}</div>
      <label><span>Прогресс по книге</span><input id="reading-${esc(item.id)}" type="range" min="0" max="100" step="1" value="${percent}" data-reading-progress="${esc(item.id)}"></label></section>`;
  }
  function goalBlock() {
    const goal = state().goal || '';
    return `<section class="journey-goal"><div class="panel-label">${icon('star')} Главный ориентир</div><h2>Цель на эту неделю</h2><p>Одна цель важнее длинного списка. Сформулируйте результат, который можно увидеть.</p>
      <form data-goal-form><input name="goal" maxlength="180" required value="${esc(goal)}" placeholder="Например: поговорить с тремя первыми клиентами" aria-label="Моя цель на неделю"><button class="button primary" type="submit">${icon('check')} ${goal?'Сохранить':'Выбрать цель'}</button></form></section>`;
  }
  function nextBlock() {
    const current = state();
    const selected = route(current.activeRoute);
    const next = selected && nextDay(selected.id);
    const planned = plan().find(item=>!item.done);
    if (selected && next) {
      const material = next.day.material ? byId.get(next.day.material) : null;
      return `<section class="journey-next"><div class="panel-label">${icon('arrow')} Следующий шаг</div><span class="kind">${esc(selected.title)} · день ${next.index+1}</span><h2>${esc(next.day.title)}</h2><p>${esc(next.day.task)}</p>
        <div class="action-row"><a class="button primary" href="#journey/route/${selected.id}">Открыть день ${icon('arrow')}</a>${material?`<a class="text-link" href="#read/${material.id}">${esc(material.title)} ${icon('out')}</a>`:''}</div></section>`;
    }
    if (planned) return `<section class="journey-next"><div class="panel-label">${icon('check')} Следующий шаг</div><h2>${esc(planned.sourceTitle||'Из моего плана')}</h2><p>${esc(planned.text)}</p><div class="action-row"><button class="button primary" data-plan-toggle="${esc(planned.id)}">${icon('check')} Я это сделал</button><a class="text-link" href="${esc(planned.href)}">Вернуться к материалу ${icon('arrow')}</a></div></section>`;
    return `<section class="journey-next"><div class="panel-label">${icon('sun')} Начать спокойно</div><h2>Один маленький шаг лучше большого плана</h2><p>Выберите маршрут или добавьте задание из любой истории, лекции и книги.</p><div class="action-row"><a class="button primary" href="#journey/routes">Выбрать маршрут ${icon('arrow')}</a><a class="text-link" href="#audio/lectures">Послушать лекцию ${icon('play')}</a></div></section>`;
  }
  function moodBlock() {
    const selected = state().mood || '';
    return `<section class="journey-mood"><h2>Что сейчас занимает ваши мысли?</h2><div class="chips" role="group" aria-label="Моё состояние">${moods.map(mood=>`<button type="button" class="chip" data-journey-mood="${esc(mood.label)}" aria-pressed="${selected===mood.label}">${esc(mood.label)}</button>`).join('')}</div>
      ${selected?`<p>Подобран маршрут: <a class="text-link" href="#journey/route/${moodRoutes[selected]}">${esc(route(moodRoutes[selected]).title)} ${icon('arrow')}</a></p>`:''}</section>`;
  }
  function planBlock() {
    const rows = plan();
    const active = rows.filter(item=>!item.done);
    const done = rows.filter(item=>item.done);
    const rowMarkup = item=>`<article class="plan-item ${item.done?'is-done':''}"><div class="plan-check"><button type="button" class="round-btn" data-plan-toggle="${esc(item.id)}" aria-pressed="${item.done}" aria-label="${item.done?'Вернуть в активные':'Отметить выполненным'}">${icon('check')}</button></div>
      <div class="plan-copy"><span class="kind">${esc(item.sourceTitle||'Личное задание')}</span><h3>${esc(item.text)}</h3><a class="text-link" href="${esc(item.href)}">Материал ${icon('arrow')}</a>
      <label><span>${item.done?'Итог':'Заметка о результате'}</span><textarea rows="2" maxlength="500" data-plan-note="${esc(item.id)}" placeholder="Что получилось? Что дальше?">${esc(item.note||'')}</textarea></label></div>
      <button type="button" class="icon-btn plan-remove" data-plan-remove="${esc(item.id)}" aria-label="Удалить задание">${icon('close')}</button></article>`;
    return `<section class="journey-plan"><div class="section-head"><div class="section-title"><h2>Мои действия</h2></div><span class="shelf-count">${active.length} в работе</span></div>
      ${rows.length?`<div class="plan-list">${active.map(rowMarkup).join('')}</div>${done.length?`<details class="completed-plan"><summary>Выполнено · ${done.length} ${icon('chevron')}</summary><div class="plan-list">${done.map(rowMarkup).join('')}</div></details>`:''}`:
        '<div class="empty-state"><p>Здесь появятся задания из материалов. Добавьте первое — маленькое и выполнимое.</p><a class="button secondary" href="#archive">Выбрать материал</a></div>'}</section>`;
  }
  function routesBlock() {
    return `<section class="journey-routes"><div class="section-head"><div class="section-title"><h2>Маршруты</h2></div><a class="section-link" href="#journey/routes">Все маршруты ${icon('out')}</a></div><div class="route-grid">${journeyRoutes.map(item=>{
      const done = routeDone(item.id).size;
      const percent = Math.round(done/item.days.length*100);
      return `<a class="route-card" href="#journey/route/${item.id}"><span class="kind">${item.flexible?'В своём темпе':item.duration+' дней'}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><span class="route-meter"><i style="width:${percent}%"></i></span><small>${done} из ${item.days.length} шагов</small></a>`;
    }).join('')}</div></section>`;
  }
  function readingBlock() {
    const rows = Object.entries(reading()).filter(([id,value])=>byId.has(id) && value && (Number(value.percent)>0 || value.status && value.status!=='want'));
    return `<section class="journey-reading"><div class="section-head"><div class="section-title"><h2>Сейчас читаю</h2></div><a class="section-link" href="#library">Библиотека ${icon('out')}</a></div>
      ${rows.length?`<div class="link-list">${rows.slice(0,4).map(([id,value])=>{const item=byId.get(id);return `<a class="link-row" href="#read/${id}"><span><span class="row-meta">${esc(item.author)}</span><strong>${esc(item.title)}</strong><span class="secondary-copy">${Number(value.percent)||0}% · ${value.status==='done'?'Прочитано':'Читаю'}</span></span>${icon('book')}</a>`;}).join('')}</div>`:'<p class="secondary-copy">Откройте книжный конспект и отметьте «Читаю». Прогресс появится здесь.</p>'}</section>`;
  }
  function page() {
    const completed = plan().filter(item=>item.done).length;
    return `<div class="journey-dashboard"><div class="journey-top">${goalBlock()}${nextBlock()}</div>${moodBlock()}${planBlock()}
      <div class="journey-two"><section><div class="section-head"><div class="section-title"><h2>Продолжить слушать</h2></div><a class="section-link" href="#audio">Аудиотека ${icon('out')}</a></div>${audio.resumeMarkup()}</section>${readingBlock()}</div>
      ${routesBlock()}<p class="journey-local">Выполнено заданий: ${completed}. Цель, заметки, маршруты и прогресс хранятся только в этом браузере.</p></div>`;
  }
  function routesPage() {
    return `<div class="route-catalog"><p class="page-dek">Не нужно проходить всё сразу. Выберите один маршрут под текущую задачу и возвращайтесь без штрафа за паузы.</p><div class="route-grid">${journeyRoutes.map(item=>{
      const active = state().activeRoute===item.id;
      return `<article class="route-card"><span class="kind">${item.flexible?'В своём темпе':item.duration+' дней'}</span><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p><div class="action-row"><button type="button" class="button ${active?'secondary':'primary'}" data-route-start="${item.id}">${active?icon('check')+' Маршрут выбран':'Выбрать маршрут'}</button><a class="text-link" href="#journey/route/${item.id}">Смотреть шаги ${icon('arrow')}</a></div></article>`;
    }).join('')}</div></div>`;
  }
  function routePage(id) {
    const selected = route(id);
    if (!selected) return '';
    const done = routeDone(id);
    const notes = state().notes?.[id] || {};
    return `<div class="route-detail"><div class="route-overview"><p>${esc(selected.description)}</p><button type="button" class="button ${state().activeRoute===id?'secondary':'primary'}" data-route-start="${id}">${state().activeRoute===id?icon('check')+' Мой текущий маршрут':'Сделать текущим'}</button></div>
      <div class="route-days">${selected.days.map((day,index)=>{
        const item = day.material ? byId.get(day.material) : null;
        const href = item ? '#read/'+item.id : day.media==='support' ? '#support' : day.media==='videos'?'#video':'#audio/'+(day.media||'lectures');
        const complete = done.has(index);
        return `<article class="route-day ${complete?'is-done':''}"><div class="route-day-number"><span>${selected.flexible?'Шаг':'День'} ${index+1}</span><button type="button" class="round-btn" data-route-day="${index}" data-route-id="${id}" aria-pressed="${complete}" aria-label="${complete?'Вернуть шаг в работу':'Отметить шаг выполненным'}">${icon('check')}</button></div>
          <h2>${esc(day.title)}</h2>${item?`<a class="route-material" href="${href}"><span>${esc(item.tag)}</span><strong>${esc(item.title)}</strong>${icon('arrow')}</a>`:`<a class="route-material" href="${href}"><span>Материал для шага</span><strong>${day.media==='support'?'Точка опоры':'Аудиолекции'} </strong>${icon('arrow')}</a>`}
          <div class="practice-level"><span>Действие</span><p>${esc(day.task)}</p></div><label class="route-note"><span>${esc(day.note)}</span><textarea rows="2" maxlength="500" data-route-note="${index}" data-route-id="${id}" placeholder="Моя короткая заметка">${esc(notes[index]||'')}</textarea></label></article>`;
      }).join('')}</div></div>`;
  }
  function updateAndFocus(selector) { onUpdate?.(); document.querySelector(selector)?.focus({preventScroll:true}); }
  function click(button) {
    if (button.hasAttribute('data-practice-add') || button.hasAttribute('data-challenge-add')) {
      const challenge = button.hasAttribute('data-challenge-add');
      const item = byId.get(challenge?button.dataset.challengeAdd:button.dataset.practiceAdd);
      const action = challenge?button.dataset.challenge:button.dataset.action;
      if (item && action) add({text:action,sourceId:item.id,sourceTitle:item.title,href:'#read/'+item.id});
      return true;
    }
    if (button.hasAttribute('data-plan-toggle')) {
      const rows = plan(); const item = rows.find(row=>row.id===button.dataset.planToggle);
      if (item) { item.done=!item.done; item.completedAt=item.done?new Date().toISOString():''; writeState('plan',rows); if(item.done) completeStep?.(item); notify(item.done?'Шаг отмечен. Можно записать итог.':'Шаг снова в работе'); updateAndFocus(`[data-plan-toggle="${CSS.escape(item.id)}"]`); }
      return true;
    }
    if (button.hasAttribute('data-plan-remove')) {
      writeState('plan',plan().filter(item=>item.id!==button.dataset.planRemove)); notify('Задание удалено'); onUpdate?.(); return true;
    }
    if (button.hasAttribute('data-journey-mood')) {
      const mood = button.dataset.journeyMood; const next = {...state(),mood,activeRoute:moodRoutes[mood]}; writeState('journey',next);
      notify(`Подобран маршрут «${route(moodRoutes[mood]).title}»`); updateAndFocus(`[data-journey-mood="${CSS.escape(mood)}"]`); return true;
    }
    if (button.hasAttribute('data-route-start')) {
      writeState('journey',{...state(),activeRoute:button.dataset.routeStart}); notify(`Маршрут «${route(button.dataset.routeStart).title}» выбран`); updateAndFocus(`[data-route-start="${CSS.escape(button.dataset.routeStart)}"]`); return true;
    }
    if (button.hasAttribute('data-route-day')) {
      const id = button.dataset.routeId; const index = Number(button.dataset.routeDay); const current = state(); const done = routeDone(id);
      if (done.has(index)) done.delete(index); else done.add(index);
      writeState('journey',{...current,done:{...(current.done||{}),[id]:[...done].sort((a,b)=>a-b)}});
      notify(done.has(index)?'Шаг маршрута выполнен':'Шаг снова в работе'); updateAndFocus(`[data-route-day="${index}"][data-route-id="${CSS.escape(id)}"]`); return true;
    }
    if (button.hasAttribute('data-reading-status')) {
      const rows = reading(); const id = button.dataset.readingId; const status = button.dataset.readingStatus;
      rows[id] = {...(rows[id]||{}),status,percent:status==='done'?100:Number(rows[id]?.percent)||0,updated:new Date().toISOString()};
      writeState('reading',rows); updateAndFocus(`[data-reading-status="${status}"][data-reading-id="${CSS.escape(id)}"]`); return true;
    }
    return false;
  }
  function input(control) {
    if (control.matches('[data-plan-note]')) {
      const rows = plan(); const item = rows.find(row=>row.id===control.dataset.planNote);
      if (item) { item.note=control.value; writeState('plan',rows); }
      return true;
    }
    if (control.matches('[data-route-note]')) {
      const current = state(); const id = control.dataset.routeId; const index = control.dataset.routeNote;
      const notes = {...(current.notes||{})}; notes[id] = {...(notes[id]||{}),[index]:control.value};
      writeState('journey',{...current,notes}); return true;
    }
    if (control.matches('[data-reading-progress]')) {
      const rows = reading(); const id = control.dataset.readingProgress; const percent = Number(control.value);
      rows[id] = {...(rows[id]||{}),percent,status:percent>=100?'done':percent>0?'reading':'want',updated:new Date().toISOString()};
      writeState('reading',rows); control.closest('.reading-progress-panel').querySelector('output').textContent=percent+'%'; return true;
    }
    return false;
  }
  function submit(form) {
    if (!form.matches('[data-goal-form]')) return false;
    const goal = form.elements.goal.value.trim();
    if (!goal) { form.elements.goal.reportValidity(); return true; }
    writeState('journey',{...state(),goal}); notify('Цель на неделю сохранена'); onUpdate?.(); return true;
  }
  return {add,practice,bookProgress,page,routesPage,routePage,click,input,submit};
}
