// YouTube: carrega o player só quando clicar (site mais rápido)
document.querySelectorAll('.yt').forEach(yt=>{
  yt.querySelector('button').addEventListener('click',()=>{
    yt.innerHTML='<iframe src="https://www.youtube.com/embed/'+yt.dataset.id+'?autoplay=1" title="Vídeo" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
  });
});
// Previews dos projetos: tocam quando o bloco aparece na tela
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const vids=document.querySelectorAll('.card video');
if(!reduce && 'IntersectionObserver' in window){
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){ if(!v.src) v.src=v.dataset.src; v.play().catch(()=>{}); } else v.pause();
  }),{threshold:.35});
  vids.forEach(v=>io.observe(v));
}
// Pausa o vídeo de fundo se o usuário prefere menos movimento
const hv=document.querySelector('.hero video');
if(hv && reduce){ hv.removeAttribute('autoplay'); hv.pause(); }
// "Ver mais / Ver menos": mostra ou esconde o conteúdo ligado ao botão
document.querySelectorAll('.toggle').forEach(b=>{
  const alvo=document.getElementById(b.getAttribute('aria-controls'));
  b.addEventListener('click',()=>{
    const aberto=b.getAttribute('aria-expanded')==='true';
    b.setAttribute('aria-expanded',String(!aberto));
    alvo.hidden=aberto;
    b.textContent=aberto?'Ver mais':'Ver menos';
  });
});
// Menu hambúrguer: abre e fecha o menu em telas estreitas
(function(){
  const header=document.querySelector('header');
  const btn=header&&header.querySelector('.menu-btn');
  if(!btn) return;
  const definir=(aberto)=>{
    header.classList.toggle('open',aberto);
    btn.setAttribute('aria-expanded',String(aberto));
    btn.setAttribute('aria-label',aberto?'Fechar menu':'Abrir menu');
  };
  btn.addEventListener('click',()=>definir(!header.classList.contains('open')));
  header.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>definir(false)));
  addEventListener('keydown',e=>{ if(e.key==='Escape') definir(false); });
  matchMedia('(min-width:821px)').addEventListener('change',e=>{ if(e.matches) definir(false); });
})();
