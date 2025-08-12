document.addEventListener("scroll", function() {
    let navLinks = document.querySelectorAll('.nav-side .nav-link');
    let navBar = document.getElementById('nav-side');

    // 这个地方进行修改 改为别的id
    let introSection = document.getElementById('header-container'); // 获取id为intro的section元素

    // 检查页面滚动位置是否已滚动至intro部分以下
    let introBottom = introSection.getBoundingClientRect().bottom;
    if (window.scrollY > introBottom) {
        navBar.style.display = 'block'; // 如果是，则显示导航栏
    } else {
        navBar.style.display = 'none'; // 如果不是，则隐藏导航栏
    }

    // 检查是否为移动设备窗口大小，并相应地隐藏导航栏
    if (window.innerWidth < 768) {
        navBar.style.display = 'none';
    }

    navLinks.forEach(link => {
        let section = document.querySelector(link.getAttribute('href'));
        if (!section) return; // 如果section不存在，则跳过

        const sectionTop = section.getBoundingClientRect().top;
        const sectionBottom = section.getBoundingClientRect().bottom;

        // 检查section是否在视窗内，并相应地添加或移除active-link类
        if (sectionTop < window.innerHeight && sectionBottom >= 0) {
            link.classList.add('active-link');
        } else {
            link.classList.remove('active-link');
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // 获取所有导航链接和对应的页面内容部分
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = Array.from(navLinks).map(link => {
      const id = link.getAttribute('href').replace('#', '');
      return document.getElementById(id);
    });
  
    // 监听页面滚动，动态添加 `.active` 类
    function onScroll() {
      let scrollPos = window.scrollY || window.pageYOffset;
      for (let i = 0; i < sections.length; i++) {
        const sec = sections[i];
        if (!sec) continue;
        const offset = sec.offsetTop - 120; // 加上偏移量
        const nextOffset = i < sections.length - 1 ? sections[i + 1].offsetTop - 120 : Infinity;
        
        if (scrollPos >= offset && scrollPos < nextOffset) {
          navLinks.forEach(link => link.classList.remove('active'));
          navLinks[i].classList.add('active');
          break;
        }
      }
    }
  
    window.addEventListener('scroll', onScroll);
    onScroll(); // 页面加载时触发一次
  
    // 确保侧边栏在页面滚动时不会消失
    const navSide = document.getElementById('nav-side');
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
  