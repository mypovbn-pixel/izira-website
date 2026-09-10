const menuButton=document.querySelector('.menu-toggle');const nav=document.querySelector('.site-nav');const navLinks=document.querySelectorAll('.site-nav a');function closeMenu(){menuButton?.setAttribute('aria-expanded','false');nav?.classList.remove('open');document.body.classList.remove('menu-open')}menuButton?.addEventListener('click',()=>{const isOpen=menuButton.getAttribute('aria-expanded')==='true';menuButton.setAttribute('aria-expanded',String(!isOpen));nav.classList.toggle('open',!isOpen);document.body.classList.toggle('menu-open',!isOpen)});navLinks.forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu()});document.getElementById('year').textContent=new Date().getFullYear();const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(reduceMotion){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in-view'))}else{const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}})},{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}

const aboutBlueprint=document.getElementById('about-blueprint-image');
if(aboutBlueprint){
  Promise.all([1,2,3,4,5].map(i=>fetch(`assets/about-blueprint/part${i}.txt`).then(response=>{
    if(!response.ok)throw new Error(`About artwork part ${i} failed to load`);
    return response.text();
  }))).then(parts=>{
    aboutBlueprint.src=`data:image/webp;base64,${parts.join('').replace(/\s+/g,'')}`;
  }).catch(error=>{
    console.error('Unable to load About artwork',error);
  });
}