function highlightActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.navbar__links a');

  links.forEach((link) => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage) {
      link.style.borderBottomColor = 'var(--color-accent)';
      link.style.color = 'var(--color-accent-dark)';
    }
  });
}

document.addEventListener('DOMContentLoaded', highlightActiveNavLink);