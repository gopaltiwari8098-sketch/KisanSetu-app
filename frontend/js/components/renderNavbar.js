function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.navbar__links a');

  links.forEach((link) => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
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

document.addEventListener('DOMContentLoaded', () => {
  highlightActiveNavLink();
  freeEntranceAnimations();
});