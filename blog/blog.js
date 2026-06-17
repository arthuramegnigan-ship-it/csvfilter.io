// CSVFilter.io — Blog scripts (shared)
(function () {
  if (localStorage.getItem('fio-theme') === 'light') document.body.classList.add('light');
  var btn = document.getElementById('themeToggle');
  function sync() { if (btn) btn.textContent = document.body.classList.contains('light') ? '🌑' : '🌙'; }
  sync();
  if (btn) btn.addEventListener('click', function () {
    var light = document.body.classList.toggle('light');
    localStorage.setItem('fio-theme', light ? 'light' : 'dark');
    sync();
  });
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
