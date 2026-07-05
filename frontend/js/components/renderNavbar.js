function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.navbar__links a');
  links.forEach((link) => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active-link');
    }
  });
}

function freeEntranceAnimations() {
  const animatedEls = document.querySelectorAll(
    '.features__grid > *, .stats-grid > *, .mandi-grid > *, .quicklinks-grid > *'
  );
  animatedEls.forEach((el) => {
    el.addEventListener('animationend', function () {
      this.style.animation = 'none';
    });
  });
}

function initHamburgerMenu() {
  const toggle = document.querySelector('.navbar__menu-toggle');
  const links = document.querySelector('.navbar__links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.textContent = links.classList.contains('open') ? '✕' : '☰';
  });

  // Close menu when link clicked
  links.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNavLink();
  freeEntranceAnimations();
  initHamburgerMenu();
});