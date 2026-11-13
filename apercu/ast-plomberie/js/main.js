(function () {
  var now = new Date();
  var day = now.getDay();
  var mins = now.getHours() * 60 + now.getMinutes();
  var weekday = day >= 1 && day <= 5;
  var open = weekday && mins >= 480 && mins < 1140;

  var etat = document.getElementById('etat');
  if (etat) {
    if (open) {
      etat.textContent = 'Ouvert aujourd’hui jusqu’à 19 h';
      etat.classList.add('ouvert');
    } else {
      etat.textContent = 'Fermé · lundi au vendredi, 8 h – 19 h';
    }
  }
  var row = document.querySelector('.horaires tr[data-j="' + day + '"]');
  if (row) row.classList.add('auj');
})();
