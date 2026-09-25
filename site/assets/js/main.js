(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var details = document.querySelectorAll('details.faq');
    details.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) {
          setTimeout(function () {
            d.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
        }
      });
    });
  });
})();
