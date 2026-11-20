function createJournalMotion(main) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.getElementById('reading-progress');
  const animations = new Set();
  let article = null;
  let pending = 0;
  const ease = 'cubic-bezier(.22,.72,.24,1)';
  function animate(node, frames, duration, delay=0) {
    if (!node || preference.matches || !node.animate) return;
    const animation = node.animate(frames,{duration,delay,easing:ease,fill:'backwards'});
    animations.add(animation);
    animation.finished.then(()=>animations.delete(animation),()=>animations.delete(animation));
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    let index=0;
    for (const entry of entries) {
      if(!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      animate(entry.target,[{opacity:.35,transform:'translateY(9px)'},{opacity:1,transform:'none'}],225,Math.min(index++,2)*22);
    }
  },{threshold:.08}) : null;
  function update() {
    pending=0;
    if(!article) return;
    const max=article.offsetHeight-window.innerHeight;
    const read=max<=0?1:Math.max(0,Math.min(1,-article.getBoundingClientRect().top/max));
    progress.firstElementChild.style.transform='scaleX('+read+')';
  }
  function queue() { if(article && !pending) pending=requestAnimationFrame(update); }
  window.addEventListener('scroll',queue,{passive:true});
  window.addEventListener('resize',queue);
  main.addEventListener('load',queue,true);
  function scan() {
    observer?.disconnect();
    if(!preference.matches) main.querySelectorAll('.story-card,.archive-figure,.thought-shelf,.media-card,.creator-card,.creator-feature').forEach(node=>observer?.observe(node));
  }
  function route() {
    article=main.querySelector('.article-top');
    progress.hidden=!article;
    update(); scan();
    const intro=main.querySelector('.page-heading,.article-intro,.support-page>h1');
    animate(intro,[{transform:'translateY(7px)',opacity:.55},{transform:'none',opacity:1}],205);
  }
  function cover() {
    const feature=main.querySelector('.cover');
    animate(feature?.querySelector('.cover-art'),[{opacity:.55,transform:'scale(1.018)'},{opacity:1,transform:'scale(1)'}],275);
    animate(feature?.querySelector('.cover-content'),[{opacity:.35,transform:'translateX(7px)'},{opacity:1,transform:'none'}],200);
  }
  preference.addEventListener('change',()=>{for(const animation of animations) animation.cancel();scan();});
  return {route,cover,scan};
}
