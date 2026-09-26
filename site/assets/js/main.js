(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var details = document.querySelectorAll('details.faq');
    details.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          setTimeout(function () {
            d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
          }, reduce ? 0 : 150);
        }
      });
    });

    var lastTop = 0;
    var header = document.querySelector('.site-header');
    if (header) {
      window.addEventListener('scroll', function () {
        var y = window.scrollY || window.pageYOffset || 0;
        if (y > lastTop && y > 120) header.classList.add('is-scroll-down');
        else header.classList.remove('is-scroll-down');
        lastTop = y;
      }, { passive: true });
    }
  });
})();
