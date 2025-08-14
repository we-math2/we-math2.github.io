/* ========= 折叠/展开状态 ========= */
function setCollapsed(navSide, collapsed) {
  if (!navSide) return;
  if (collapsed) {
    navSide.classList.add('collapsed');
    localStorage.setItem('navCollapsed', '1');
  } else {
    navSide.classList.remove('collapsed');
    localStorage.setItem('navCollapsed', '0');
  }
}

/* ========= 注入顶部栏（标题 + 按钮） ========= */
function injectNavHeader(navSide) {
  if (!navSide || navSide.querySelector('.nav-header')) return;

  const header = document.createElement('div');
  header.className = 'nav-header';

  const title = document.createElement('div');
  title.className = 'nav-title';
  title.textContent = 'Content';

  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Toggle navigation');
  toggle.setAttribute('title', '收起/展开');
  toggle.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.7 6.7a1 1 0 0 1 0 1.4L10.8 12l3.9 3.9a1 1 0 1 1-1.4 1.4l-4.6-4.6a1 1 0 0 1 0-1.4l4.6-4.6a1 1 0 0 1 1.4 0z" fill="currentColor"/>
    </svg>
  `;

  header.appendChild(title);
  header.appendChild(toggle);
  navSide.insertBefore(header, navSide.firstChild);

  // 恢复上次状态
  const saved = localStorage.getItem('navCollapsed') === '1';
  setCollapsed(navSide, saved);

  // 点击切换
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const collapsed = navSide.classList.contains('collapsed');
    setCollapsed(navSide, !collapsed);
  });
}

/* ========= 可选：折叠时为每个链接提供 tooltip 文案 ========= */
function prepareLinkTooltips(navSide) {
  const links = navSide.querySelectorAll('.nav-link');
  links.forEach(link => {
    const labelEl = link.querySelector('.main-title');
    if (labelEl) {
      link.setAttribute('data-label', labelEl.textContent.trim());
    }
  });
}

/* ========= 滚动联动：显示/隐藏 + 区块激活（保留你的逻辑） ========= */
document.addEventListener("scroll", function() {
  const navBar = document.getElementById('nav-side');
  if (!navBar) return;

  // 这个地方进行修改 改为别的id
  const introSection = document.getElementById('header-container');
  if (!introSection) return;

  const introBottom = introSection.getBoundingClientRect().bottom;
  if (window.scrollY > introBottom) {
    navBar.style.display = 'block';
    navBar.classList.add('visible');
  } else {
    navBar.style.display = 'none';
    navBar.classList.remove('visible');
  }

  if (window.innerWidth < 768) {
    navBar.style.display = 'none';
    navBar.classList.remove('visible');
  }

  const navLinks = document.querySelectorAll('.nav-side .nav-link');
  navLinks.forEach(link => {
    const section = document.querySelector(link.getAttribute('href'));
    if (!section) return;

    const sectionTop = section.getBoundingClientRect().top;
    const sectionBottom = section.getBoundingClientRect().bottom;

    if (sectionTop < window.innerHeight && sectionBottom >= 0) {
      link.classList.add('active-link');
    } else {
      link.classList.remove('active-link');
    }
  });
});

/* ========= 初始绑定 ========= */
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.nav-link');

  // sections 用于滚动时高亮
  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute('href').replace('#', '');
    return document.getElementById(id);
  });

  function onScroll() {
    const scrollPos = window.scrollY || window.pageYOffset;
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec) continue;
      const offset = sec.offsetTop - 120; // 偏移量
      const nextOffset = i < sections.length - 1 ? sections[i + 1].offsetTop - 120 : Infinity;

      if (scrollPos >= offset && scrollPos < nextOffset) {
        navLinks.forEach(link => link.classList.remove('active'));
        navLinks[i].classList.add('active');
        break;
      }
    }
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  // 固定定位逻辑（保留你的原逻辑）
  const navSide = document.getElementById('nav-side');
  if (!navSide) return;

  // 注入顶部栏 + 恢复状态
  injectNavHeader(navSide);

  // 折叠态简易 tooltip（可选用）
  prepareLinkTooltips(navSide);

  // 悬浮时让 tooltip 垂直居中（如果启用 tooltip 伪元素）
  navSide.addEventListener('mousemove', (e) => {
    if (!navSide.classList.contains('collapsed')) return;
    const target = e.target.closest('.nav-link');
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    navSide.style.setProperty('--tooltip-y', `${midY}px`);
  });

  // 随滚动修正定位（保留）
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      navSide.style.position = 'fixed';
      navSide.style.top = '100px';
    } else {
      navSide.style.position = 'absolute';
      navSide.style.top = '0';
    }
  });
});